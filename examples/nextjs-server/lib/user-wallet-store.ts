import fs from "fs";
import path from "path";

const DATA_DIR   = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "user-wallets.json");

function readStore(): Record<string, string> {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, string>): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function getWallet(userId: number): string | undefined {
  return readStore()[String(userId)];
}

export function saveWallet(userId: number, wallet: string): void {
  const store = readStore();
  store[String(userId)] = wallet;
  writeStore(store);
}
