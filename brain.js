/* ------------------------------------------------------------------
   The brain behind AURA's answers (no API key, runs in the browser).
   It scores every topic against the visitor's words (weighted keywords, phrases, Roman Urdu words, typo
   tolerance), looks up exact skills/tools/technologies, remembers the last project that was discussed,
   and says "I'm not sure" with suggestions instead of guessing wrong.
   All facts come from data.js (window.PORTFOLIO).
------------------------------------------------------------------- */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.PortfolioBrain = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const norm = s => String(s).toLowerCase().replace(/c\+\+/g, ' cpp ').replace(/c#/g, ' csharp ').replace(/node\.?js/g, ' nodejs ')
    .replace(/[’']/g, '').replace(/[^a-z0-9\u0600-\u06ff\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const stem = w => {
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) return w.slice(0, -1);
    return w;
  };
  const toks = s => norm(s).split(' ').filter(Boolean).map(stem);
  function lev(a, b, max) {            // optimal string alignment distance (swaps count as one typo)
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d = [];
    for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  const W = str => { const m = {}; String(str).trim().split(/\s+/).forEach(p => { const [t, w] = p.split(':'); m[stem(norm(t).replace(/ /g, ''))] = +w || 3; }); return m; };
  const uniq = a => [...new Set(a)];
  const ROMAN_MARK = new Set(('kya ka ki ke ko hai hain hy hn h mein me ap aap tum tumhara tumhari apka aapka apki aapki naam nam rabta karun batayein batao bataye bataiye bataen batain kaise kese kon kaun kab kahan kidhar kitna kitni kitne ' +
    'nahi nhi mujhe mjy mujy mera meri mere hoon hun ho hota hoti karti karta karte kar kr kro karo krna sakti sakta sakte baare bare liye lye kia kiya uska uski unka unki wo woh yeh ye aur ya se tak par pe kuch sab bohat buhat bht zaroor shukria').split(' '));
  const detectLang = text => {
    const t = String(text || '');
    if (/[\u0600-\u06ff]/.test(t)) return 'ur';
    const w = norm(t).split(' ').filter(Boolean);
    const hits = w.filter(x => ROMAN_MARK.has(x)).length;
    return hits >= 2 || (hits >= 1 && w.length <= 3) ? 'roman' : 'en';
  };
  const KNOWN_TECH = ('react angular vue svelte nextjs nodejs express java kotlin swift flutter dart php laravel django flask fastapi ruby rails golang rust csharp dotnet unity unreal godot ' +
    'docker kubernetes aws azure gcp firebase mongodb postgres postgresql mysql typescript tensorflow pytorch keras opencv pandas numpy sklearn scikit nlp openai langchain tailwind bootstrap ' +
    'jquery wordpress shopify blender photoshop illustrator excel powerbi tableau matlab r scala perl bash powershell redis graphql supabase').split(' ');

  function make(D, opts) {
    opts = opts || {};
    const C = D.contact || {}, E = D.education || {}, P = D.projects || [];
    const first = (D.name || 'Malaika').split(' ')[0];
    const abs = u => { try { return new URL(u, (typeof location !== 'undefined' ? location.href : 'https://example.com/')).href; } catch (e) { return u; } };
    const state = { lastProject: -1 };

    /* ---------- facts ---------- */
    const pages = D.skillPages || [];
    const coreGroups = pages.filter(p => !p.glow).flatMap(p => p.groups);
    const exploreItems = uniq(pages.filter(p => p.glow).flatMap(p => p.groups.flatMap(g => g.items)));
    const coreItems = uniq(coreGroups.flatMap(g => g.items));
    const skillText = () => coreGroups.map(g => `**${g.group}:** ${g.items.join(', ')}`).join('\n') + (exploreItems.length ? `\n**Exploring:** ${exploreItems.join(', ')}` : '');
    const linksOf = p => [p.live && `[Live demo](${p.live})`, p.source && `[Source code](${p.source})`].filter(Boolean).join(' · ');
    const projectsList = () => P.map(p => `**${p.name}**: ${p.short}`).join('\n');
    const contactText = () => [C.email && `Email: [${C.email}](mailto:${C.email})`, C.linkedin && `[LinkedIn](${C.linkedin})`, C.github && `[GitHub](${C.github})`, C.resume && `[Resume (PDF)](${abs(C.resume)})`].filter(Boolean).join('\n');

    /* ---------- technology lookup (exact skills / tools / project tags) ---------- */
    const ALIASES = { js: 'javascript', py: 'python', cpp: 'c++', ml: 'machine learning', ai: 'artificial intelligence', html: 'html5', css: 'css3', api: 'rest apis', apis: 'rest apis',
      canvas: 'html5 canvas', threading: 'multi threading', multithreading: 'multi threading', gemini: 'google gemini api', vscode: 'vs code', 'visual studio code': 'vs code',
      github: 'git & github desktop', git: 'git & github desktop', ubuntu: 'linux (ubuntu)', linux: 'linux (ubuntu)', 'packet tracer': 'cisco packet tracer', tkinter: 'tkinter', customtkinter: 'customtkinter' };
    const techIndex = [];                                  // {keys:[], label, kind, where}
    const addTech = (label, kind, where, extra) => {
      const base = norm(label.replace(/\(.*?\)/g, ' '));
      const keys = uniq([base, norm(label), ...(extra || [])]).filter(k => k.length > 1);
      techIndex.push({ keys, label, kind, where });
    };
    coreGroups.forEach(g => g.items.forEach(i => addTech(i, 'core', g.group)));
    exploreItems.forEach(i => addTech(i, 'exploring', 'currently exploring'));
    (D.tools || []).forEach(t => addTech(t.name, 'tool', t.note, t.name.toLowerCase().includes('vs code') ? ['vscode', 'visual studio code'] : t.name.toLowerCase().includes('git') ? ['git', 'github'] : t.name.toLowerCase().includes('linux') ? ['linux', 'ubuntu'] : t.name.toLowerCase().includes('packet') ? ['packet tracer'] : []));
    P.forEach((p, i) => (p.tags || []).forEach(t => { const k = norm(t.replace(/\(.*?\)/g, ' ')); const hit = techIndex.find(x => x.keys.includes(k)); if (hit) (hit.projects = hit.projects || []).push(i); else addTech(t, 'tag', p.name); const h2 = techIndex.find(x => x.keys.includes(k)); (h2.projects = h2.projects || []); if (!h2.projects.includes(i)) h2.projects.push(i); }));
    function findTech(q) {
      const padded = ' ' + norm(q) + ' ';
      let best = null;
      const consider = (entry, key) => { if (padded.includes(' ' + key + ' ') || padded.includes(' ' + key + 's ')) { if (!best || key.length > best.key.length) best = { entry, key }; } };
      techIndex.forEach(t => t.keys.forEach(k => consider(t, k)));
      Object.keys(ALIASES).forEach(a => { if (padded.includes(' ' + a + ' ')) { const target = norm(ALIASES[a]); const t = techIndex.find(x => x.keys.includes(target) || x.keys.some(k => k.startsWith(target))); if (t && (!best || a.length > best.key.length)) best = { entry: t, key: a }; } });
      return best;
    }
    const unknownTech = q => { const set = new Set(norm(q).split(' ')); return KNOWN_TECH.find(t => set.has(t) && !findTech(t)) || null; };

    /* ---------- project data-driven keywords ---------- */
    const GENERIC = new Set('code coding project experience the and for with that this from into your their about website site app application using built build made make real time'.split(' '));
    const projWords = P.map(p => uniq(toks([p.name, p.subtitle, p.short, (p.highlights || []).join(' ')].join(' '))).filter(w => w.length > 3 && !GENERIC.has(w)));
    const projKw = P.map((p, i) => {
      const m = {};
      toks(p.name).forEach(w => { if (!GENERIC.has(w) && w.length > 2) m[w] = 9; });
      projWords[i].forEach(w => { const unique = projWords.every((ws, j) => j === i || !ws.includes(w)); if (unique && !m[w]) m[w] = 5; });
      return m;
    });

    /* ---------- topics ---------- */
    const T = [];
    const topic = t => { t.kw = W(t.kw || ''); t.ph = t.ph || []; t.prio = t.prio || 0; T.push(t); return t; };

    const NM = () => (opts.name || 'AURA');
    const pick = (ctx, en, roman, ur) => (ctx && ctx.lang === 'ur' ? (ur || roman) : ctx && ctx.lang === 'roman' ? roman : en);
    topic({ id: 'greet', kw: 'hi:6 hello:6 hey:6 salam:6 assalam:6 aoa:6 hola:5 sup:4 yo:3 alaikum:6', ph: [/^(hi|hello|hey|salam|assalam)\b/], prio: -1,
      a: ctx => pick(ctx, `Hi! I'm ${NM()}, ${first}'s guide robot. Ask me about her projects, skills, education or how to contact her.`,
        `Assalam o Alaikum! Main ${NM()} hoon, ${first} ki guide robot. Aap mujh se unke projects, skills, education ya rabta karne ke baare mein pooch sakte hain.`,
        `السلام علیکم! میں ${NM()} ہوں، ${first} کی گائیڈ روبوٹ۔ آپ مجھ سے ان کے پروجیکٹس، اسکلز، تعلیم یا رابطے کے بارے میں پوچھ سکتے ہیں۔`), q: 'Hi', f: ['Projects', 'Skills', 'Contact'] });
    topic({ id: 'smalltalk', kw: 'kaise:3 kese:3 hal:3 haal:3', ph: [/how are you|how r u|how do you do|kaise ho|kese ho|kaisi ho|kya hal|kya haal|aap kaise|ap kaise|tum kaise|how is it going/], prio: 3,
      a: ctx => pick(ctx, `I'm doing great, thanks for asking! What would you like to know about ${first}?`, `Main bilkul theek hoon, shukriya! ${first} ke baare mein kya jaanna chahte hain?`, `میں بالکل ٹھیک ہوں، شکریہ! ${first} کے بارے میں آپ کیا جاننا چاہتے ہیں؟`), q: 'How are you?', f: ['Projects', 'Skills', 'Contact'] });
    topic({ id: 'thanks', kw: 'thanks:7 thank:7 shukria:7 thx:6 jazakallah:6 great:3 nice:3 cool:3 awesome:3 perfect:3 ok:2 okay:2 mehrbani:6', a: ctx => pick(ctx, "You're welcome! Anything else you'd like to know?", 'Koi baat nahi! Kuch aur poochna ho to zaroor batayein.', 'کوئی بات نہیں! کچھ اور پوچھنا ہو تو ضرور بتائیں۔'), q: 'Thanks', f: ['Projects', 'Contact'] });
    topic({ id: 'bye', kw: 'bye:7 goodbye:7 later:3 allah:2 hafiz:5 khuda:3', ph: [/see (you|ya)/], a: ctx => pick(ctx, 'Bye! Come back anytime. I will be right here.', 'Allah hafiz! Jab dil chahe wapas aaiye, main yahin hoon.', 'اللہ حافظ! جب دل چاہے واپس آئیے، میں یہیں ہوں۔'), q: 'Bye', f: [] });
    topic({ id: 'aura', kw: 'aura:8 robot:4 bot:4 chatbot:5 assistant:4 you:1 yourself:3 made:1 built:1 created:1', ph: [/who (built|made|created|designed) (this|the) (site|website|portfolio|page)|who are you|what are you|your name|are you (a |an )?(bot|ai|robot|human|real|person)|who (made|built|created) you|about you\b|tell me about you\b|(ap|aap|tum|apka|aapka|tumhara|tumhari)\s+(ka\s+|ki\s+)?(kya\s+)?(naam|nam)|(ap|aap|tum)\s+(kon|kaun|kya)\s+(ho|hain|hai|h)|apna (naam|nam)|ap ka naam|aap ka naam/], prio: 3,
      a: ctx => pick(ctx, `I'm ${NM()}, the tiny guide robot on ${first}'s portfolio. I answer from the facts on this site${opts.endpoint ? ', with a little help from an AI model' : ' (I am a small built-in assistant, not a big AI model)'}. I can show projects, skills, education, certificates and contact details.`,
        `Mera naam ${NM()} hai. Main ${first} ki portfolio ki chhoti guide robot hoon aur is website ki maloomat se jawab deti hoon${opts.endpoint ? '' : ' (main ek chhota built-in assistant hoon, bara AI model nahi)'}. Aap mujh se projects, skills, education, certificates aur contact ke baare mein pooch sakte hain.`,
        `میرا نام ${NM()} ہے۔ میں ${first} کی پورٹ فولیو کی چھوٹی گائیڈ روبوٹ ہوں اور اس ویب سائٹ کی معلومات سے جواب دیتی ہوں۔ آپ مجھ سے پروجیکٹس، اسکلز، تعلیم اور رابطے کے بارے میں پوچھ سکتے ہیں۔`), q: 'Who are you?', f: ['Projects', 'Skills', 'Contact'] });
    topic({ id: 'help', kw: 'help:6 assist:4 can:1 do:1 ask:2 option:3 menu:3 feature:3 madad:6 madat:6', ph: [/what can you (do|answer|tell)|how (do|can) (i|you) (use|help)|what (should|can) i ask|kya (kar|kr) sakti|kya poochu|kya pooch/], prio: 2,
      a: ctx => pick(ctx, `You can ask me things like:\n• "What projects has ${first} built?"\n• "Does she know Python?"\n• "What is her CGPA?"\n• "Is she open to internships?"\n• "How can I contact her?"`,
        `Aap mujh se aise sawal pooch sakte hain:\n• "${first} ke projects kya hain?"\n• "Kya unhein Python aati hai?"\n• "Unka CGPA kitna hai?"\n• "Kya wo internship ke liye available hain?"\n• "Unse rabta kaise karun?"`), q: 'What can I ask?', f: ['Projects', 'Skills', 'Education', 'Contact'] });
    topic({ id: 'about', kw: 'about:2 introduce:5 background:4 bio:5 profile:3 summary:4 overview:4 malaika:4 fatima:3 who:2 kon:3 kaun:3 tareef:5 introduction:5', ph: [/who (is|s) (malaika|she|her|this)|^(tell me |say )?(something |more |a bit )?about (malaika|her|herself)$|introduce (her|malaika)|what does (she|malaika) do$/], prio: 1,
      a: () => `${(D.about || [])[0] || ''}\n\n${D.role || ''} · ${D.tagline || ''}`.trim(), q: `Who is ${first}?`, f: ['Education', 'Projects', 'Skills'] });
    topic({ id: 'skills', kw: 'maharat:5 hunar:5 skill:6 technolog:3 tech:3 stack:4 language:3 expertise:5 proficient:5 proficiency:5 knowledge:3 abilit:4 capabilit:4 competenc:5 programming:4 coding:3 code:2 develop:2 strength:1 toolkit:3 know:2', ph: [/what (can|does) (she|malaika) (do|know|code|use)|tech(nical)? stack|programming languages?|skill ?set/], prio: 1,
      a: () => skillText(), q: 'What are her skills?', f: ['AI', 'Projects', 'Tools'] });
    topic({ id: 'ai', kw: 'ai:7 artificial:5 intelligence:4 ml:7 machine:3 learning:2 neural:5 network:1 gemini:5 llm:6 deep:2 nlp:6 model:2 chatgpt:5 openai:5 data:1 science:2', ph: [/machine learning|deep learning|neural net|artificial intelligence|\bai\b/], prio: 2,
      a: () => { const g = P.find(x => (x.tags || []).some(t => /gemini/i.test(t))); return `AI is ${first}'s main focus. ` + (g ? `In **${g.name}** she integrates the Google Gemini API for AI-assisted code auditing. ` : '') + (exploreItems.length ? `She is currently exploring: ${exploreItems.join(', ')}.` : '') + `\nThe portfolio does not claim any trained ML models yet, she is learning it step by step.`; },
      q: 'What AI work has she done?', f: ['Projects', 'Skills', 'Contact'] });
    topic({ id: 'gamedev', kw: 'game:5 gaming:6 gamedev:8 unity:6 unreal:6 godot:6 play:1 player:1 level:2', ph: [/game ?dev|game design|make games|built (a )?game|any games?/], prio: 2,
      a: () => { const g = P.find(x => /game|escape/i.test(x.short + x.subtitle)); return (g ? `**${g.name}** is her game project: ${g.short}${linksOf(g) ? '\n' + linksOf(g) : ''}\n` : '') + `Game development is on her "currently exploring" list. AI is her main focus right now.`; },
      q: 'Has she built a game?', f: ['Projects', 'AI'] });
    topic({ id: 'projects', kw: 'project:6 portfolio:2 work:2 built:3 build:3 made:2 demo:3 showcase:4 sample:3 app:2 application:2 website:2 created:2 develop:2 product:2 case:1 study:1 kya:0 kiye:3 banaye:4 banaya:4', ph: [/what (has|did|have) (she|malaika) (built|made|build|created|done)|show me (her )?(work|projects)|her (work|projects)/], prio: 1,
      a: () => 'Projects:\n' + projectsList() + '\n\nAsk about any of them for details, tech stack or links.', q: 'What projects has she built?', f: P.map(p => p.name) });
    topic({ id: 'best', kw: 'best:5 main:4 top:3 strongest:6 proud:5 proudest:6 favourite:5 favorite:5 flagship:6 impressive:5 biggest:4 major:3 important:3', ph: [/best project|main project|most impressive|strongest project|proudest|favou?rite project|flagship/], prio: 3,
      a: () => { const p = P[0]; state.lastProject = 0; return p ? `Her main project is **${p.name}**: ${p.subtitle}.\n${p.short}\nHighlights: ${(p.highlights || []).join(' · ')}.\n${linksOf(p)}`.trim() : projectsList(); }, q: 'What is her best project?', f: ['How does it work?', 'Tech stack'] });
    topic({ id: 'education', kw: 'education:6 degree:6 university:6 semester:5 cgpa:8 gpa:8 study:4 studying:4 student:2 college:5 bscs:7 grade:4 mark:3 academic:5 qualification:6 graduate:4 graduation:5 bachelor:5 school:3 vu:4 virtual:3 taleem:6 parhai:5 percentage:3', ph: [/virtual university|what (does|is) she stud|which university/], prio: 1,
      a: () => `${E.degree || ''}, ${E.school || ''}.\n${E.blurb || ''}${E.cgpa ? `\nCGPA: **${E.cgpa}**` : ''}`.trim(), q: 'What is her education?', f: ['Certificates', 'Skills'] });
    topic({ id: 'certs', kw: 'certificate:7 certification:7 certified:6 cisco:7 ccna:8 cpa:6 course:4 credential:6 badge:3 networking:4 academy:4 verified:3 diploma:3', ph: [/any certif/], prio: 1,
      a: () => (D.certs || []).map(c => `**${c.title}**\n${c.org}`).join('\n\n'), q: 'What certificates does she have?', f: ['Education', 'Skills'] });
    topic({ id: 'tools', kw: 'tool:6 editor:5 ide:4 workflow:4 software:3 vscode:6 figma:6 linux:5 git:4 version:3 control:2 tracer:5 packet:4 setup:2 environment:3', ph: [/what tools/], prio: 0,
      a: () => (D.tools || []).map(t => `**${t.name}**: ${t.note}`).join('\n'), q: 'Which tools does she use?', f: ['Skills', 'Projects'] });
    topic({ id: 'resume', kw: 'resume:9 cv:9 curriculum:7 vitae:7 download:3 pdf:6 rizume:7 biodata:5', prio: 3,
      a: () => C.resume ? `Here is her resume: [Resume (PDF)](${abs(C.resume)})` : contactText(), q: 'Where is her resume?', f: ['Contact', 'Education'] });
    topic({ id: 'contact', kw: 'contact:8 email:8 mail:6 reach:6 linkedin:9 github:9 whatsapp:7 phone:6 call:4 number:3 message:3 connect:3 touch:3 dm:4 social:4 rabta:8 address:2 profile:1 handle:3', ph: [/get in touch|how (can|do) i (reach|contact|message|email)|her (email|github|linkedin)|(find|see|view|read|browse) (her )?(code|source)/], prio: 2,
      a: () => contactText(), q: 'How can I contact her?', f: ['Resume', 'Is she available?'] });
    topic({ id: 'availability', kw: 'hire:8 hiring:8 hired:8 available:6 availability:7 internship:8 intern:7 job:6 opportunity:5 opening:4 recruit:6 recruiter:5 freelance:8 collaborat:6 employ:6 vacancy:5 position:3 naukri:7 apply:4 open:2 junior:5 fulltime:5 parttime:5 remote:4 relocate:4 join:3 team:2', ph: [/open to|looking for (a )?(job|work|internship)|can i hire|want to hire|work with (her|malaika)|is she (free|available|looking)/], prio: 2,
      a: () => `${C.availability || `${first} is open to internships and junior roles.`}\n\n${contactText()}`, q: 'Is she open to internships?', f: ['Resume', 'Projects'] });
    topic({ id: 'client', kw: 'quote:6 pricing:7 price:6 cost:6 budget:6 rate:4 charge:6 fee:5 paid:3 commission:6 custom:3 order:3 need:2 want:1 website:3 app:2 build:2 develop:2 startup:4 business:4 company:3 client:7', ph: [/(i|we) (have|need|want|am looking).{0,40}(website|app|project|software|tool|site)|build (me|us) (a|an)|can (she|you) (build|make|create|develop)|for my (business|company|shop|startup)/], prio: 2,
      a: () => `${first} is open to collaborations. For a project like yours, the best way is to email her with the details. I don't have rates or availability dates, she answers those herself.\n\n${contactText()}`, q: 'I have a project for her', f: ['Projects', 'Contact'] });
    topic({ id: 'experience', kw: 'fresher:5 experience:7 experienced:7 worked:3 employer:6 company:2 career:4 employment:6 tajurba:8 years:3 senior:3 professional:3', ph: [/work experience|how (many|much) (years|experience)|previous (job|work)/], prio: 1,
      a: () => `${first} is a student, so her experience is in projects rather than jobs. See **${P.map(p => p.name).join('**, **')}**, and her resume for details.${C.resume ? `\n[Resume (PDF)](${abs(C.resume)})` : ''}`, q: 'What experience does she have?', f: ['Projects', 'Resume'] });
    topic({ id: 'strengths', kw: 'why:3 strength:4 stand:2 unique:5 special:4 different:3 advantage:5 reason:3 convince:4 qualit:4 fit:3 suitable:4', ph: [/why (should|would|do) (we|i|you) (hire|choose|pick)|what makes (her|malaika)|stand out|why her/], prio: 3,
      a: () => `A short pitch from the portfolio:\n• ${E.cgpa ? `CGPA ${E.cgpa} at ${E.school}` : E.school || 'Strong academic record'}\n• ${P.length} finished projects, including **${(P[0] || {}).name}**${(P[0] && (P[0].highlights || []).length) ? ` (${P[0].highlights.join(', ')})` : ''}\n• ${(D.certs || []).length} Cisco certificates\n• Focus on AI: ${exploreItems.slice(0, 3).join(', ')}\nOpen to: ${C.availability || 'internships and junior roles'}.`, q: 'Why should we hire her?', f: ['Resume', 'Contact'] });
    topic({ id: 'location', kw: 'where:2 location:7 based:6 live:4 city:6 country:6 pakistan:6 lahore:5 relocat:5 from:1 town:4 kahan:6 rehti:5', ph: [/where (is|does) (she|malaika)|where (are|is) (she|you) (from|based)/], prio: 1,
      a: () => C.location ? `${first} is based in ${C.location}. For relocation or remote work, please ask her by email.\n${contactText().split('\n')[0] || ''}` : contactText(), q: 'Where is she based?', f: ['Contact'] });
    topic({ id: 'philosophy', kw: 'philosophy:8 motto:7 believe:5 belief:5 quote:5 value:4 mission:5 vision:5 passion:5 inspir:4 mindset:5', ph: [/why (does )?she (code|build)|what drives/], prio: 1,
      a: () => { const ph = D.philosophy || {}; return (ph.quote ? `"${ph.quote}"\n\n` : '') + String(ph.text || D.intro || '').split(/\n+/)[0]; }, q: 'What is her philosophy?', f: ['About', 'Projects'] });
    topic({ id: 'salary', kw: 'salary:9 earn:6 earning:6 pay:5 paid:2 compensation:8 ctc:8 package:6 stipend:7 expect:2 expectation:4 wage:7 income:5 rate:3 tankhwah:7', ph: [/salary expect|expected (salary|pay)/], prio: 3,
      a: () => `I don't have salary or rate information, ${first} discusses that herself. Please email her:\n${contactText().split('\n')[0] || ''}`, q: 'What are her salary expectations?', f: ['Contact'] });
    topic({ id: 'personal', kw: 'age:6 old:2 married:8 marriage:8 husband:7 family:6 religion:8 boyfriend:8 single:5 birthday:2 salary:0 father:5 mother:5 parent:5 sister:4 brother:4 cast:5 politic:6', ph: [/how old|date of birth|phone number of her family/], prio: 3,
      a: () => `I only share professional information from the portfolio: education, skills, projects and contact details. For anything personal, please ask ${first} directly.`, q: 'How old is she?', f: ['About', 'Contact'] });
    topic({ id: 'offtopic', kw: 'weather:8 time:3 date:3 joke:8 song:6 music:4 movie:5 football:8 cricket:8 news:6 recipe:7 translate:6 homework:5 math:5 capital:6 president:6 bitcoin:7 stock:5 poem:5 story:4 sing:6', ph: [/tell me a joke|write (me )?a|what is the (time|date|weather)|capital of/], prio: 2,
      a: () => `That is outside what I know. I only answer questions about ${first}'s portfolio: projects, skills, education, certificates and contact.`, q: '', f: ['Projects', 'Skills', 'Contact'] });

    P.forEach((p, i) => topic({ id: 'project:' + i, kw: '', prio: 2, _kw: projKw[i], project: i, q: `Tell me about ${p.name}`, f: ['How does it work?', 'Tech stack', 'Links'], a: ctx => projectAnswer(i, ctx) }));
    T.filter(t => t.project != null).forEach(t => { t.kw = t._kw; });

    function projectAnswer(i, ctx) {
      const p = P[i], s = ctx.set; state.lastProject = i;
      const has = re => [...s].some(w => re.test(w));
      if (has(/^(demo|live|link|url|visit|source|code|github|repo|repository|open|try)$/)) return `**${p.name}** links:\n${linksOf(p) || 'No public demo or source link is on the portfolio yet. You can ask her by email.'}`;
      if (has(/^(tech|stack|built|tool|language|framework|librar|technolog|use|using|made|written)$/) || (ctx.raw.includes('built with') || ctx.raw.includes('made with'))) return `**${p.name}** is built with:\n${(p.tags || []).join(', ')}.`;
      if (has(/^(how|work|architect|explain|detail|design|inside|internal|structure)$/)) return `**${p.name}**: how it works\n${p.architecture || p.short}`;
      if (has(/^(why|problem|purpose|goal|reason|solve)$/)) return `**${p.name}**: the problem\n${p.problem || p.short}`;
      if (has(/^(challenge|hard|difficult|struggle)$/) && p.challenge) return `**${p.name}**: the hardest part\n${p.challenge}`;
      if (has(/^(test|metric|number|stat|detector|level|result|performance|count)$/) && (p.metrics || []).length) return `**${p.name}**\n` + p.metrics.map(m => `• ${m[0]}: ${m[1]}`).join('\n');
      return `**${p.name}**: ${p.subtitle}\n${p.short}\nHighlights: ${(p.highlights || []).join(' · ')}.\n${linksOf(p)}\n\nAsk me "how does it work?", "tech stack" or "links".`.trim();
    }

    /* ---------- vocabulary for typo tolerance ---------- */
    const vocab = new Set(); T.forEach(t => Object.keys(t.kw).forEach(k => { if (k.length >= 4) vocab.add(k); }));
    P.forEach(p => toks(p.name).forEach(w => w.length >= 5 && vocab.add(w)));
    const COMMON = new Set(('about which where there would could should their these those other after before because things first think thing great looks world right every still using since while under again never often maybe today ' +
      'three check group tools build built whats where whose being doing going years state price paid works worked quite really please thanks hello other others another').split(' '));
    function fix(rawTokens) {
      return rawTokens.map(w => {
        const st = stem(w);
        if (w.length < 5 || vocab.has(st) || vocab.has(w) || COMMON.has(w) || /\d/.test(w)) return st;
        const max = w.length >= 8 ? 2 : 1; let best = null, bd = max + 1;
        vocab.forEach(v => { const d = Math.min(lev(w, v, max), lev(st, v, max)); if (d < bd) { bd = d; best = v; } });
        return best && bd <= max ? best : st;
      });
    }

    /* ---------- answer ---------- */
    const CHIP_Q = { 'Projects': 'What projects has she built?', 'Skills': 'What are her skills?', 'Contact': 'How can I contact her?', 'Education': 'What is her education?', 'AI': 'What AI work has she done?',
      'Tools': 'Which tools does she use?', 'Resume': 'Where is her resume?', 'About': `Who is ${first}?`, 'Certificates': 'What certificates does she have?', 'Is she available?': 'Is she open to internships?' };
    const LEAD = { skills: 'Malaika ki skills:', projects: 'Malaika ke projects:', education: 'Malaika ki education:', certs: 'Malaika ke certificates:', tools: 'Malaika ke tools:', contact: 'Rabta karne ke raaste:', resume: 'Malaika ka resume:', availability: 'Availability:', best: 'Malaika ka sab se bara project:', about: 'Malaika ke baare mein:', location: 'Location:', strengths: 'Mukhtasar taaruf:' };
    function reply(text, chips, id, conf) { return { text, chips: (chips || []).map(c => ({ label: c, q: CHIP_Q[c] || c })), id, conf: conf || 0 }; }

    function answer(question) {
      const raw = norm(question);
      const lang = detectLang(question);
      if (!raw) return reply(lang === 'en' ? 'Ask me anything about ' + first + '.' : first + ' ke baare mein kuch bhi poochiye.', ['Projects', 'Skills', 'Contact'], 'empty');
      const tk = fix(norm(question).split(' ').filter(Boolean)), set = new Set(tk);
      const ctx = { raw, set, tk, lang };

      // 1) exact technology lookup ("does she know Python?", "which project uses Canvas?")
      const hit = findTech(question);
      const asksProjects = [...set].some(w => /^(project|used|use|using|built|made)$/.test(w)) && /\b(which|what|where|used|uses|using)\b/.test(raw);
      if (hit && !(hit.entry.kind === 'exploring' && /artificial|machine|neural|intelligen|game|\bai\b/i.test(hit.entry.label)) &&
          !(hit.entry.kind === 'tool' && /link|url|profile|account|username|handle|page|repo|repository|contact/.test(raw)) && !projKw.some(m => Object.keys(m).some(k => m[k] >= 9 && set.has(k)))) {
        const e = hit.entry, ps = (e.projects || []).map(i => P[i].name);
        let t;
        if (e.kind === 'exploring') t = `${first} is currently **exploring ${e.label}**, so it is not yet one of her core skills.`;
        else if (e.kind === 'tool') t = `Yes, **${e.label}** is part of her toolkit (${e.where}).`;
        else if (e.kind === 'core') t = `Yes, **${e.label}** is one of her core skills (${e.where}).`;
        else t = `**${e.label}** appears in her project **${e.where}**.`;
        if (ps.length) t += `\nUsed in: ${ps.join(', ')}.`;
        if (asksProjects && ps.length) t = `${ps.length > 1 ? 'Projects' : 'Project'} using **${e.label}**: ${ps.join(', ')}.`;
        const pi = (e.projects || [])[0]; if (pi != null) state.lastProject = pi;
        return reply(t, ['Skills', 'Projects'], 'tech:' + e.label, 9);
      }
      const unk = unknownTech(question);
      if (unk && /know|use|work|experience|familiar|skill|good|can|has|have|does|with|proficient|learn/.test(raw)) {
        return reply(`I don't see **${unk}** listed on ${first}'s portfolio. Her core skills are ${coreItems.slice(0, 8).join(', ')}, and she is exploring ${exploreItems.slice(0, 3).join(', ')}. If you need ${unk} specifically, please email her.`, ['Skills', 'Contact'], 'tech:unknown', 8);
      }

      const rank = x => x.s + x.t.prio * 0.4 + (x.t.project != null && x.s >= 9 ? 10 : 0);
      // 2) score every topic
      const scored = T.map(t => {
        let s = 0;
        set.forEach(w => { if (t.kw[w]) s += t.kw[w]; });
        t.ph.forEach(re => { if (re.test(raw)) s += 7; });
        return { t, s };
      }).filter(x => x.s > 0).sort((a, b) => rank(b) - rank(a));

      // follow-up about the project we were just talking about ("and its tech stack?", "links?")
      const followRe = /^(tech|stack|link|demo|live|source|code|github|repo|how|work|architect|explain|design|why|problem|challenge|metric|test|detail|built|tool|framework|language|technolog)$/;
      const isFollow = [...set].some(w => followRe.test(w));
      const projHit = scored.find(x => x.t.project != null);
      const pronoun = [...set].some(w => /^(it|its|this|that|same|there|one|them)$/.test(w)), personal = [...set].some(w => /^(she|her|malaika|skill|resume|contact|education)$/.test(w));
      if (!projHit && state.lastProject >= 0 && isFollow && !personal && (pronoun || tk.length <= 3) && (!scored[0] || scored[0].s < 16)) {
        return reply(projectAnswer(state.lastProject, ctx), ['Projects', 'Contact'], 'project:' + state.lastProject + ':follow', 6);
      }

      const top = scored[0];
      if (top && top.s >= 4) {
        const t = top.t;
        if (t.project == null && t.id !== 'best') state.lastProject = -1;     // topic changed: forget the last project
        let text = t.a(ctx);
        if (lang !== 'en' && LEAD[t.id] && !/[\u0600-\u06ff]/.test(text)) text = LEAD[t.id] + '\n' + text;     // short Roman Urdu lead-in (the facts stay exactly as written)
        return reply(text, t.f, t.id, top.s);
      }

      // 3) not sure: say so and offer the closest topics
      const sug = uniq(scored.filter(x => x.t.q).slice(0, 3).map(x => x.t.q));
      const defaults = ['What projects has she built?', 'What are her skills?', 'How can I contact her?'];
      const list = uniq([...sug, ...defaults]).slice(0, 3);
      if (lang === 'en') return { text: "I'm not sure I understood that. I know about " + first + "'s projects, skills, education, certificates and contact details. Did you mean one of these?", chips: list.map(q => ({ label: q, q })), id: 'unsure', conf: 0 };
      const ur = lang === 'ur';
      const chipsUr = ur ? ['پروجیکٹس کیا ہیں؟', 'اسکلز کیا ہیں؟', 'رابطہ کیسے کروں؟'] : [first + ' ke projects kya hain?', first + ' ki skills kya hain?', 'Rabta kaise karun?'];
      return { text: ur ? `مجھے یہ سوال پوری طرح سمجھ نہیں آیا۔ میں ${first} کے پروجیکٹس، اسکلز، تعلیم، سرٹیفکیٹس اور رابطے کے بارے میں بتا سکتی ہوں۔ کیا ان میں سے کچھ پوچھنا چاہیں گے؟`
        : `Mujhe ye sawal poori tarah samajh nahi aaya. Main ${first} ke projects, skills, education, certificates aur contact ke baare mein bata sakti hoon. Kya inmein se kuch poochna chahte hain?`, chips: chipsUr.map(q => ({ label: q, q })), id: 'unsure', conf: 0 };
    }
    return { answer, state };
  }
  return { make, norm, lang: detectLang };
});
