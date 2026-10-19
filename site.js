/* ------------------------------------------------------------------
   Scrolling part of the site: project capsules  ->  project window  ->  contact
   All text comes from data.js (window.PORTFOLIO).
------------------------------------------------------------------- */
(() => {
  const D = window.PORTFOLIO;
  if (!D) return;
  const $ = id => document.getElementById(id);
  const mode = () => (innerWidth <= 768 || innerHeight > innerWidth) ? 'mobile' : 'desktop';
  const root = document.documentElement;

  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (attrs[k] === false || attrs[k] == null) continue;
      if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(k => { if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); });
    return e;
  }
  const ext = (href, cls, label) => el('a', { class: cls, href, target: '_blank', rel: 'noopener noreferrer' }, label);
  const copyText = async (text, btn) => {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const t = el('textarea', { style: 'position:fixed;opacity:0' }); t.value = text; document.body.append(t); t.select();
      try { ok = document.execCommand('copy'); } catch (e2) {} t.remove();
    }
    if (btn) { const old = btn.textContent; btn.textContent = ok ? 'Copied' : 'Press Ctrl+C'; setTimeout(() => btn.textContent = old, 1400); }
  };

  /* ================= capsules ================= */
  const track = $('capTrack'), modal = $('projModal');
  let lastFocus = null, openCap = null;

  function buildCapsule(p, i) {
    const links = el('div', { class: 'capLinks' });
    if (p.live)   links.append(ext(p.live, 'mini solid', 'Live ↗'));
    if (p.source) links.append(ext(p.source, 'mini ghost', 'Code'));
    const openBtn = el('button', { type: 'button', class: 'mini' + (p.live || p.source ? ' ghost' : ' solid') }, 'Open capsule');
    links.append(openBtn);
    links.addEventListener('click', e => { if (e.target.closest('a')) e.stopPropagation(); });

    const cap = el('article', { class: 'cap', 'data-i': i },
      el('div', { class: 'capTop' }, el('i', { class: 'led' })),
      el('div', { class: 'tube' },
        el('div', { class: 'capImg' },
          p.image ? el('img', { src: p.image, alt: p.name + ' preview', loading: 'lazy' }) : null,
          p.status ? el('span', { class: 'badge' }, p.status) : null),
        el('div', { class: 'capInfo' },
          el('p', { class: 'tag' }, p.eyebrow || ''),
          el('h3', null, p.name),
          el('p', { class: 'short' }, p.short || ''),
          (p.highlights && p.highlights.length) ? el('ul', { class: 'hl' }, p.highlights.map(h => el('li', null, h))) : null,
          links),
        el('div', { class: 'shell', 'aria-hidden': 'true' }, el('i', { class: 'gl' }), el('i', { class: 'gr' }))),
      el('div', { class: 'capBase' }));
    cap.setAttribute('role', 'group');
    cap.setAttribute('aria-label', p.name);
    const go = () => openProject(i, cap);
    cap.addEventListener('click', go);
    openBtn.addEventListener('click', e => { e.stopPropagation(); go(); });
    return cap;
  }

  function buildCapsules() {
    track.replaceChildren(...(D.projects || []).map(buildCapsule));
    setupArrows();
    if (!('IntersectionObserver' in window)) { track.querySelectorAll('.cap').forEach(c => c.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18 });
    track.querySelectorAll('.cap').forEach(c => io.observe(c));
  }

  /* swipe arrows + dots (phones) */
  function setupArrows() {
    const sec = $('capsules'), n = (D.projects || []).length;
    const mk = dir => { const b = el('button', { type: 'button', class: 'capArrow ' + dir, 'aria-label': dir === 'prev' ? 'Previous project' : 'Next project' });
      b.innerHTML = '<svg viewBox="0 0 20 28"><path d="' + (dir === 'prev' ? 'M15 3L5 14l10 11' : 'M5 3l10 11L5 25') + '" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; return b; };
    const prev = mk('prev'), next = mk('next'), dots = el('div', { class: 'capDots' }, Array.from({ length: n }, () => el('i')));
    sec.append(prev, next, dots);
    const cur = () => { const c = track.querySelector('.cap'); if (!c) return 0; const step = c.offsetWidth + 16; return Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / step))); };
    const upd = () => { const i = cur(); prev.disabled = i === 0; next.disabled = i === n - 1; [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i)); next.classList.toggle('pulse', i < n - 1); prev.classList.toggle('pulse', i > 0 && i === n - 1); };
    const go = d => { const c = track.querySelector('.cap'); track.scrollTo({ left: (cur() + d) * (c.offsetWidth + 16), behavior: 'smooth' }); };
    prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* ================= project window ================= */
  function box(cls, title, ...kids) { return el('div', { class: 'pmBox ' + (cls || '') }, el('h4', null, title), ...kids); }

  function projectView(p) {
    const wrap = el('div', { class: 'pm', tabindex: '-1' });
    const x = el('button', { type: 'button', class: 'pmX', 'aria-label': 'Close project' }, '✕');
    x.addEventListener('click', closeProject);

    const btns = el('div', { class: 'pmBtns' });
    if (p.live)   btns.append(ext(p.live, 'mini solid', 'Launch live demo ↗'));
    if (p.source) btns.append(ext(p.source, 'mini ghost', 'View source code (GitHub)'));
    const side = el('div', { class: 'pmBox' },
      el('h4', { style: 'margin-top:0' }, 'System & performance metrics'),
      (p.metrics || []).map(([k, v]) => el('div', { class: 'metric' }, el('span', null, k), el('b', null, v))),
      btns,
      (!p.live && !p.source) ? el('p', { class: 'pmNote' }, 'Live demo and code link will be added soon.') : null);

    wrap.append(
      x,
      el('div', { class: 'pmHead' },
        el('p', { class: 'eyebrow' }, '// ' + (p.eyebrow || '').toUpperCase()),
        el('h2', { id: 'pmName' }, p.name),
        p.subtitle ? el('p', { class: 'sub' }, p.subtitle) : null),
      el('div', { class: 'pmTop' },
        el('div', { class: 'pmShot' }, p.image ? el('img', { src: p.image, alt: p.name + ' screenshot' }) : null, p.status ? el('span', { class: 'badge' }, 'Status: ' + p.status) : null),
        side),
      el('div', { class: 'pmTwo' },
        p.problem ? box('warn', 'The problem / objective', el('p', null, p.problem)) : null,
        p.challenge ? box('', 'Technical challenge & solution', el('p', null, p.challenge)) : null),
      p.architecture ? el('div', null, el('h4', null, 'Architecture overview'), el('div', { class: 'pmBox' }, el('p', null, p.architecture))) : null,
      el('div', { class: 'pmTwo' },
        (p.modules && p.modules.length) ? box('', 'System architecture & core modules', el('ul', { class: 'pmList' }, p.modules.map(m => el('li', null, m)))) : null,
        (p.tags && p.tags.length) ? box('', 'Protocols, standards & frameworks', el('div', { class: 'chips' }, p.tags.map(t => el('span', { class: 'chip' }, t)))) : null),
      (p.milestones && p.milestones.length) ? el('div', null, el('h4', null, 'Technical milestones & verification'),
        el('div', { class: 'pmBox' }, el('ul', { class: 'pmList ok' }, p.milestones.map(m => el('li', null, m))))) : null);

    if (p.snippet && p.snippet.code) {
      const copy = el('button', { type: 'button', class: 'mini' }, 'Copy snippet');
      copy.addEventListener('click', () => copyText(p.snippet.code, copy));
      wrap.append(el('div', null,
        el('h4', null, p.snippet.title || 'Code snippet'),
        el('div', { class: 'code' }, el('div', { class: 'codeBar' }, el('span', null, 'Syntax: ' + (p.snippet.lang || '')), copy), el('pre', null, el('code', null, p.snippet.code)))));
    }
    wrap.append(el('div', { class: 'pmFoot' }, el('span', null, '■ ' + D.name + ' // Portfolio specification'), el('span', null, 'Press Esc or close to return')));
    return wrap;
  }

  function openProject(i, cap) {
    const p = D.projects[i];
    if (!p || openCap) return;
    openCap = cap; lastFocus = document.activeElement;
    cap.classList.add('opening');                       // glass doors slide open
    setTimeout(() => {
      modal.replaceChildren(projectView(p));
      modal.classList.remove('hidden');
      root.classList.add('modalOpen');
      void modal.offsetWidth;
      modal.classList.add('show');
      const pm = modal.firstChild; pm.scrollTop = 0; pm.focus({ preventScroll: true });
    }, 720);
  }

  function closeProject() {
    if (!openCap) return;
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden'); modal.replaceChildren();
      root.classList.remove('modalOpen');
      const c = openCap; openCap = null;
      if (c) { c.classList.remove('opening'); }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 320);
  }
  modal.addEventListener('click', e => { if (e.target === modal) closeProject(); });
  addEventListener('keydown', e => {
    if (!openCap || modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeProject();
    if (e.key === 'Tab') {                                // keep focus inside the window
      const f = [...modal.querySelectorAll('a[href],button,[tabindex="-1"]')].filter(n => !n.disabled);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ================= contact ================= */
  const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const toast = el('div', { class: 'toast', role: 'status' }); document.body.append(toast);
  let tt; const say2 = t => { toast.textContent = t; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4200); };
  /* mailto inside a preview frame would navigate the frame away (blank page) -> copy the address instead */
  function mailLink(addr, label, cls) {
    const a = el('a', { class: cls, href: 'mailto:' + addr }, label);
    a.addEventListener('click', e => { if (inFrame) { e.preventDefault(); copyText(addr); say2('Email address copied: ' + addr); } });
    return a;
  }
  const C = D.contact || {};
  const waDigits = String(C.whatsapp || '').replace(/\D/g, '');
  const short = u => String(u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  // value shown on the card: just the handle (full link stays on the button); e-mail may break after the @
  const handle = u => short(u).split('/').filter(Boolean).pop() || short(u);
  function emailNode(a) {
    const [u, d] = String(a).split('@');
    return d ? el('span', null, u + '@', document.createElement('wbr'), d) : a;
  }
  function card(title, sub, value, acts, wide) {
    return el('div', { class: 'cCard' + (wide ? ' wide' : '') }, el('h3', null, title), el('div', { style: 'font:400 11px "Share Tech Mono",monospace;color:#8fd6e2' }, sub),
      el('div', { class: 'val' }, value), el('div', { class: 'acts' }, acts));
  }
  function copyBtn(text) { const b = el('button', { type: 'button', class: 'mini ghost' }, 'Copy'); b.addEventListener('click', () => copyText(text, b)); return b; }

  function buildContact() {
    const panel = $('contactPanel');
    const cards = [];
    if (C.email)    cards.push(card('Direct email', 'Inquiries & roles', emailNode(C.email), [copyBtn(C.email), mailLink(C.email, 'Mail', 'mini solid')], !waDigits));
    if (waDigits)   cards.push(card('WhatsApp', 'Instant messaging', C.whatsapp, [copyBtn(C.whatsapp), ext('https://wa.me/' + waDigits, 'mini solid', 'Chat')]));
    if (C.linkedin) cards.push(card('LinkedIn', 'Professional network', handle(C.linkedin), [ext(C.linkedin, 'mini solid', 'Connect')]));
    if (C.github)   cards.push(card('GitHub', 'Open source code', handle(C.github), [ext(C.github, 'mini solid', 'Repositories')]));
    if (C.resume) {
      const dl = el('a', { class: 'mini solid', href: C.resume, download: 'Malaika_Fatima_Resume.pdf' }, 'Download');
      cards.push(card('Resume', 'Curriculum vitae (PDF)', 'Malaika_Fatima_Resume.pdf', [dl, ext(C.resume, 'mini ghost', 'View / Print')], true));
    }

    /* form */
    const status = el('p', { class: 'cStatus', role: 'status', 'aria-live': 'polite' });
    const f = {
      name: el('input', { name: 'name', type: 'text', required: '', autocomplete: 'name', placeholder: 'e.g. Alex / Tech Lead' }),
      email: el('input', { name: 'email', type: 'email', required: '', autocomplete: 'email', placeholder: 'e.g. name@company.com' }),
      msg: el('textarea', { name: 'message', required: '', placeholder: 'Hi Malaika, I reviewed your projects and would love to discuss…' }),
      hp: el('input', { name: '_honey', type: 'text', class: 'hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' })
    };
    const send = el('button', { type: 'submit' }, 'Send direct to inbox');
    const form = el('form', { class: 'cForm', novalidate: '' },
      el('h3', null, 'Send transmission'), el('p', { class: 'sub' }, 'Send a direct message or collaboration proposal'),
      el('div', { class: 'two' }, el('label', null, 'Your name / organization', f.name), el('label', null, 'Your email address', f.email)),
      el('label', null, 'Message / collaboration details', f.msg), f.hp, send, status);

    const say = (t, cls) => { status.textContent = t; status.className = 'cStatus ' + (cls || ''); };
    const viaMailto = (name, email, msg) => {
      if (inFrame) {                                   // preview frame: never navigate away, keep the text safe instead
        copyText(msg + '\n\n— ' + name + ' (' + email + ')');
        say('Message copied. Direct sending works on the live website. For now, paste it into an email to ' + C.email, 'err');
        return;
      }
      const subject = encodeURIComponent('Portfolio message from ' + name);
      const bodyTxt = encodeURIComponent(msg + '\n\n— ' + name + ' (' + email + ')');
      location.href = 'mailto:' + C.email + '?subject=' + subject + '&body=' + bodyTxt;
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (f.hp.value) return;
      const name = f.name.value.trim(), email = f.email.value.trim(), msg = f.msg.value.trim();
      if (!name || !msg || !/^\S+@\S+\.\S+$/.test(email)) { say('Please fill in your name, a valid email and a message.', 'err'); return; }
      if (!C.formEndpoint) { viaMailto(name, email, msg); return; }
      send.disabled = true; say('Transmitting…');
      try {
        const r = await fetch(C.formEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name, email, message: msg, _subject: 'Portfolio message from ' + name, _replyto: email, _captcha: 'false', _template: 'table' })
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === 'false' || j.success === false) throw new Error('send failed');
        form.reset(); say('Message sent. Thank you, I will reply soon.', 'ok');
      } catch (err) {
        say('Could not send directly. Trying your email app…', 'err');
        setTimeout(() => viaMailto(name, email, msg), 700);
      } finally { send.disabled = false; }
    });

    panel.replaceChildren(
      el('div', { class: 'cpHead' }, el('h2', null, 'Get in touch'), el('span', { class: 'tagc' }, 'Open for collabs')),
      el('div', { class: 'cGrid' }, cards), form,
      el('div', { class: 'cMeta' }, C.location ? el('span', null, 'Location: ' + C.location) : null, C.availability ? el('span', null, C.availability) : null));
    $('siteFoot').textContent = '© ' + new Date().getFullYear() + ' ' + D.name.toUpperCase() + ' // BUILT WITH CODE & CURIOSITY';

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { panel.classList.add('in'); io.disconnect(); } }), { threshold: 0.12 });
      io.observe(panel);
    } else panel.classList.add('in');
  }

  /* ================= backgrounds + init ================= */
  const BG = { mobile: { cap: 'images/corridor9.webp', con: 'images/side9.webp' }, desktop: { cap: 'images/corridor16.webp', con: 'images/side16.webp' } };
  function setBgs() {
    const m = mode(), cap = $('capBg'), con = $('contactBg');
    if (cap.getAttribute('data-m') !== m) { cap.src = BG[m].cap; cap.setAttribute('data-m', m); }
    if (con.getAttribute('data-m') !== m) { con.src = BG[m].con; con.setAttribute('data-m', m); }
  }
  let built = false;
  window.initSite = function () {
    if (built) return; built = true;
    setBgs(); buildCapsules(); buildContact();
    $('capHint').textContent = mode() === 'mobile' ? 'Swipe sideways and open a capsule for the full story.' : 'Open a capsule to see the full story.';
  };
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (built) { setBgs(); $('capHint').textContent = mode() === 'mobile' ? 'Swipe sideways and open a capsule for the full story.' : 'Open a capsule to see the full story.'; } }, 150); });
})();
