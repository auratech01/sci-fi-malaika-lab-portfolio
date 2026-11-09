// Worker safety tests with a pretend Gemini. Run from the project folder:  node tests/worker_test.mjs
import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'chatbot-worker.js'), 'utf8');
const tmp = path.join(os.tmpdir(), 'aura-worker-test.mjs'); fs.writeFileSync(tmp, src);
const worker = (await import(pathToFileURL(tmp).href)).default;
const facts = JSON.parse(src.match(/const FACT_LIST = (\[[\s\S]*?\n\]);/)[1]);
const idOf = re => 'F' + (facts.findIndex(f => re.test(f)) + 1);
let results = [], upstreamBody = null, upstreamHeaders = null, nextGemini = null;
globalThis.fetch = async (url, init) => { upstreamBody = JSON.parse(init.body); upstreamHeaders = init.headers; if (nextGemini === 'down') return new Response('x', { status: 500 }); return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(nextGemini) }] } }] }), { status: 200 }); };
const ORIGIN = 'https://auratech01.github.io';
const env = { GEMINI_API_KEY: 'SECRET-KEY' };
const call = async (body, o = ORIGIN, ip = '1.1.1.' + Math.floor(Math.random() * 250), e = env) => {
  const req = new Request('https://w.example/', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: o, 'CF-Connecting-IP': ip }, body: JSON.stringify(body) });
  const res = await worker.fetch(req, e); let j = null; try { j = await res.json(); } catch (x) {} return { status: res.status, j };
};
const q = text => ({ messages: [{ role: 'user', content: text }] });
const check = (name, ok, extra='') => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  -> ' + extra : '')); };

let r = await call(q('hi'), 'https://evil.example'); check('foreign origin is blocked (403)', r.status === 403);
const pre = await worker.fetch(new Request('https://w.example/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env); check('CORS preflight ok for the real site', pre.status === 204 && pre.headers.get('Access-Control-Allow-Origin') === ORIGIN);
r = await call(q('hi'), ORIGIN, '9.9.9.9', {}); check('missing API key -> 500, nothing leaked', r.status === 500 && !JSON.stringify(r.j).includes('SECRET'));

nextGemini = { answer: "Malaika's CGPA is 3.72 out of 4.00.", grounded: true, facts: [idOf(/CGPA/)] };
r = await call(q('what is her cgpa?')); check('grounded answer is passed through', r.status === 200 && r.j.grounded === true && r.j.reply.includes('3.72'), r.j && r.j.reply);
check('API key only goes to Google in a header, never in the body', upstreamHeaders['x-goog-api-key'] === 'SECRET-KEY' && !JSON.stringify(upstreamBody).includes('SECRET-KEY'));
check('request asks for JSON schema, low temperature, no thinking tokens', upstreamBody.generationConfig.temperature <= 0.2 && upstreamBody.generationConfig.responseMimeType === 'application/json' && upstreamBody.generationConfig.thinkingConfig.thinkingBudget === 0);
check('system prompt contains the facts and the rules', upstreamBody.systemInstruction.parts[0].text.includes('[F1]') && upstreamBody.systemInstruction.parts[0].text.includes('Never guess'));

nextGemini = { answer: 'She has 7 years of professional experience.', grounded: true, facts: [idOf(/Education/)] };
r = await call(q('how many years of experience?')); check('invented number is rejected -> safe fallback', r.j.grounded === false && /don't have that information/.test(r.j.reply), r.j.reply);
nextGemini = { answer: 'See her work at https://example.com/portfolio', grounded: true, facts: [idOf(/Contact email/)] };
r = await call(q('website?')); check('invented link is rejected', r.j.grounded === false);
nextGemini = { answer: 'You can write to her at someone.else@gmail.com', grounded: true, facts: [idOf(/Contact email/)] };
r = await call(q('email?')); check('invented email is rejected', r.j.grounded === false);
nextGemini = { answer: 'Her email is auratech1101@gmail.com.', grounded: true, facts: [idOf(/Contact email/)] };
r = await call(q('email?')); check('real email from a cited fact is allowed', r.j.grounded === true, r.j.reply);
nextGemini = { answer: 'Bitcoin is a cryptocurrency.', grounded: false, facts: [] };
r = await call(q('what is bitcoin')); check('off-topic (grounded=false) -> safe fallback', r.j.grounded === false && /don't have that information/.test(r.j.reply));
nextGemini = { answer: 'She knows Rust.', grounded: true, facts: ['F999'] };
r = await call(q('does she know rust')); check('citing a fact that does not exist is rejected', r.j.grounded === false);
nextGemini = { answer: 'She knows Rust.', grounded: true, facts: [] };
r = await call(q('does she know rust')); check('answer without any cited fact is rejected', r.j.grounded === false);
nextGemini = 'down'; r = await call(q('hello')); check('Gemini down -> 502 (website falls back to the built-in brain)', r.status === 502);
nextGemini = { answer: 'ok', grounded: true, facts: ['F1'] };
r = await call({ messages: [] }); check('empty question -> 400', r.status === 400);
r = await call({ messages: [{ role: 'assistant', content: 'hi' }] }); check('no user message -> 400', r.status === 400);
await call(q('x'.repeat(2000)).constructor === Object ? { messages: [{ role: 'user', content: 'y'.repeat(900) }] } : null);
check('very long message is cut to 500 characters before it reaches Gemini', upstreamBody.contents.at(-1).parts[0].text.length === 500);
const many = { messages: Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i })).concat([{ role: 'user', content: 'last' }]) };
await call(many); check('history is capped at 6 turns', upstreamBody.contents.length <= 6 && upstreamBody.contents[0].role === 'user');
// rate limit: same IP, 6 per minute
let codes = []; for (let i = 0; i < 8; i++) codes.push((await call(q('hello ' + i), ORIGIN, '7.7.7.7')).status);
check('per-IP limit: 7th request in a minute gets 429', codes.slice(0, 6).every(c => c === 200) && codes[6] === 429, codes.join(','));
// daily per-IP limit (40) using a fresh worker instance via KV mock
const store = new Map(); const KV = { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
let last; for (let i = 0; i < 12; i++) last = await call(q('hi'), ORIGIN, '8.8.8.8', { GEMINI_API_KEY: 'k', CHAT_KV: KV });
check('KV-backed limits work too', [...store.keys()].some(k => k.startsWith('m:8.8.8.8')) && last.status === 429, 'status ' + last.status);
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
