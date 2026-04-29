/**
 * Builds `app/favicon.ico` from `public/assests/logo.png` using multi-size ICO.
 * Run: npm run favicon
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logoPath = path.join(root, "public", "assests", "logo.png");
const outPath = path.join(root, "app", "favicon.ico");

const sizes = [256, 128, 64, 48, 32, 16];

const pngBuffers = await Promise.all(
  sizes.map((s) =>
    sharp(logoPath)
      .resize(s, s, { fit: "cover", position: "centre" })
      .ensureAlpha()
      .png({ compressionLevel: 9 })
      .toBuffer()
  )
);

const icoBuf = await pngToIco(pngBuffers);
await fs.promises.writeFile(outPath, icoBuf);
console.log(`Wrote ${outPath} (${icoBuf.byteLength} bytes)`);
