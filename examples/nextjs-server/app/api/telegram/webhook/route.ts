import { NextResponse } from "next/server";
import { addImage } from "../../../../lib/image-storage";

// ============================================================
// POST /api/telegram/webhook
//
// Receives native Telegram updates directly (no separate bot).
// Telegram pushes updates here when a user sends a photo.
//
// Caption format:
//   "sunset, beach, ocean"           → tags only, default price 0.01 BSA
//   "sunset, beach | 0.05"           → tags + price in BSA USD
//   "sunset, beach | 0.05 | UQ_..."  → tags + price + wallet
//
// No caption → tags = ["untagged"], default price.
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const DEFAULT_PRICE_BSA = "0.01";

function bsaToAtomic(bsa: string): string {
  const parts = bsa.split(".");
  const whole = BigInt(parts[0]) * 1_000_000_000n;
  if (parts.length === 1) return whole.toString();
  const frac = parts[1].padEnd(9, "0").slice(0, 9);
  return (whole + BigInt(frac)).toString();
}

function parseCaption(caption?: string): {
  tags: string[];
  price: string;
  wallet: string;
} {
  if (!caption || caption.trim() === "") {
    return {
      tags: ["untagged"],
      price: bsaToAtomic(DEFAULT_PRICE_BSA),
      wallet: "",
    };
  }

  const parts = caption.split("|").map((p) => p.trim());

  // Tags (first part, comma-separated)
  const tags = parts[0]
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  // Price (second part, optional)
  const priceStr = parts[1]?.trim();
  let price: string;
  try {
    const n = parseFloat(priceStr || "");
    price = isNaN(n) || n < 0 ? bsaToAtomic(DEFAULT_PRICE_BSA) : bsaToAtomic(priceStr!);
  } catch {
    price = bsaToAtomic(DEFAULT_PRICE_BSA);
  }

  // Wallet (third part, optional)
  const wallet = parts[2]?.trim() ?? "";

  return { tags: tags.length > 0 ? tags : ["untagged"], price, wallet };
}

async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  // 1. Get file path from Telegram
  const fileRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
  );
  const fileData = await fileRes.json();

  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error(`Telegram getFile failed: ${JSON.stringify(fileData)}`);
  }

  // 2. Download the actual file
  const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
  const res = await fetch(downloadUrl);

  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("[webhook] Failed to send Telegram reply:", e);
  }
}

// Next.js convention, that runs this function when a POST is sent to 
export async function POST(req: Request) {
  // Telegram expects 200 OK quickly, otherwise it retries
  try {
    if (!BOT_TOKEN) {
      console.error("[webhook] TELEGRAM_BOT_TOKEN not set");
      return NextResponse.json({ ok: true });
    }

    const update = await req.json();

    // Only handle messages with photos
    const message = update.message;
    if (!message?.photo || message.photo.length === 0) {
      // Not a photo message — acknowledge silently
      return NextResponse.json({ ok: true });
    }

    const user = message.from;
    const chatId = message.chat.id;
    const caption = message.caption;

    // Take the largest photo (last in array)
    const photo = message.photo[message.photo.length - 1];

    // Parse caption → tags, price, wallet
    const { tags, price, wallet } = parseCaption(caption);

    // Download photo from Telegram servers
    let photoBuffer: Buffer;
    try {
      photoBuffer = await downloadTelegramFile(photo.file_id);
    } catch (e) {
      console.error("[webhook] Failed to download photo:", e);
      await sendTelegramMessage(chatId, "Failed to download your photo. Please try again.");
      return NextResponse.json({ ok: true });
    }

    // Encode to base64
    const base64Data = photoBuffer.toString("base64");

    // Build image name
    const imageName = `photo_${user.id}_${photo.file_unique_id}.jpg`;

    // Store via shared layer
    const record = addImage(
      imageName,
      String(user.id),
      wallet,
      tags,
      price,
      base64Data,
    );

    // Reply to user on Telegram
    const priceDisplay = (Number(BigInt(price)) / 1_000_000_000).toFixed(
      price.length > 9 ? 2 : Math.min(price.replace(/0+$/, "").length, 4),
    );

    await sendTelegramMessage(
      chatId,
      `Image listed on the marketplace!\n\n`
        + `<b>ID:</b> <code>${record.id}</code>\n`
        + `<b>Tags:</b> ${tags.join(", ")}\n`
        + `<b>Price:</b> ${priceDisplay} BSA USD\n\n`
        + `Buyers can find it at:\n`
        + `<code>GET /api/images/${record.id}</code>`,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] Error:", error);
    // Always return 200 to Telegram, otherwise it retries forever
    return NextResponse.json({ ok: true });
  }
}