// Builds the Korah flyer (PDF + PNG) and the QR sticker pack.
// Usage: node build.mjs [stickers|flyer]
// Change LINKS to repoint any QR code, then rebuild.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stickerPage, stickers } from './stickers.mjs';
import { flyerPage } from './flyer.mjs';

export const LINKS = {
  internship: 'https://www.korah.app/code/interns.html',
  instagram: 'https://www.instagram.com/korah.app/',
  website: 'https://www.korah.app/',
  sticker: 'https://www.korah.app/',
};

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..');
const only = process.argv[2];

// White die-cut border: grow the artwork's alpha outward and fill it white.
async function dieCut(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] > 40 ? 255 : 0;
  const grown = await sharp(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
    .blur(16)
    .threshold(10)
    .blur(1.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const white = Buffer.alloc(info.width * info.height * 4, 255);
  for (let i = 0; i < grown.length; i++) white[i * 4 + 3] = grown[i];
  return sharp(white, { raw: { width: info.width, height: info.height, channels: 4 } })
    .composite([{ input: png }])
    .png()
    .toBuffer();
}

const browser = await chromium.launch({ channel: 'chrome' });

if (!only || only === 'stickers') {
  await mkdir(path.join(out, 'stickers'), { recursive: true });
  const file = path.join(here, 'stickers.html');
  await writeFile(file, stickerPage(LINKS.sticker));
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.goto(pathToFileURL(file).href);
  const list = stickers(LINKS.sticker);
  const files = [];
  for (const [i, s] of list.entries()) {
    const raw = await page.locator(`#s-${s.name}`).screenshot({ omitBackground: true });
    const name = `${String(i + 1).padStart(2, '0')}-${s.name}.png`;
    await writeFile(path.join(out, 'stickers', name), await dieCut(raw));
    files.push(name);
  }
  // Print sheet: US Letter, 3 x 4 grid of 2.5in stickers.
  const cells = [...files, files[0], files[6]];
  const sheet = (bg) => `<!doctype html><meta charset="utf-8"><style>
@page{size:8.5in 11in;margin:0}*{margin:0}
body{width:8.5in;height:11in;background:${bg};display:grid;grid-template-columns:repeat(3,2.5in);grid-auto-rows:2.5in;justify-content:center;align-content:center;gap:.08in .12in}
img{width:2.5in;height:2.5in;display:block}
</style>${cells.map((f) => `<img src="../stickers/${f}">`).join('')}`;
  const sheetFile = path.join(here, 'sticker-sheet.html');
  await writeFile(sheetFile, sheet('#fff'));
  await page.goto(pathToFileURL(sheetFile).href);
  await page.pdf({ path: path.join(out, 'Korah-Sticker-Sheet.pdf'), width: '8.5in', height: '11in', printBackground: true });
  await writeFile(sheetFile, sheet('#cfc4f5'));
  await page.setViewportSize({ width: 816, height: 1056 });
  await page.goto(pathToFileURL(sheetFile).href);
  await page.screenshot({ path: path.join(out, 'stickers-preview.png'), scale: 'css' });
  await writeFile(sheetFile, sheet('#fff'));
  await page.close();
}

if (!only || only === 'flyer') {
  const file = path.join(here, 'flyer.html');
  await writeFile(file, flyerPage(LINKS));
  const page = await browser.newPage({ viewport: { width: 816, height: 1056 }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(out, 'Korah-Flyer.pdf'), width: '8.5in', height: '11in', printBackground: true });
  await page.screenshot({ path: path.join(out, 'Korah-Flyer.png') });
  await page.close();
}

await browser.close();
