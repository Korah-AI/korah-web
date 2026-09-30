import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const publicPages = new Map([
  ['index.html', 'https://korah.app/'],
  ['sat/index.html', 'https://korah.app/sat/'],
  ['college-prep/index.html', 'https://korah.app/college-prep/'],
  ['potd/index.html', 'https://korah.app/potd/'],
  ['opportunities/opportunities.html', 'https://korah.app/opportunities/opportunities.html'],
  ['support/index.html', 'https://korah.app/support/'],
  ['code/code.html', 'https://korah.app/code/code.html'],
  ['code/interns.html', 'https://korah.app/code/interns.html'],
]);

test('public pages expose a description, robots directive, and canonical URL', () => {
  for (const [file, canonical] of publicPages) {
    const html = read(file);
    assert.match(html, /<meta name="description" content="[^"]+"\s*\/?\s*>/i, `${file} needs a description`);
    assert.match(html, /<meta name="robots" content="index,follow[^\"]*"\s*\/?\s*>/i, `${file} needs an index directive`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), `${file} has the wrong canonical URL`);
  }
});

test('public page browser titles stay concise', () => {
  for (const file of publicPages.keys()) {
    const html = read(file);
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim();
    assert.ok(title, `${file} needs a browser title`);
    assert.ok(title.length <= 32, `${file} browser title is too long`);
  }
});

test('landing page includes social cards and valid structured data', () => {
  const html = read('index.html');
  for (const property of ['og:type', 'og:site_name', 'og:url', 'og:title', 'og:description', 'og:image']) {
    assert.ok(html.includes(`property="${property}"`), `missing ${property}`);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.ok(html.includes(`name="${name}"`), `missing ${name}`);
  }

  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(block, 'missing JSON-LD block');
  const data = JSON.parse(block[1]);
  assert.equal(data.url, 'https://korah.app/');
  assert.equal(data.offers.price, '0');
});

test('robots and sitemap advertise only unique HTTPS public URLs', () => {
  const robots = read('robots.txt');
  const sitemap = read('sitemap.xml');
  assert.match(robots, /Sitemap: https:\/\/korah\.app\/sitemap\.xml/);

  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.length, publicPages.size);
  assert.equal(new Set(urls).size, urls.length);
  assert.ok(urls.every((url) => url.startsWith('https://korah.app/')));
  for (const canonical of publicPages.values()) assert.ok(urls.includes(canonical), `sitemap missing ${canonical}`);
});

test('production Desmos embeds use the working v1.12 demo key', () => {
  const currentKey = 'dcb31709b452b1cf9dc26972add0fda6';
  const revokedKey = 'd75985faa7d94050843ebd4528dd94c1';
  const embedPages = [
    'chat.html',
    'sat/index.html',
    'sat/math-chat.html',
    'sat/questions.html',
    'sat/rush.html',
  ];

  for (const file of embedPages) {
    const html = read(file);
    assert.ok(!html.includes(revokedKey), `${file} still contains the revoked key`);
    assert.ok(html.includes(`https://www.desmos.com/api/v1.12/calculator.js?apiKey=${currentKey}`), `${file} has an inconsistent Desmos embed`);
  }

  const player = read('sat/practice-test/player.js');
  assert.ok(player.includes(`const DESMOS_DEMO_API_KEY = "${currentKey}";`));
});
