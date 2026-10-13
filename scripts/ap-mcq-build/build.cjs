// Regenerates korah-bot/ap/data/<course>/mcqs.json from the sources in this folder:
//   node scripts/ap-mcq-build/build.cjs
// The first choice listed for a question is the key; choices are then reordered so
// the correct answer is spread evenly across A–D.
const fs = require('fs'), path = require('path');
const dataDir = path.join(__dirname, '../../korah-bot/ap/data');
const POSITIONS = [2, 0, 3, 1, 1, 3, 0, 2, 3, 2, 1, 0];
const pad = n => String(n).padStart(3, '0');
const place = (choices, index) => { const answer = POSITIONS[index % 12], ordered = choices.slice(1); ordered.splice(answer, 0, choices[0]); return { choices: ordered, answer }; };
const write = (course, bank) => { fs.writeFileSync(path.join(dataDir, course, 'mcqs.json'), JSON.stringify(bank, null, 2) + '\n'); console.log(course, bank.questions.length, 'questions'); };

function buildCalculus() {
  const first = require('./calculus.cjs'), more = require('./calculus-more.cjs'), sourceIds = first.sourceIds;
  const figures = { ...first.figures, ...more.figures };
  const old = JSON.parse(fs.readFileSync(path.join(dataDir, 'ap-calculus-ab/mcqs.json'), 'utf8'));
  const parsed = [first.source, more.source].flatMap(source => source.trim().split(/\n\s*\n(?=@)/)).map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const [unit, calc, skill, figure] = lines[0].slice(1).split('|').map(s => s.trim());
    const pick = mark => lines.filter(l => l.startsWith(mark + ' ')).map(l => l.slice(2));
    const stem = lines.slice(1).filter(l => !/^[*\-=] /.test(l)).join(' ');
    const key = pick('*'), distractors = pick('-'), explanation = pick('=');
    if (key.length !== 1 || distractors.length !== 3 || explanation.length !== 1 || !stem || !/^[cn]$/.test(calc) || (figure && !figures[figure])) throw new Error('Malformed question block: ' + lines[0] + ' ' + stem.slice(0, 60));
    return { unit: Number(unit), calc, skill, figure, stem, choices: [key[0], ...distractors], explanation: explanation[0] };
  });
  // Stable sort: within a unit the first batch stays ahead of the second.
  parsed.sort((a, b) => a.unit - b.unit);
  const questions = parsed.map(({ unit, calc, skill, figure, stem, choices, explanation }, i) => {
    const q = { id: `ap-calculus-ab-mcq-${pad(i + 1)}`, course: 'ap-calculus-ab', unit, calculator: calc === 'c' ? 'calculator' : 'non-calculator', skill: skill.replace(/\\\((.*?)\\\)/g, (_, m) => m.replace("'", '′')) };
    if (figure) q.figure = figures[figure];
    return { ...q, stem, ...place(choices, i), explanation, sourceIds: ['ced', sourceIds[unit]] };
  });
  write('ap-calculus-ab', { schemaVersion: 2, course: 'ap-calculus-ab', title: old.title, authorship: old.authorship, sources: old.sources, questions });
}

function buildHistory() {
  const more = require('./history-more.cjs'), charts = require('./history-charts.cjs');
  // Copy the question lists so the single added questions can be appended to their sets.
  const documents = [...require('./history-documents.cjs').sets, ...more.sets].map(set => [...set.slice(0, 5), [...set[5]]]);
  for (const [slug, question] of more.extras) {
    const set = documents.find(d => d[1] === slug);
    if (!set) throw new Error('No set for added question: ' + slug);
    set[5].push(question);
  }
  const sources = { ced: { title: 'College Board — AP U.S. History Course and Exam Description', url: 'https://apcentral.collegeboard.org/courses/ap-united-states-history', note: 'Period boundaries, historical thinking skills, and stimulus-based question format.' }, ...charts.sources };
  const sets = [];
  documents.forEach(([unit, slug, title, text, attribution, qs], i) => {
    const key = 'doc' + String(i + 1).padStart(2, '0');
    // Two sets may quote different passages of one document, so the title keeps each source entry distinct.
    sources[key] = { title: `The American Yawp Reader — ${title}`, url: `https://www.americanyawp.com/reader/${slug}/`, note: `Public-domain primary source: ${attribution}. Excerpt quoted from the reader's transcription.` };
    sets.push({ unit, key, stimulus: { title, text, attribution }, qs });
  });
  charts.sets.forEach(([unit, key, title, figure, attribution, qs]) => sets.push({ unit, key, stimulus: { title, figure, attribution }, qs }));
  sets.sort((a, b) => a.unit - b.unit); // stable: document sets stay ahead of the chart set in each period
  const questions = [];
  for (const { unit, key, stimulus, qs } of sets) for (const [skill, stem, choices, explanation] of qs) {
    const i = questions.length;
    questions.push({ id: `ap-us-history-mcq-${pad(i + 1)}`, course: 'ap-us-history', unit, calculator: null, skill, stimulus, stem, ...place(choices, i), explanation, sourceIds: [key, 'ced'] });
  }
  write('ap-us-history', { schemaVersion: 2, course: 'ap-us-history', title: 'AP U.S. History MCQ practice', authorship: 'Stimulus-based questions written for Korah around public-domain primary sources and public data; not released College Board questions.', sources, questions });
}

buildCalculus();
buildHistory();
