// Copies the Korah mascot art out of the korah-web repo, trims it to its
// bounding box and removes the green chroma-key fringe some poses carry.
// Usage: node prep-assets.mjs [path-to-korah-web]
import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const korahWeb = process.argv[2] ?? 'C:/Users/umerq/Downloads/korah-web';
const logos = path.join(korahWeb, 'korah-bot/logo-images');
const out = path.join(here, 'assets');

const poses = {
  stand: 'newlogo0.png',
  book: 'newlogo2.png',
  check: 'newlogo3.png',
  puzzled: 'newlogo5.png',
  write: 'newlogo10.png',
  wave: 'newlogo11.png',
  laptop: 'newlogo12.png',
};

await mkdir(path.join(out, 'fonts'), { recursive: true });
for (const [name, file] of Object.entries(poses)) {
  const { data, info } = await sharp(path.join(logos, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 24) data[i + 3] = 0;
    else if (g > r + 24 && g > b + 24 && !(name === 'check' && a > 250 && g < 170)) data[i + 3] = 0;
  }
  const meta = await sharp(data, { raw: info })
    .trim({ threshold: 0 })
    .png()
    .toFile(path.join(out, `${name}.png`));
  console.log(name, meta.width, meta.height);
}
for (const f of ['Medium', 'Bold', 'ExtraBold'])
  await copyFile(
    path.join(korahWeb, `animations/korah-code/assets/fonts/PlusJakartaSans-${f}.ttf`),
    path.join(out, `fonts/PlusJakartaSans-${f}.ttf`),
  );
for (const f of ['korah_32px_16c.png', 'korah_24px_16c.png'])
  await copyFile(path.join(korahWeb, 'korah-bot/ui-components/korah-sprite/sprites', f), path.join(out, f));
