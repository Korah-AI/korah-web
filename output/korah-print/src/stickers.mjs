// Sticker compositions: the Korah bot showing a QR code, no words.
// Coordinates are px inside a 1000x1000 art box (the PNG adds a 100px margin
// for the white die-cut border).
import { qrSvg } from './qr.mjs';

export const INK = '#21134d';
const POSES = {
  stand: [903, 1009],
  book: [1108, 1180],
  check: [988, 856],
  puzzled: [516, 518],
  write: [439, 459],
  wave: [465, 459],
  laptop: [1146, 1208],
};
const px = (n) => `${Math.round(n * 10) / 10}px`;

function bot(pose, { x, y, w, clipBottom = 0 }) {
  const [iw, ih] = POSES[pose];
  const h = (w * ih) / iw;
  const clip = clipBottom ? `clip-path:inset(0 0 ${clipBottom}% 0);` : '';
  return `<img src="assets/${pose}.png" style="left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)};${clip}">`;
}

// A rectangular piece of a pose (given in % of the pose image), placed so its
// top-left corner lands at `at`. Used to put paws back in front of a card.
function part(pose, { w, box: [x0, y0, x1, y1], at: [X, Y], flip = '' }) {
  const [iw, ih] = POSES[pose];
  const h = (w * ih) / iw;
  const bw = ((x1 - x0) / 100) * w;
  const bh = ((y1 - y0) / 100) * h;
  return `<div class="part" style="left:${px(X)};top:${px(Y)};width:${px(bw)};height:${px(bh)};transform:${flip}"><img src="assets/${pose}.png" style="left:${px((-x0 / 100) * w)};top:${px((-y0 / 100) * h)};width:${px(w)};height:${px(h)}"></div>`;
}

function card(url, { x, y, size, rot = 0, s = 12, frame = INK, level = 'M', minVersion = 1, inner = '' }) {
  const qr = qrSvg(url, { level, minVersion, dark: INK, quiet: 2 });
  return `<div class="card" style="left:${px(x)};top:${px(y)};width:${px(size)};height:${px(size)};--s:${s}px;background:${frame};transform:rotate(${rot}deg)"><div class="card-in">${qr}${inner}</div></div>`;
}

function pix(map, x, y, p) {
  const colors = { D: INK, W: '#fff' };
  let out = '';
  map.forEach((row, r) =>
    [...row].forEach((c, i) => {
      if (colors[c])
        out += `<i style="left:${px(x + i * p)};top:${px(y + r * p)};width:${px(p + 0.5)};height:${px(p + 0.5)};background:${colors[c]}"></i>`;
    }),
  );
  return out;
}

export function stickers(url) {
  // Uppercase URL = QR alphanumeric mode = fewer, bigger modules.
  const u = url.toUpperCase();
  return [
    {
      name: 'peek',
      html:
        bot('stand', { x: 170, y: 10, w: 660, clipBottom: 8 }) +
        card(u, { x: 200, y: 392, size: 600, s: 14 }) +
        part('stand', { w: 560, box: [20.5, 85.5, 45.5, 94.2], at: [236, 356] }) +
        part('stand', { w: 560, box: [54, 85.5, 79, 94.2], at: [624, 356] }),
    },
    {
      name: 'laptop',
      html:
        bot('laptop', { x: 70, y: 40, w: 860 }) +
        card(u, { x: 168, y: 578, size: 392, s: 11, frame: '#3d4654' }) +
        part('laptop', { w: 860, box: [55.5, 66.5, 72, 85.5], at: [547, 643] }),
    },
    {
      name: 'checklist',
      html:
        bot('check', { x: 120, y: 120, w: 860 }) +
        card(u, { x: 8, y: 418, size: 384, s: 11 }),
    },
    {
      name: 'puzzled',
      html:
        bot('puzzled', { x: 10, y: 90, w: 820 }) +
        card(u, { x: 552, y: 468, size: 400, rot: 4, s: 11 }) +
        part('puzzled', { w: 820, box: [86.5, 68, 100, 87], at: [872, 792] }),
    },
    {
      name: 'belly',
      html: bot('wave', { x: 50, y: 56, w: 900 }) + card(u, { x: 352, y: 592, size: 316, s: 9 }),
    },
    {
      name: 'bubble',
      html:
        bot('stand', { x: 10, y: 548, w: 400 }) +
        card(u, { x: 370, y: 10, size: 600, s: 14 }) +
        pix(['DWWWWD', 'DWWWD.', 'DWWD..', 'DWD...', 'DD....'], 426, 596, 28),
    },
    {
      name: 'face',
      html: card(u, {
        x: 60,
        y: 60,
        size: 880,
        s: 16,
        level: 'H',
        minVersion: 3,
        inner: `<div class="patch"><img src="assets/stand.png" style="clip-path:inset(0 0 7.5% 0)"></div>`,
      }),
    },
    {
      name: 'seat',
      html: card(u, { x: 230, y: 460, size: 540, s: 13 }) + bot('write', { x: 270, y: 0, w: 460 }),
    },
    {
      name: 'sprite',
      html:
        card(u, { x: 190, y: 10, size: 620, s: 20 }) +
        `<img class="px" src="assets/korah_32px_16c.png" style="left:310px;top:610px;width:380px;height:380px">`,
    },
    {
      name: 'book',
      html: bot('book', { x: 90, y: 20, w: 820 }) + card(u, { x: 326, y: 566, size: 348, s: 10 }),
    },
  ];
}

export function stickerPage(url) {
  const list = stickers(url);
  return `<!doctype html><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{background:transparent}
.stage{position:relative;width:1200px;height:1200px;overflow:hidden}
.art{position:absolute;left:100px;top:100px;width:1000px;height:1000px}
.art>*,.part>img{position:absolute}
.art i{display:block}
.part{overflow:hidden}
.px{image-rendering:pixelated}
.card,.card-in{clip-path:polygon(0 calc(2*var(--s)),var(--s) calc(2*var(--s)),var(--s) var(--s),calc(2*var(--s)) var(--s),calc(2*var(--s)) 0,calc(100% - 2*var(--s)) 0,calc(100% - 2*var(--s)) var(--s),calc(100% - var(--s)) var(--s),calc(100% - var(--s)) calc(2*var(--s)),100% calc(2*var(--s)),100% calc(100% - 2*var(--s)),calc(100% - var(--s)) calc(100% - 2*var(--s)),calc(100% - var(--s)) calc(100% - var(--s)),calc(100% - 2*var(--s)) calc(100% - var(--s)),calc(100% - 2*var(--s)) 100%,calc(2*var(--s)) 100%,calc(2*var(--s)) calc(100% - var(--s)),var(--s) calc(100% - var(--s)),var(--s) calc(100% - 2*var(--s)),0 calc(100% - 2*var(--s)))}
.card-in{position:absolute;inset:var(--s);background:#fff;padding:calc(var(--s)*.6)}
.card-in svg{display:block;width:100%;height:100%}
.patch{position:absolute;left:50%;top:50%;width:27.5%;height:27.5%;transform:translate(-50%,-50%);background:#fff;display:grid;place-items:center}
.patch img{width:78%;margin-top:6%}
</style>${list.map((s) => `<div class="stage" id="s-${s.name}"><div class="art">${s.html}</div></div>`).join('')}`;
}
