/* Regenerates chatbot-worker.js from data.js (so the AI's FACTS always match your portfolio).
   Usage:  node tools/make-worker.js     then paste the new chatbot-worker.js into Cloudflare. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), ctx);
const D = ctx.window.PORTFOLIO, C = D.contact || {}, E = D.education || {}, P = D.projects || [];
const F = [];
const add = t => { t = String(t).replace(/\s+/g, ' ').trim(); if (t) F.push(t); };
const sentences = s => String(s || '').match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [];

add(`${D.name} is a ${D.role}. Her tagline is "${D.tagline}".`);
(D.about || []).forEach(p => add('About her: ' + p));
if (E.degree) add(`Education: ${E.degree} at ${E.school}. ${E.blurb || ''}${E.cgpa ? ` CGPA: ${E.cgpa}.` : ''}${E.label ? ' ' + E.label + '.' : ''}`);
(D.skillPages || []).forEach(pg => pg.groups.forEach(g => add(`${pg.glow ? 'She is currently exploring (not yet a core skill)' : 'Core skills'} - ${g.group}: ${g.items.join(', ')}.`)));
(D.tools || []).forEach(t => add(`Tool she uses: ${t.name} (${t.note}).`));
(D.certs || []).forEach(c => add(`Certificate: ${c.title}, ${c.org}. ${c.note || ''}`));
P.forEach(p => {
  add(`Project "${p.name}": ${p.subtitle}. ${p.short}`);
  if ((p.highlights || []).length) add(`${p.name} highlights: ${p.highlights.join('; ')}.`);
  if ((p.tags || []).length) add(`${p.name} is built with: ${p.tags.join(', ')}.`);
  if (p.problem) add(`${p.name}, the problem it solves: ${p.problem}`);
  sentences(p.architecture).slice(0, 4).forEach(s => add(`${p.name}, how it works: ${s}`));
  (p.metrics || []).forEach(m => add(`${p.name} - ${m[0]}: ${m[1]}.`));
  add(p.live || p.source ? `${p.name} links:${p.live ? ' live demo ' + p.live : ''}${p.source ? ' source code ' + p.source : ''}.` : `${p.name} has no public demo or source link on the portfolio yet.`);
});
add(`The portfolio lists ${P.length} projects: ${P.map(p => p.name).join(', ')}. It lists ${(D.certs || []).length} certificates.`);
if (C.email) add(`Contact email: ${C.email}.`);
if (C.github) add(`GitHub: ${C.github}`);
if (C.linkedin) add(`LinkedIn: ${C.linkedin}`);
if (C.resume) add(`Resume: a PDF file called ${C.resume} (there is a Resume button on the portfolio).`);
if (C.location) add(`Location: ${C.location}.`);
if (C.availability) add(`Availability: ${C.availability}.`);
if (D.philosophy) add(`Philosophy: "${D.philosophy.quote || ''}" ${String(D.philosophy.text || '').split(/\n+/)[0]}`);
add('AURA is the small guide robot on this portfolio. It answers only from these facts.');

const gh = (C.github || '').match(/github\.com\/([^/]+)/i);
const origins = [gh ? `https://${gh[1].toLowerCase()}.github.io` : 'https://YOUR-USERNAME.github.io'];
const out = fs.readFileSync(path.join(__dirname, 'chatbot-worker.template.js'), 'utf8')
  .replace('__ORIGINS__', JSON.stringify(origins)).replace('__FIRST__', JSON.stringify((D.name || 'Malaika').split(' ')[0]))
  .replace('__EMAIL__', JSON.stringify(C.email || '')).replace('__FACT_LIST__', JSON.stringify(F, null, 1));
fs.writeFileSync(path.join(root, 'chatbot-worker.js'), out);
console.log(`chatbot-worker.js written: ${F.length} facts, allowed origin ${origins[0]}`);
