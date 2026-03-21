import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, "../data/images");

const files = fs.readdirSync(IMAGES_DIR)
  .filter(f => f.endsWith(".b64") && !f.endsWith(".thumb.b64"));

console.log(`Found ${files.length} images to process…`);

for (const file of files) {
  const id = file.replace(".b64", "");
  const thumbPath = path.join(IMAGES_DIR, `${id}.thumb.b64`);

  if (fs.existsSync(thumbPath)) {
    console.log(`  ⏭  ${id} — skipping`);
    continue;
  }

  try {
    const base64 = fs.readFileSync(path.join(IMAGES_DIR, file), "utf-8");
    const buf    = Buffer.from(base64, "base64");
    const thumb  = await sharp(buf).resize({ width: 200 }).jpeg({ quality: 50 }).toBuffer();
    fs.writeFileSync(thumbPath, thumb.toString("base64"), "utf-8");
    console.log(`  ✅  ${id}`);
  } catch (e) {
    console.error(`  ❌  ${id}:`, e.message);
  }
}

console.log("Done.");