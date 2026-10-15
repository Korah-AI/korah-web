// Small dependency-free QR encoder (versions 1-6, byte + alphanumeric modes).

const ECC = { L: 1, M: 0, Q: 3, H: 2 };
// [ec codewords per block, [blocks, data codewords]...] per version, per level
const TABLE = {
  1: { L: [7, [1, 19]], M: [10, [1, 16]], Q: [13, [1, 13]], H: [17, [1, 9]] },
  2: { L: [10, [1, 34]], M: [16, [1, 28]], Q: [22, [1, 22]], H: [28, [1, 16]] },
  3: { L: [15, [1, 55]], M: [26, [1, 44]], Q: [18, [2, 17]], H: [22, [2, 13]] },
  4: { L: [20, [1, 80]], M: [18, [2, 32]], Q: [26, [2, 24]], H: [16, [4, 9]] },
  5: {
    L: [26, [1, 108]],
    M: [24, [2, 43]],
    Q: [18, [2, 15], [2, 16]],
    H: [22, [2, 11], [2, 12]],
  },
  6: { L: [18, [2, 68]], M: [16, [4, 27]], Q: [24, [4, 19]], H: [28, [4, 15]] },
};
const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

export function rsRemainder(data, n) {
  let gen = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= mul(gen[j], EXP[i]);
    }
    gen = next;
  }
  const rem = new Array(n).fill(0);
  for (const b of data) {
    const f = b ^ rem.shift();
    rem.push(0);
    for (let j = 0; j < n; j++) rem[j] ^= mul(gen[j + 1], f);
  }
  return rem;
}

export function dataCodewords(text, version, level) {
  const [, ...groups] = TABLE[version][level];
  const capacity = groups.reduce((s, [b, d]) => s + b * d, 0);
  const bits = [];
  const push = (v, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1);
  };
  const alnum = [...text].every((c) => ALNUM.includes(c));
  if (alnum) {
    push(0b0010, 4);
    push(text.length, 9);
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length)
        push(ALNUM.indexOf(text[i]) * 45 + ALNUM.indexOf(text[i + 1]), 11);
      else push(ALNUM.indexOf(text[i]), 6);
    }
  } else {
    const bytes = Buffer.from(text, 'utf8');
    push(0b0100, 4);
    push(bytes.length, 8);
    for (const b of bytes) push(b, 8);
  }
  if (bits.length > capacity * 8) return null;
  push(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const out = [];
  for (let i = 0; i < bits.length; i += 8)
    out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0xec; out.length < capacity; pad ^= 0xec ^ 0x11) out.push(pad);
  return out;
}

export function formatBits(level, mask) {
  const data = (ECC[level] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function penalty(m) {
  const n = m.length;
  let p = 0;
  const line = (get) => {
    for (let a = 0; a < n; a++) {
      let run = 1;
      let hist = 0;
      for (let b = 0; b < n; b++) {
        hist = ((hist << 1) | get(a, b)) & 0x7ff;
        if (b >= 10 && (hist === 0b10111010000 || hist === 0b00001011101)) p += 40;
        if (b > 0 && get(a, b) === get(a, b - 1)) run++;
        else run = 1;
        if (run === 5) p += 3;
        else if (run > 5) p++;
      }
    }
  };
  line((a, b) => m[a][b]);
  line((a, b) => m[b][a]);
  let dark = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      dark += m[y][x];
      if (y + 1 < n && x + 1 < n) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
      }
    }
  p += Math.floor(Math.abs((dark * 20) / (n * n) - 10)) * 10;
  return p;
}

/** Returns a square matrix of 0/1 (1 = dark), without quiet zone. */
export function qrMatrix(text, level = 'M', minVersion = 1) {
  let version = minVersion;
  let data = null;
  for (; version <= 6; version++) {
    data = dataCodewords(text, version, level);
    if (data) break;
  }
  if (!data) throw new Error(`"${text}" does not fit in QR version 6-${level}`);

  const [ecLen, ...groups] = TABLE[version][level];
  const blocks = [];
  let offset = 0;
  for (const [count, len] of groups)
    for (let i = 0; i < count; i++) {
      const d = data.slice(offset, offset + len);
      offset += len;
      blocks.push({ d, e: rsRemainder(d, ecLen) });
    }
  const stream = [];
  const longest = Math.max(...blocks.map((b) => b.d.length));
  for (let i = 0; i < longest; i++)
    for (const b of blocks) if (i < b.d.length) stream.push(b.d[i]);
  for (let i = 0; i < ecLen; i++) for (const b of blocks) stream.push(b.e[i]);

  const n = version * 4 + 17;
  const m = Array.from({ length: n }, () => new Array(n).fill(0));
  const fn = Array.from({ length: n }, () => new Array(n).fill(false));
  const set = (x, y, v) => {
    m[y][x] = v ? 1 : 0;
    fn[y][x] = true;
  };

  for (let i = 0; i < n; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [n - 4, 3],
    [3, n - 4],
  ])
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d !== 2 && d !== 4);
      }
  if (version > 1) {
    const c = n - 7;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        set(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const drawFormat = (mask) => {
    const bits = formatBits(level, mask);
    const bit = (i) => (bits >>> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
    set(8, n - 8, 1);
  };
  drawFormat(0);

  let i = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++)
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? n - 1 - vert : vert;
        if (!fn[y][x] && i < stream.length * 8) {
          m[y][x] = (stream[i >>> 3] >>> (7 - (i & 7))) & 1;
          i++;
        }
      }
  }

  const applyMask = (k) => {
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] ^= 1;
  };
  let best = 0;
  let bestScore = Infinity;
  for (let k = 0; k < 8; k++) {
    applyMask(k);
    drawFormat(k);
    const score = penalty(m);
    if (score < bestScore) {
      bestScore = score;
      best = k;
    }
    applyMask(k);
  }
  applyMask(best);
  drawFormat(best);
  return m;
}

/** SVG markup for a QR code. `quiet` is the quiet-zone width in modules. */
export function qrSvg(text, { level = 'M', quiet = 2, dark = '#1b1140', light = '#ffffff', minVersion = 1 } = {}) {
  const m = qrMatrix(text, level, minVersion);
  const n = m.length;
  const size = n + quiet * 2;
  let d = '';
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; ) {
      if (!m[y][x]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < n && m[y][x + w]) w++;
      d += `M${x + quiet} ${y + quiet}h${w}v1h-${w}z`;
      x += w;
    }
  const bg = light === 'none' ? '' : `<rect width="${size}" height="${size}" fill="${light}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" class="qr">${bg}<path d="${d}" fill="${dark}"/></svg>`;
}
