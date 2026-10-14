// Decodes every QR in the rendered outputs with jsQR (loaded from a CDN in a browser page).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.setContent('<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>');
await page.waitForFunction(() => typeof jsQR === 'function');
async function decode(input, size) {
  const { data, info } = await sharp(input).flatten({ background: '#fff' }).resize(size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return page.evaluate(([b64, w, h]) => {
    const bin = atob(b64); const a = new Uint8ClampedArray(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return jsQR(a, w, h)?.data ?? null;
  }, [data.toString('base64'), info.width, info.height]);
}
// Stickers: full size, and shrunk to 300px (a 2.5in sticker seen from a distance).
for (const f of await readdir(path.join(out, 'stickers')))
  console.log(f, '|', await decode(path.join(out, 'stickers', f), 1200), '|', await decode(path.join(out, 'stickers', f), 300));
// Flyer: crop each QR region out of the PNG.
const flyer = path.join(out, 'Korah-Flyer.png');
for (const [name, region] of Object.entries({ internship: [1000, 680, 500, 440], website: [100, 1700, 320, 320], instagram: [1050, 1620, 420, 340] })) {
  const [left, top, width, height] = region;
  console.log('flyer', name, '|', await decode(await sharp(flyer).extract({ left, top, width, height }).png().toBuffer(), width));
}
await browser.close();
