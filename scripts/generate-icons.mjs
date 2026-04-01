import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '../public/logo.png');
const outDir = path.join(__dirname, '../public/icons');

const sizes = [192, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(inputPath)
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generate().catch(console.error);
