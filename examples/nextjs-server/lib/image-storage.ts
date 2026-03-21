import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { ImageRecord, SearchParams, ImagePublicMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const IMAGES_DIR = path.join(DATA_DIR, "images");
const INDEX_FILE = path.join(DATA_DIR, "images.json");

function ensureDirs(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function readIndex(): ImageRecord[] {
  ensureDirs();
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, "[]", "utf-8");
    return [];
  }
  try {
    const raw = fs.readFileSync(INDEX_FILE, "utf-8");
    return JSON.parse(raw) as ImageRecord[];
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

export function toPublicMeta(record: ImageRecord): ImagePublicMeta {
  return {
    id: record.id,
    image_name: record.image_name,
    attributs_image: record.attributs_image,
    price: record.price,
    owner_ID: record.owner_ID,
    created_at: record.created_at,
    image_data: getImageData(record.id) ?? undefined, // preview floutée côté client
  };
}

export function addImage(
  imageName: string,
  ownerID: string,
  ownerWallet: string,
  tags: string[],
  price: string,
  base64Data: string,
): ImageRecord {
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
  fs.writeFileSync(path.join(IMAGES_DIR, `${id}.b64`), base64Data, "utf-8");

  const records = readIndex();
  records.push(record);
  writeIndex(records);

  console.log(`[image-storage] Added image ${id} (${imageName}) by ${ownerID}`);
  return record;
}

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
    records = records.filter((r) => {
      try { return BigInt(r.price) >= min; } catch { return false; }
    });
  }
  if (params.max_price !== undefined) {
    const max = BigInt(params.max_price);
    records = records.filter((r) => {
      try { return BigInt(r.price) <= max; } catch { return false; }
    });
  }

  if (params.owner_ID) {
    records = records.filter((r) => r.owner_ID === params.owner_ID);
  }

  const count = records.length;
  records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const offset = params.offset ?? 0;
  const limit = params.limit ?? 20;
  const page = records.slice(offset, offset + limit);

  return { count, images: page.map(toPublicMeta) };
}

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
  const tagSet = new Set<string>();
  for (const r of records) {
    for (const tag of r.attributs_image) tagSet.add(tag);
  }
  return Array.from(tagSet).sort();
}