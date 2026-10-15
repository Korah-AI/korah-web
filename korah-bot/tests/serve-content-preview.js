// Local-only preview: real page code, recorded upstream data, no production writes.
// Run from any directory: node korah-bot/tests/serve-content-preview.js
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchQuestionDetail, normalizeQuestion, normalizeQuestionContent } from '../api/_lib/collegeboard.js';
const root=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const fixtures=JSON.parse((await fs.readFile(new URL('./fixtures/collegeboard-content.json',import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const raw=new Map(fixtures.map(f=>[f.meta.external_id||f.meta.ibn,f]));
globalThis.fetch=async(url, options={})=>{
  const id=options.body ? JSON.parse(options.body).external_id : decodeURIComponent(String(url).split('/').pop().replace(/\.json$/,''));
  const f=raw.get(id);
  return {ok:!!f,json:async()=>f.meta.ibn ? [f.detail].flat() : f.detail};
};
const questions=await Promise.all(fixtures.map(async f=>normalizeQuestion(f.meta,await fetchQuestionDetail(f.meta.external_id||f.meta.ibn))));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  const json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  if(url.pathname==='/api/sat/q'){
    const ids=(url.searchParams.get('questionIds')||'').split(',').filter(Boolean);
    const filtered=ids.length ? questions.filter(q=>ids.includes(q.id)||ids.includes(raw.get(q.id).meta.questionId)) : questions;
    return json({count:filtered.length,batchSize:Math.min(20,filtered.length),questions:filtered.map((q,i)=>i<20?q:normalizeQuestion(raw.get(q.id).meta,null))});
  }
  if(url.pathname==='/api/sat/qi') {
    const id=url.searchParams.get('id');return json({id,...normalizeQuestionContent(await fetchQuestionDetail(id))});
  }
  if(url.pathname.startsWith('/api/')) {res.statusCode=404;return json({error:'Not part of this read-only preview'});}
  try {
    const filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!filename.startsWith(root+path.sep)&&filename!==root) {res.statusCode=403;return res.end();}
    const data=await fs.readFile(filename);
    res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');res.end(data);
  } catch {res.statusCode=404;res.end('Not found');}
}).listen(8766,'127.0.0.1',()=>console.log('Recorded-content preview: http://127.0.0.1:8766/korah-bot/sat/questions.html'));
