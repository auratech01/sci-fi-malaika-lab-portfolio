/* ------------------------------------------------------------------
   Ask AURA: the chat panel. There is no separate chat robot any more: visitors click AURA (the tiny guide)
   or her "Ask me anything" button, and she perches on the panel while it is open.
   Answers: brain.js (built in, no API key). Optional real AI: data.js -> chat.endpoint = your Worker URL
   (see chatbot-worker.js); if the Worker is down it falls back to the built-in brain.
------------------------------------------------------------------- */
(() => {
  const D = window.PORTFOLIO;
  if (!D) return;
  const ENDPOINT = ((D.chat && D.chat.endpoint) || '').trim();
  const MODE = ((D.chat && D.chat.mode) || 'hybrid');       // 'hybrid' = verified facts first, AI for the rest; 'ai' = AI for everything
  const NAME = (D.guide && D.guide.name) || 'AURA';
  const first = (D.name || 'Malaika').split(' ')[0];
  const brain = window.PortfolioBrain ? window.PortfolioBrain.make(D, { name: NAME, endpoint: !!ENDPOINT }) : null;

  /* ---------- safe mini-markdown: **bold**, [label](https://...), line breaks ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = t => esc(t)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const k in attrs) k === 'class' ? n.className = attrs[k] : n.setAttribute(k, attrs[k]);
    kids.forEach(x => n.append(x));
    return n;
  };
  const fire = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  /* ---------- real AI through your Worker (optional; the API key lives only in Cloudflare) ---------- */
  const history = [];
  let aiCalls = 0, lastAi = 0;
  const AI_MAX = 15;                                           // per visit, so one visitor can't use up the daily limit
  async function remote() {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal, body: JSON.stringify({ messages: history.slice(-6) }) });
      const j = await r.json().catch(() => null);
      if (r.status === 429 && j && j.reply) return { reply: j.reply, grounded: false };
      if (!r.ok) throw new Error('HTTP ' + r.status);
      if (!(j && typeof j.reply === 'string' && j.reply.trim())) throw new Error('unexpected reply from the Worker (is chatbot-worker.js pasted and deployed?)');
      return { reply: j.reply.trim(), grounded: j.grounded !== false };
    } finally { clearTimeout(t); }
  }
  const CONTACT = [{ label: 'Contact', q: 'How can I contact her?' }, { label: 'Projects', q: 'What projects has she built?' }];
  /* Hybrid: the built-in brain answers every question it is confident about from the verified facts (no AI, no cost, no
     chance of invention). Only questions it is unsure about go to the AI, which is itself fenced in by the Worker. */
  async function answerFor(text) {
    const local = brain ? brain.answer(text) : null;
    const sure = local && local.id !== 'unsure' && local.id !== 'empty' && local.conf >= 6;
    const urdu = window.PortfolioBrain && window.PortfolioBrain.lang(text) !== 'en';        // answer in the visitor's language: let the AI write it
    if (ENDPOINT && (MODE === 'ai' || !sure || urdu) && aiCalls < AI_MAX && Date.now() - lastAi > 1200) {
      try {
        aiCalls++; lastAi = Date.now();
        const r = await remote();
        if (r) return { text: r.reply, chips: r.grounded ? [] : CONTACT, ai: r.grounded };
      } catch (e) { console.warn('AURA: the AI Worker could not be reached (' + (e && e.message ? e.message : e) + '). Using the built-in answers. Open your Worker URL + ?test=1 to see why.'); }
    }
    return local || { text: 'I can answer questions about ' + first + "'s projects, skills and contact details.", chips: START };
  }

  /* ---------- UI ---------- */
  const log = el('div', { id: 'cbLog', role: 'log', 'aria-live': 'polite' });
  const input = el('input', { id: 'cbInput', type: 'text', maxlength: '500', placeholder: 'Ask me anything about ' + first + '\u2026', autocomplete: 'off', 'aria-label': 'Your question' });
  const send = el('button', { id: 'cbSend', type: 'submit' }, 'Send');
  const form = el('form', { id: 'cbForm' }, input, send);
  const close = el('button', { id: 'cbClose', type: 'button', 'aria-label': 'Close chat' }, '\u00d7');
  const head = el('header', { id: 'cbHead' }, el('div', {}, el('b', {}, 'ASK ' + NAME), el('small', {}, ENDPOINT ? 'Fact-checked AI, only from this portfolio' : 'Answers from ' + first + "'s portfolio")), close);
  const panel = el('section', { id: 'cbPanel', role: 'dialog', 'aria-label': 'Ask ' + NAME }, head, log, form);
  document.body.append(panel);

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };
  function add(who, text, chips, ai) {
    const m = el('div', { class: 'cbMsg ' + who });
    const body = el('div', { class: 'cbBody' }); body.innerHTML = fmt(text); m.append(body);
    if (ai) m.append(el('div', { class: 'cbAi' }, 'AI answer \u00b7 checked against the portfolio facts'));
    if (chips && chips.length) {
      const row = el('div', { class: 'cbSug' });
      chips.forEach(c => { const b = el('button', { type: 'button' }, c.label); b.addEventListener('click', () => { row.remove(); ask(c.q); }); row.append(b); });
      m.append(row);
    }
    log.append(m); scrollDown();
    return m;
  }
  const START = [{ label: 'Projects', q: 'What projects has she built?' }, { label: 'Skills', q: 'What are her skills?' }, { label: 'Open to internships?', q: 'Is she open to internships?' }, { label: 'Contact', q: 'How can I contact her?' }];

  let opened = false, busy = false;
  function openPanel(prefill) {
    if (panel.classList.contains('open')) { input.focus(); return; }
    panel.classList.add('open');
    fire('chat:open', { panel });
    if (!opened) { opened = true; add('bot', `Hi! I'm ${NAME}, ${first}'s guide robot. Ask me anything about her projects, skills, education or how to reach her.`, START); }
    setTimeout(() => { if (typeof prefill === 'string' && prefill) ask(prefill); else input.focus(); }, 60);
  }
  function closePanel() {
    if (!panel.classList.contains('open')) return;
    panel.classList.remove('open');
    fire('chat:close', {});
  }
  window.openAssistant = openPanel;
  window.closeAssistant = closePanel;
  close.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

  async function ask(text) {
    text = String(text || '').trim().slice(0, 500);
    if (!text || busy) return;
    busy = true; send.disabled = true;
    log.querySelectorAll('.cbSug').forEach(r => r.remove());
    add('user', text); history.push({ role: 'user', content: text });
    const typing = el('div', { class: 'cbMsg bot cbTyping', 'aria-label': NAME + ' is thinking' }, el('i'), el('i'), el('i'));
    log.append(typing); scrollDown();
    fire('chat:think', true);
    const t0 = Date.now();
    const out = await answerFor(text);
    const spent = Date.now() - t0, minMs = Math.min(900, 280 + out.text.length * 1.4);
    if (spent < minMs) await new Promise(r => setTimeout(r, minMs - spent));
    typing.remove(); fire('chat:think', false);
    add('bot', out.text, out.chips, out.ai); history.push({ role: 'assistant', content: out.text });
    busy = false; send.disabled = false; input.focus();
  }
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
})();
