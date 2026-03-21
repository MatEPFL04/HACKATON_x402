import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import type { ImageRecord, SearchParams, ImagePublicMeta } from "./types";

const DATA_DIR   = path.join(process.cwd(), "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const INDEX_FILE = path.join(DATA_DIR, "images.json");

function ensureDirs(): void {
  fs.mkdirSync(DATA_DIR,   { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function readIndex(): ImageRecord[] {
  ensureDirs();
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, "[]", "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8")) as ImageRecord[];
  } catch {
    console.error("[image-storage] Corrupted images.json, resetting to []");
    fs.writeFileSync(INDEX_FILE, "[]", "utf-8");
    return [];
  }
}

function writeIndex(records: ImageRecord[]): void {
  ensureDirs();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(records, null, 2), "utf-8");
}

// ── Thumbnail ────────────────────────────────────────────────

async function generateThumb(base64Data: string): Promise<string> {
  const buf = Buffer.from(base64Data, "base64");
  const thumb = await sharp(buf)
    .resize({ width: 200 })
    .jpeg({ quality: 50 })
    .toBuffer();
  return thumb.toString("base64");
}

export function getThumbData(id: string): string | null {
  const thumbPath = path.join(IMAGES_DIR, `${id}.thumb.b64`);
  if (fs.existsSync(thumbPath)) return fs.readFileSync(thumbPath, "utf-8");
  // Fallback pour les images uploadées avant cette feature
  const fullPath = path.join(IMAGES_DIR, `${id}.b64`);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf-8").slice(0, 2000);
}

// ── Public meta ──────────────────────────────────────────────

export function toPublicMeta(record: ImageRecord): ImagePublicMeta {
  return {
    id: record.id,
    image_name: record.image_name,
    attributs_image: record.attributs_image,
    price: record.price,
    owner_ID: record.owner_ID,
    created_at: record.created_at,
    image_data: getThumbData(record.id) ?? undefined,
  };
}

// ── Add image ────────────────────────────────────────────────

export async function addImage(
  imageName: string,
  ownerID: string,
  ownerWallet: string,
  tags: string[],
  price: string,
  base64Data: string,
): Promise<ImageRecord> {
  const id = crypto.randomUUID();
  const record: ImageRecord = {
    id,
    image_name: imageName,
    owner_ID: ownerID,
    owner_walletAddress: ownerWallet,
    attributs_image: tags.map((t) => t.toLowerCase().trim()).filter(Boolean),
    price,
    created_at: new Date().toISOString(),
  };

  ensureDirs();

  // Image full
  fs.writeFileSync(path.join(IMAGES_DIR, `${id}.b64`), base64Data, "utf-8");

  // Thumbnail généré automatiquement
  try {
    const thumb = await generateThumb(base64Data);
    fs.writeFileSync(path.join(IMAGES_DIR, `${id}.thumb.b64`), thumb, "utf-8");
  } catch (e) {
    console.warn(`[image-storage] Thumb generation failed for ${id}:`, e);
  }

  const records = readIndex();
  records.push(record);
  writeIndex(records);

  console.log(`[image-storage] Added image ${id} (${imageName}) by ${ownerID}`);
  return record;
}

// ── Search ───────────────────────────────────────────────────

export function searchImages(params: SearchParams): {
  count: number;
  images: ImagePublicMeta[];
} {
  let records = readIndex();

  if (params.tags && params.tags.length > 0) {
    const queryTags = params.tags.map((t) => t.toLowerCase().trim());
    records = records.filter((r) =>
      queryTags.every((tag) => r.attributs_image.includes(tag)),
    );
  }

  if (params.min_price !== undefined) {
    const min = BigInt(params.min_price);
    records = records.filter((r) => { try { return BigInt(r.price) >= min; } catch { return false; } });
  }
  if (params.max_price !== undefined) {
    const max = BigInt(params.max_price);
    records = records.filter((r) => { try { return BigInt(r.price) <= max; } catch { return false; } });
  }

  if (params.owner_ID) {
    records = records.filter((r) => r.owner_ID === params.owner_ID);
  }

  const count = records.length;
  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const offset = params.offset ?? 0;
  const limit  = params.limit  ?? 20;
  const page   = records.slice(offset, offset + limit);

  return { count, images: page.map(toPublicMeta) };
}

// ── Get by id ────────────────────────────────────────────────

export function getImageById(id: string): ImageRecord | undefined {
  return readIndex().find((r) => r.id === id);
}

export function getImageData(id: string): string | null {
  const filePath = path.join(IMAGES_DIR, `${id}.b64`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function getAllTags(): string[] {
  const records = readIndex();
  const tagSet  = new Set<string>();
  for (const r of records) {
    for (const tag of r.attributs_image) tagSet.add(tag);
  }
  return Array.from(tagSet).sort();
}