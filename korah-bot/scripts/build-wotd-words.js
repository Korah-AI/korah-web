#!/usr/bin/env node
/**
 * build-wotd-words.js - build word-of-the-day/words.json (dev-only, run by hand).
 *
 *   node scripts/build-wotd-words.js
 *
 * Output: one object keyed by ISO date (YYYY-MM-DD), each value an array of
 * 10 { word, pos, definition, example }. 365 days from START, 3650 unique words.
 *
 * Sources:
 *   1. vocab/cleaned_sat_vocabulary.json (988 words, after a few text fixes)
 *   2. scripts/wotd-words/*.txt, extra words written for this file, one per line:
 *        word|part of speech|definition|example
 *
 * Words are deduped by lowercase spelling, shuffled with a fixed seed so
 * difficulty is mixed across days, and dealt out 10 per day. Same input and
 * seed always give the same file.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const START = '2026-11-06';
const DAYS = 365;
const PER_DAY = 10;
const SEED = 20261106;

const ROOT = path.join(__dirname, '..');
const SRC_JSON = path.join(ROOT, 'vocab', 'cleaned_sat_vocabulary.json');
const EXTRA_DIR = path.join(__dirname, 'wotd-words');
const OUT = path.join(ROOT, 'word-of-the-day', 'words.json');

// Text fixes for entries in the source JSON that are truncated or garbled.
const FIX = {
  ardor: { example: 'The soldiers conveyed their ardor with impassioned battle cries.' },
  cordial: { example: 'His cordial greeting melted my anger at once.' },
  discordant: { example: "The girls' sobs were a discordant sound amid the general laughter that filled the restaurant." },
  legerdemain: { example: 'Smuggling the French plants through customs by claiming that they were fake was a remarkable bit of legerdemain.' },
  encore: { definition: "the audience's demand for a repeat performance" },
  hierarchy: { definition: 'a system with ranked groups, usually according to social, economic, or political status' },
  liability: { definition: 'something for which one is legally responsible, or a disadvantage' },
  fraught: {
    definition: 'filled with something undesirable; causing or marked by anxiety',
    example: 'The negotiations were fraught with tension from the very first meeting.',
  },
  etymology: { example: 'From the study of etymology, I know that the word “quixotic” derives from Don Quixote.' },
  vehement: { example: 'The vehement protesters chained themselves to the building and shouted all night long.' },
};

function clean(s) {
  return String(s == null ? '' : s)
    .replace(/\s*\u2014\s*/g, ', ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POS = new Set(['noun', 'verb', 'adjective', 'adverb']);
const seen = new Set();
const words = [];
const skipped = [];

function add(rec, origin) {
  const word = clean(rec.word).toLowerCase();
  const pos = clean(rec.pos).toLowerCase();
  const definition = clean(rec.definition);
  const example = clean(rec.example);
  if (!/^[a-z][a-z-]*$/.test(word) || !POS.has(pos) || definition.length < 3 || example.length < 15) {
    skipped.push(origin + ':' + word + ' (malformed)');
    return;
  }
  if (seen.has(word)) {
    skipped.push(origin + ':' + word + ' (duplicate)');
    return;
  }
  seen.add(word);
  words.push({ word, pos, definition, example });
}

// 1. existing dataset
const src = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8')).words;
src.forEach((w) => {
  const f = FIX[w.word] || {};
  add({
    word: w.word,
    pos: w.part_of_speech,
    definition: f.definition || w.definition,
    example: f.example || w.example,
  }, 'json');
});
const fromJson = words.length;

// 2. extra words
fs.readdirSync(EXTRA_DIR).filter((f) => f.endsWith('.txt')).sort().forEach((f) => {
  fs.readFileSync(path.join(EXTRA_DIR, f), 'utf8').split('\n').forEach((line) => {
    if (!line.trim()) return;
    const p = line.split('|');
    if (p.length !== 4) { skipped.push(f + ': bad line ' + line.slice(0, 30)); return; }
    add({ word: p[0], pos: p[1], definition: p[2], example: p[3] }, f);
  });
});

const need = DAYS * PER_DAY;
console.log('usable: ' + words.length + ' (json ' + fromJson + ', extra ' + (words.length - fromJson) + '), need ' + need);
if (skipped.length) console.log('skipped (' + skipped.length + '): ' + skipped.join('; '));
if (words.length < need) { console.error('SHORT by ' + (need - words.length)); process.exit(1); }

// seeded Fisher-Yates
const rnd = mulberry32(SEED);
for (let i = words.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [words[i], words[j]] = [words[j], words[i]];
}

const lines = [];
const d = new Date(START + 'T00:00:00Z');
for (let day = 0; day < DAYS; day++) {
  const key = d.toISOString().slice(0, 10);
  lines.push('"' + key + '":' + JSON.stringify(words.slice(day * PER_DAY, (day + 1) * PER_DAY)));
  d.setUTCDate(d.getUTCDate() + 1);
}
fs.writeFileSync(OUT, '{\n' + lines.join(',\n') + '\n}\n');
console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + DAYS + ' days, ' + (DAYS * PER_DAY) + ' words, ' + fs.statSync(OUT).size + ' bytes)');
