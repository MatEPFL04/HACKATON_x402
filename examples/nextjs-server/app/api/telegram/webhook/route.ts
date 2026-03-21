import { NextResponse } from "next/server";
import { addImage } from "../../../../lib/image-storage";
import { extractAttributes } from "../../../../lib/extract-attributes";
import { getWallet, saveWallet } from "../../../../lib/user-wallet-store";

// ============================================================
// Config
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

// ============================================================
// Conversation state machine (in-memory)
// ============================================================

type Step = "WAIT_IMAGE" | "WAIT_DESCRIPTION" | "WAIT_PRICE" | "WAIT_WALLET";

interface ConvState {
  step: Step;
  fileId?: string;
  description?: string;
  priceAtomic?: string;
  priceDisplay?: number;
  wallet?: string;
  userId: number;
  updatedAt: number;
}

// chatId → state
const sessions = new Map<number, ConvState>();

// Clean up sessions older than 30 minutes
function cleanSessions() {
  const ttl = 30 * 60 * 1000;
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.updatedAt > ttl) sessions.delete(id);
  }
}

// ============================================================
// Helpers
// ============================================================

function bsaToAtomic(bsa: string): string {
  const parts = bsa.split(".");
  const whole = BigInt(parts[0]) * 1_000_000_000n;
  if (parts.length === 1) return whole.toString();
  const frac = parts[1].padEnd(9, "0").slice(0, 9);
  return (whole + BigInt(frac)).toString();
}

async function send(chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch((e) => console.error("[webhook] sendMessage failed:", e));
}

