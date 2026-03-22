import { NextRequest } from "next/server";
import {
  encodePaymentRequired,
  decodePaymentPayload,
  encodeSettlementResponse,
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_SIGNATURE,
  HEADER_PAYMENT_RESPONSE,
  type PaymentRequired,
  type PaymentDetails,
  type PaymentPayload,
  type SettlementResponse,
} from "@ton-x402/core";
import { getImageById, getImageData } from "../../../../../lib/image-storage";
import type { ImageDownloadResponse } from "../../../../../lib/types";

// ============================================================
// Config
// ============================================================

const JETTON_ASSET =
  process.env.JETTON_MASTER_ADDRESS ||
  "kQCd6G7c_HUBkgwtmGzpdqvHIQoNkYOEE0kSWoc5v57hPPnW";

const NETWORK = (process.env.TON_NETWORK as "testnet" | "mainnet") ?? "testnet";

const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "http://localhost:3000/api/facilitator";

// PAY_TO is per-image (seller's wallet), not a global constant

// ============================================================
// Facilitator helper
// ============================================================

async function callFacilitator<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${FACILITATOR_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Facilitator ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ============================================================
// GET /api/images/:id/download
//
// Manual x402 flow so we can set the price PER IMAGE
// instead of a static paymentGate config.
//
// 1. Look up image → get its price
// 2. No payment header → 402 with that price
// 3. Payment header → verify → settle → serve image
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // ── Look up image ───────────────────────────────────────────
  const record = getImageById(id);
  if (!record) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  if (!record.owner_walletAddress) {
    return Response.json(
      { error: "Image has no seller wallet configured" },
      { status: 500 },
    );
  }

  // ── Build payment details — pay directly to the seller's wallet
  const paymentDetails: PaymentDetails = {
    scheme: "ton-v1",
    network: NETWORK,
    amount: record.price,
    asset: JETTON_ASSET,
    payTo: record.owner_walletAddress,
    facilitatorUrl: FACILITATOR_URL,
    decimals: 9,
  };

  const paymentRequired: PaymentRequired = {
    version: "x402-ton-v1",
    description: `Purchase "${record.image_name}" (${record.price} atomic BSA USD)`,
    accepts: [paymentDetails],
  };

  const encodedPR = encodePaymentRequired(paymentRequired);

  // ── Check for payment header ────────────────────────────────
  const sigHeader = request.headers.get(HEADER_PAYMENT_SIGNATURE);

  if (!sigHeader) {
    // No payment → return 402
    return new Response(
      JSON.stringify({ error: "Payment required", ...paymentRequired }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          [HEADER_PAYMENT_REQUIRED]: encodedPR,
        },
      },
    );
  }

  // ── Decode payment payload ──────────────────────────────────
  let paymentPayload: PaymentPayload;
  try {
    paymentPayload = decodePaymentPayload(sigHeader);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid PAYMENT-SIGNATURE header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Verify via facilitator ──────────────────────────────────
  try {
    const verifyResult = await callFacilitator<{ valid: boolean; reason?: string }>(
      "/verify",
      { paymentPayload, paymentDetails },
    );

    if (!verifyResult.valid) {
      const settlement: SettlementResponse = {
        success: false,
        error: verifyResult.reason ?? "Payment verification failed",
        network: NETWORK,
      };
      return new Response(JSON.stringify(settlement), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          [HEADER_PAYMENT_REQUIRED]: encodedPR,
          [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
        },
      });
    }
  } catch (err) {
    const settlement: SettlementResponse = {
      success: false,
      error: `Verification error: ${(err as Error).message}`,
      network: NETWORK,
    };
    return new Response(JSON.stringify(settlement), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        [HEADER_PAYMENT_REQUIRED]: encodedPR,
        [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
      },
    });
  }

  // ── Settle via facilitator ──────────────────────────────────
  let txHash: string | undefined;
  try {
    const settleResult = await callFacilitator<{
      success: boolean;
      txHash?: string;
      error?: string;
    }>("/settle", { paymentPayload, paymentDetails });

    if (!settleResult.success) {
      const settlement: SettlementResponse = {
        success: false,
        error: settleResult.error ?? "Settlement failed on-chain",
        network: NETWORK,
      };
      return new Response(JSON.stringify(settlement), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          [HEADER_PAYMENT_REQUIRED]: encodedPR,
          [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
        },
      });
    }

    txHash = settleResult.txHash;
  } catch (err) {
    const settlement: SettlementResponse = {
      success: false,
      error: `Settlement error: ${(err as Error).message}`,
      network: NETWORK,
    };
    return new Response(JSON.stringify(settlement), {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        [HEADER_PAYMENT_REQUIRED]: encodedPR,
        [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
      },
    });
  }

  // ── Payment confirmed — serve the image ─────────────────────
  const imageData = getImageData(id);
  if (!imageData) {
    return Response.json({ error: "Image data not found on disk" }, { status: 404 });
  }

  const body: ImageDownloadResponse = {
    id: record.id,
    image_name: record.image_name,
    attributs_image: record.attributs_image,
    owner_walletAddress: record.owner_walletAddress,
    image_data: imageData,
  };

  const settlement: SettlementResponse = {
    success: true,
    txHash,
    network: NETWORK,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
    },
  });
}