import { encodePaymentRequired, decodePaymentPayload, encodeSettlementResponse, HEADER_PAYMENT_REQUIRED, HEADER_PAYMENT_SIGNATURE, HEADER_PAYMENT_RESPONSE, } from "@ton-x402/core";
// ============================================================
// Facilitator client helpers
// ============================================================
async function callFacilitator(facilitatorUrl, endpoint, body) {
    const res = await fetch(`${facilitatorUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Facilitator ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
    }
    return res.json();
}
// ============================================================
// Payment Gate — wraps a route handler with x402 payment logic
// ============================================================
export function paymentGate(handler, options) {
    const { config, description } = options;
    const paymentDetails = {
        scheme: "ton-v1",
        network: config.network,
        amount: config.amount,
        asset: config.asset,
        payTo: config.payTo,
        facilitatorUrl: config.facilitatorUrl,
    };
    const paymentRequired = {
        version: "x402-ton-v1",
        description: description ?? config.description,
        accepts: [paymentDetails],
    };
    const encodedPaymentRequired = encodePaymentRequired(paymentRequired);
    return async (request) => {
        const paymentSignatureHeader = request.headers.get(HEADER_PAYMENT_SIGNATURE);
        // ---- No payment: return 402 ----
        if (!paymentSignatureHeader) {
            return new Response(JSON.stringify({
                error: "Payment required",
                ...paymentRequired,
            }), {
                status: 402,
                headers: {
                    "Content-Type": "application/json",
                    [HEADER_PAYMENT_REQUIRED]: encodedPaymentRequired,
                },
            });
        }
        // ---- Has payment: verify & settle ----
        let paymentPayload;
        try {
            paymentPayload = decodePaymentPayload(paymentSignatureHeader);
        }
        catch {
            return new Response(JSON.stringify({ error: "Invalid PAYMENT-SIGNATURE header" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        // Step 1: Verify via facilitator
        const verifyBody = { paymentPayload, paymentDetails };
        let verifyResult;
        try {
            verifyResult = await callFacilitator(config.facilitatorUrl, "/verify", verifyBody);
        }
        catch (err) {
            const settlement = {
                success: false,
                error: `Verification failed: ${err.message}`,
                network: config.network,
            };
            return new Response(JSON.stringify(settlement), {
                status: 402,
                headers: {
                    "Content-Type": "application/json",
                    [HEADER_PAYMENT_REQUIRED]: encodedPaymentRequired,
                    [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
                },
            });
        }
        if (!verifyResult.valid) {
            const settlement = {
                success: false,
                error: verifyResult.reason ?? "Payment verification failed",
                network: config.network,
            };
            return new Response(JSON.stringify(settlement), {
                status: 402,
                headers: {
                    "Content-Type": "application/json",
                    [HEADER_PAYMENT_REQUIRED]: encodedPaymentRequired,
                    [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
                },
            });
        }
        // Step 2: Settle via facilitator
        const settleBody = { paymentPayload, paymentDetails };
        let settleResult;
        try {
            settleResult = await callFacilitator(config.facilitatorUrl, "/settle", settleBody);
        }
        catch (err) {
            const settlement = {
                success: false,
                error: `Settlement failed: ${err.message}`,
                network: config.network,
            };
            return new Response(JSON.stringify(settlement), {
                status: 402,
                headers: {
                    "Content-Type": "application/json",
                    [HEADER_PAYMENT_REQUIRED]: encodedPaymentRequired,
                    [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
                },
            });
        }
        if (!settleResult.success) {
            const settlement = {
                success: false,
                error: settleResult.error ?? "Settlement failed on-chain",
                network: config.network,
            };
            return new Response(JSON.stringify(settlement), {
                status: 402,
                headers: {
                    "Content-Type": "application/json",
                    [HEADER_PAYMENT_REQUIRED]: encodedPaymentRequired,
                    [HEADER_PAYMENT_RESPONSE]: encodeSettlementResponse(settlement),
                },
            });
        }
        // Step 3: Payment confirmed — call the actual handler
        const handlerResponse = await handler(request);
        // Step 4: Add PAYMENT-RESPONSE header
        const settlement = {
            success: true,
            txHash: settleResult.txHash,
            network: config.network,
        };
        const finalHeaders = new Headers(handlerResponse.headers);
        finalHeaders.set(HEADER_PAYMENT_RESPONSE, encodeSettlementResponse(settlement));
        return new Response(handlerResponse.body, {
            status: handlerResponse.status,
            statusText: handlerResponse.statusText,
            headers: finalHeaders,
        });
    };
}
//# sourceMappingURL=index.js.map