async function downloadFile(fileId: string): Promise<Buffer> {
  const r = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const d = await r.json();
  if (!d.ok || !d.result?.file_path)
    throw new Error(`getFile failed: ${JSON.stringify(d)}`);

  const res = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${d.result.file_path}`
  );
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ============================================================
// Step handlers
// ============================================================

async function handleStart(chatId: number, userId: number) {
  cleanSessions();
  sessions.set(chatId, { step: "WAIT_IMAGE", userId, updatedAt: Date.now() });
  const knownWallet = getWallet(userId);
  const steps = knownWallet
    ? "🖼 Image  →  📝 Description  →  💵 Prix (USD)"
    : "🖼 Image  →  📝 Description  →  💵 Prix (USD)  →  👛 Wallet TON";
  const total = knownWallet ? "3" : "4";
  await send(
    chatId,
    "👋 Bienvenue dans <b>MAR marketplace!</b>\n\n" +
    `Nous avons besoin des infos suivantes :\n${steps}\n\n` +
    (knownWallet ? `👛 Wallet enregistré : <code>${knownWallet}</code>\n\n` : "") +
    `<b>Étape 1/${total}</b> — Envoie-moi une <b>photo</b> du produit.`
  );
}

async function handleImage(chatId: number, fileId: string, state: ConvState) {
  state.fileId = fileId;
  state.step = "WAIT_DESCRIPTION";
  state.updatedAt = Date.now();
  const total = getWallet(state.userId) ? "3" : "4";
  await send(
    chatId,
    "✅ Image reçue !\n\n" +
    `<b>Étape 2/${total}</b> — Envoie-moi une <b>description</b> du produit.`
  );
}

async function handleDescription(chatId: number, text: string, state: ConvState) {
  if (text.trim().length < 5) {
    await send(chatId, "❌ Description trop courte (min. 5 caractères). Réessaie.");
    return;
  }
  state.description = text.trim();
  state.step = "WAIT_PRICE";
  state.updatedAt = Date.now();
  const total = getWallet(state.userId) ? "3" : "4";
  await send(
    chatId,
    "✅ Description enregistrée !\n\n" +
    `<b>Étape 3/${total}</b> — Quel est le <b>prix en USD</b> ? (ex: <code>0.05</code>)`
  );
}

async function finalizeListing(chatId: number, wallet: string, state: ConvState) {
  const fileId = state.fileId!;
  const description = state.description!;
  const priceAtomic = state.priceAtomic!;
  const priceDisplay = state.priceDisplay!;

  let photoBuffer: Buffer;
  try {
    photoBuffer = await downloadFile(fileId);
  } catch (e) {
    await send(chatId, "❌ Impossible de télécharger la photo. Recommence avec /start.");
    sessions.delete(chatId);
    return;
  }

  const base64Data = photoBuffer.toString("base64");
  const imageName = `photo_${state.userId}_${Date.now()}.jpg`;
  const finalTags = await extractAttributes(description);

  const record = await addImage(
    imageName,
    String(state.userId),
    wallet,
    finalTags,
    priceAtomic,
    base64Data
  );

  sessions.delete(chatId);

  await send(
    chatId,
    `🎉 <b>Annonce publiée !</b>\n\n` +
    `📝 <b>Description :</b> ${description}\n` +
    `🏷 <b>Tags :</b> ${finalTags.join(", ")}\n` +
    `💵 <b>Prix :</b> ${priceDisplay.toFixed(2)} USD\n` +
    `👛 <b>Wallet :</b> <code>${wallet}</code>\n` +
    `🆔 <b>ID :</b> <code>${record.id}</code>\n\n` +
    `Tape /start pour créer une nouvelle annonce.`
  );
}

async function handlePrice(chatId: number, text: string, state: ConvState) {
  const n = parseFloat(text.trim().replace(",", "."));
  if (isNaN(n) || n <= 0) {
    await send(chatId, "❌ Prix invalide. Entre un nombre positif (ex: <code>1.50</code>).");
    return;
  }

  state.priceAtomic = bsaToAtomic(n.toFixed(9));
  state.priceDisplay = n;
  state.updatedAt = Date.now();

  // If we already know this user's wallet, skip the wallet step entirely
  const knownWallet = getWallet(state.userId);
  if (knownWallet) {
    await finalizeListing(chatId, knownWallet, state);
    return;
  }

  state.step = "WAIT_WALLET";
  await send(
    chatId,
    "✅ Prix enregistré !\n\n" +
    "<b>Étape 4/4</b> — Quelle est ton <b>adresse wallet TON</b> ?\n" +
    "(ex: <code>UQB...xyz</code> ou <code>EQB...xyz</code>)\n\n" +
    "C'est l'adresse qui recevra le paiement. Elle sera mémorisée pour tes prochaines annonces."
  );
}

// Basic TON address validation: starts with UQ/EQ/kQ/0Q and is ~48 chars
function isValidTonAddress(addr: string): boolean {
  return /^[UEkQ0][Qq][A-Za-z0-9_-]{46}$/.test(addr.trim());
}

async function handleWallet(chatId: number, text: string, state: ConvState) {
  const wallet = text.trim();
  if (!isValidTonAddress(wallet)) {
    await send(
      chatId,
      "❌ Adresse TON invalide. Elle doit commencer par <code>UQ</code>, <code>EQ</code>, etc. et faire ~48 caractères. Réessaie."
    );
    return;
  }

  // Save for future listings
  saveWallet(state.userId, wallet);

  await finalizeListing(chatId, wallet, state);
}

// ============================================================
// Main webhook handler
// ============================================================

export async function POST(req: Request) {
  try {
    if (!BOT_TOKEN) {
      console.error("[webhook] TELEGRAM_BOT_TOKEN not set");
      return NextResponse.json({ ok: true });
    }

    const update = await req.json();
    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const userId: number = message.from?.id ?? chatId;
    const text: string | undefined = message.text;
    const photo = message.photo;

    // /start resets the session
    if (text === "/start") {
      await handleStart(chatId, userId);
      return NextResponse.json({ ok: true });
    }

    // /setwallet <address>  — set or update wallet at any time
    if (text?.startsWith("/setwallet")) {
      const arg = text.slice("/setwallet".length).trim();
      if (!arg) {
        const current = getWallet(userId);
        await send(
          chatId,
          "👛 <b>Configurer ton wallet TON</b>\n\n" +
          (current ? `Wallet actuel : <code>${current}</code>\n\n` : "") +
          "Utilisation : <code>/setwallet UQB...xyz</code>"
        );
      } else if (!isValidTonAddress(arg)) {
        await send(chatId, "❌ Adresse TON invalide. Elle doit commencer par <code>UQ</code>, <code>EQ</code>, etc. et faire ~48 caractères.");
      } else {
        saveWallet(userId, arg);
        await send(chatId, `✅ Wallet enregistré : <code>${arg}</code>\n\nIl sera utilisé automatiquement pour tes prochaines annonces.`);
      }
      return NextResponse.json({ ok: true });
    }

    const state = sessions.get(chatId);

    // No active session → prompt /start
    if (!state) {
      await send(chatId, "Tape /start pour publier une annonce sur MAR marketplace.");
      return NextResponse.json({ ok: true });
    }

    // Route by current step
    if (state.step === "WAIT_IMAGE") {
      if (photo && photo.length > 0) {
        await handleImage(chatId, photo[photo.length - 1].file_id, state);
      } else {
        await send(chatId, "❌ Envoie une <b>photo</b>, pas du texte.");
      }
    } else if (state.step === "WAIT_DESCRIPTION") {
      if (text) {
        await handleDescription(chatId, text, state);
      } else {
        await send(chatId, "❌ Envoie du <b>texte</b> pour la description.");
      }
    } else if (state.step === "WAIT_PRICE") {
      if (text) {
        await handlePrice(chatId, text, state);
      } else {
        await send(chatId, "❌ Envoie un <b>nombre</b> pour le prix (ex: <code>2.50</code>).");
      }
    } else if (state.step === "WAIT_WALLET") {
      if (text) {
        await handleWallet(chatId, text, state);
      } else {
        await send(chatId, "❌ Envoie ton <b>adresse wallet TON</b> (ex: <code>UQB...xyz</code>).");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}