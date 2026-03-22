/**
 * buy-image.ts
 *
 * Interactive agent flow:
 *   1. Search images by tag
 *   2. Display results, user picks an index
 *   3. GET /download → 402
 *   4. GET /download + BOC → 200 → save to disk
 *
 * Usage:
 *   SEARCH_TAG=indoor pnpm buy
 *   SEARCH_TAG=people SERVER_URL=http://localhost:3000 pnpm buy
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { x402Fetch } from "@ton-x402/client";
import { nanoToTon } from "@ton-x402/core";
import { TonClient, WalletContractV5R1 } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";
const SEARCH_TAG = process.env.SEARCH_TAG ?? "";

function ask(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
    const mnemonic = process.env.WALLET_MNEMONIC;
    if (!mnemonic) {
        console.error("Set WALLET_MNEMONIC env var (24-word mnemonic)");
        process.exit(1);
    }

    const rpcUrl = process.env.TON_RPC_URL ?? "https://testnet.toncenter.com/api/v2/jsonRPC";
    const keypair = await mnemonicToPrivateKey(mnemonic.split(" "));
    const wallet = WalletContractV5R1.create({ publicKey: keypair.publicKey, workchain: 0 });
    const client = new TonClient({ endpoint: rpcUrl, apiKey: process.env.RPC_API_KEY });
    const walletContract = client.open(wallet);

    const balance = await client.getBalance(wallet.address);
    const seqno = await walletContract.getSeqno();

    console.log("\n  Wallet:  ", wallet.address.toString({ bounceable: false }));
    console.log("  Balance: ", nanoToTon(balance.toString()), "TON");
    console.log("  Seqno:   ", seqno);

    // ── Step 1: Search ───────────────────────────────────────────────
    const searchUrl = SEARCH_TAG
        ? `${SERVER_URL}/api/images/search?tags=${encodeURIComponent(SEARCH_TAG)}&limit=10`
        : `${SERVER_URL}/api/images/search?limit=10`;

    console.log(`\nSearching: ${searchUrl}\n`);
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
        console.error(`Search failed: ${searchRes.status}`);
        process.exit(1);
    }

    const { images } = await searchRes.json() as {
        images: { id: string; price: string; attributs_image: string[] }[];
    };

    if (!images || images.length === 0) {
        console.error(`No images found${SEARCH_TAG ? ` for tag "${SEARCH_TAG}"` : ""}`);
        process.exit(1);
    }

    // ── Step 2: Display results & pick ──────────────────────────────
    images.forEach((img, i) => {
        const price = (Number(img.price) / 1e9).toFixed(2);
        const tags = img.attributs_image.join(", ");
        console.log(`  [${i}] ${img.id}  |  ${price} BSA USD  |  ${tags}`);
    });

    const answer = await ask(`\nPick an image [0-${images.length - 1}]: `);
    const idx = parseInt(answer.trim(), 10);
    if (isNaN(idx) || idx < 0 || idx >= images.length) {
        console.error("Invalid selection.");
        process.exit(1);
    }

    const image = images[idx];
    const downloadUrl = `${SERVER_URL}/api/images/${image.id}/download`;

    // ── Step 3: Probe (GET → 402) ────────────────────────────────────
    console.log(`\nProbing: GET ${downloadUrl}`);
    const probe = await fetch(downloadUrl);
    console.log(`  → ${probe.status} ${probe.statusText}`);
    if (probe.status !== 402) {
        console.error("Expected 402 but got something else.");
        process.exit(1);
    }
    console.log("  Payment required confirmed — sending signed BOC...");

    // ── Step 4: Pay via x402 (GET + BOC → 200) ──────────────────────
    const result = await x402Fetch(downloadUrl, {
        wallet,
        keypair,
        seqno,
        client,
        verbose: true,
    });

    if (!result.response.ok) {
        if (result.paid) {
            console.error("Payment broadcast but settlement failed — tx may still confirm on-chain");
        }
        console.error(`Download failed: ${result.response.status}`);
        console.error(await result.response.text());
        process.exit(1);
    }

    // ── Step 5: Save to disk ─────────────────────────────────────────
    const data = await result.response.json() as { image_name: string; image_data: string };
    const outDir = path.join(process.cwd(), "downloads");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, data.image_name);
    fs.writeFileSync(outPath, Buffer.from(data.image_data, "base64"));

    console.log(`\nPayment confirmed!`);
    if (result.settlement?.txHash) {
        console.log(`  TX Hash: ${result.settlement.txHash}`);
    }
    console.log(`  Saved to: ${outPath}`);
}

main().catch(console.error);
