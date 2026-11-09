/* ------------------------------------------------------------------
   AURA: a tiny guide robot.
   - Greets visitors on the gate and flies to whatever they point at.
   - Recruiter / Client: pulls a hologram "brief" card out of herself, then offers shortcuts.
   - Viewer: keeps out of the way during the cinematic, then tags along through the portfolio.
   - Follows the mouse at a distance (never blocks a click); on phones she parks in the corner and flies to targets.
   Text comes from data.js (window.PORTFOLIO). Optional: guide: { name: 'AURA', clientLine: '...' }
------------------------------------------------------------------- */
(() => {
  const D = window.PORTFOLIO || {};
  const G = Object.assign({ name: 'AURA', clientLine: 'Websites, interactive experiences and desktop tools, built from scratch.' }, D.guide || {});
  const C = D.contact || {}, E = D.education || {}, P = D.projects || [];
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth <= 768 || innerHeight > innerWidth;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  const el = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    for (const k in (attrs || {})) k === 'class' ? n.className = attrs[k] : n.setAttribute(k, attrs[k]);
    kids.flat().forEach(c => { if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c)); });
    return n;
  };
  const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  let quiet = store.get('auraQuiet') === '1';      // "Be quiet": she stops commenting but stays clickable

  /* ---------- the robot ---------- */
  const SVG = `<svg viewBox="0 0 64 76" aria-hidden="true">
    <defs>
      <linearGradient id="aw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b4cad4"/></linearGradient>
      <linearGradient id="av" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c3340"/><stop offset="1" stop-color="#031017"/></linearGradient>
      <radialGradient id="aj"><stop offset="0" stop-color="#bffcff"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="aJet" cx="32" cy="72" rx="9" ry="4.5" fill="url(#aj)"/>
    <line x1="32" y1="13" x2="32" y2="5" stroke="#9db9c4" stroke-width="2" stroke-linecap="round"/>
    <circle class="aLed" cx="32" cy="4.5" r="3.2" fill="#ff5a7a"/>
    <path d="M17 47c0-2 2-3 5-3h20c3 0 5 1 5 3v12c0 7-6 11-15 11S17 66 17 59z" fill="url(#aw)" stroke="#7fa3b1" stroke-width="1"/>
    <circle class="aChest" cx="32" cy="55" r="4.2" fill="#00e5ff"/><circle cx="32" cy="55" r="1.8" fill="#eaffff"/>
    <circle class="aHand l" cx="9" cy="57" r="4.6" fill="url(#aw)" stroke="#7fa3b1" stroke-width="1"/>
    <circle class="aHand r" cx="55" cy="57" r="4.6" fill="url(#aw)" stroke="#7fa3b1" stroke-width="1"/>
    <rect x="28" y="41" width="8" height="5" rx="2" fill="#6f8f9c"/>
    <rect x="8" y="12" width="48" height="31" rx="14" fill="url(#aw)" stroke="#7fa3b1" stroke-width="1"/>
    <circle cx="7" cy="28" r="4.2" fill="#00e5ff"/><circle cx="57" cy="28" r="4.2" fill="#00e5ff"/>
    <rect x="13" y="18" width="38" height="19" rx="9.5" fill="url(#av)" stroke="#00e5ff" stroke-opacity=".7"/>
    <g class="aEyes" id="auraEyes">
      <ellipse class="aEyeS" cx="24.5" cy="27.5" rx="4.4" ry="4.9" fill="#00e5ff"/><ellipse class="aEyeS" cx="39.5" cy="27.5" rx="4.4" ry="4.9" fill="#00e5ff"/>
      <circle cx="25.8" cy="26" r="1.3" fill="#eaffff"/><circle cx="40.8" cy="26" r="1.3" fill="#eaffff"/>
    </g></svg>`;
  const bot = el('div', { id: 'aura', 'aria-hidden': 'true' }, el('div', { class: 'aBody' }));
  bot.firstChild.innerHTML = SVG;
  const body = bot.firstChild, eyes = bot.querySelector('#auraEyes');
  body.style.pointerEvents = 'auto'; body.style.cursor = 'pointer'; body.setAttribute('title', 'Click me to ask anything');
  body.addEventListener('click', () => { hush(); window.openAssistant && window.openAssistant(); });
  const trail = el('div', { id: 'auraTrail', 'aria-hidden': 'true' });
  const bubble = el('div', { id: 'auraBubble', role: 'status' });
  document.body.append(trail, bot, bubble);

  /* ---------- movement ---------- */
  let x = -70, y = 140, vx = 0, vy = 0, visible = false, pointer = null, target = null, lastSpark = 0, W = 40, H = 48;
  const dock = () => ({ x: innerWidth - (isMobile() ? 36 : 58), y: innerHeight - (isMobile() ? 104 : 88) });
  const keep = p => ({ x: clamp(p.x, 24, innerWidth - 24), y: clamp(p.y, 34, innerHeight - 40) });
  function anchor(node, side = 'top', pad = 34) {
    const r = node.getBoundingClientRect();
    const m = { top: [r.left + r.width / 2, r.top - pad], bottom: [r.left + r.width / 2, r.bottom + pad], left: [r.left - pad, r.top + r.height / 2],
      right: [r.right + pad, r.top + r.height / 2], topleft: [r.left + 8, r.top - pad + 4], topright: [r.right - 8, r.top - pad + 4] }[side];
    return keep({ x: m[0], y: m[1] });
  }
  const fly = (get, hold = 6000) => { target = { get, until: hold === Infinity ? Infinity : performance.now() + hold }; };
  const flyTo = (node, side, hold, pad) => fly(() => anchor(node, side, pad), hold);
  function leash() {                             // she follows the cursor but stays ~120px away, so she never blocks a click
    const dx = pointer.x - x, dy = pointer.y - y, d = Math.hypot(dx, dy), R = 120;
    if (d <= R * 1.15) return { x, y };
    const k = (d - R) / d;
    return keep({ x: x + dx * k, y: y + dy * k });
  }
  let eyeX = 0, eyeY = 0, lastT = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = clamp((t - (lastT || t)) / 16.67, 0.4, 4); lastT = t;      // same speed on slow and fast screens
    if (!visible) return;
    let g;
    if (target && (target.until === Infinity || t < target.until)) g = target.get();
    else { target = null; g = (fine && pointer && !reduce) ? leash() : keep(dock()); }
    if (reduce) { x = g.x; y = g.y; vx = vy = 0; }
    else { const damp = Math.pow(0.79, dt); vx = (vx + (g.x - x) * 0.042 * dt) * damp; vy = (vy + (g.y - y) * 0.042 * dt) * damp; x += vx * dt; y += vy * dt; }
    const bobY = reduce ? 0 : Math.sin(t / 520) * 3, bobX = reduce ? 0 : Math.cos(t / 760) * 1.5;
    bot.style.transform = `translate3d(${(x - W / 2 + bobX).toFixed(1)}px,${(y - H / 2 + bobY).toFixed(1)}px,0)`;
    body.style.transform = `rotate(${clamp(vx * 1.7, -16, 16).toFixed(1)}deg)`;
    // eyes look at the cursor (or where she is flying)
    const lx = pointer && fine ? pointer.x - x : g.x - x, ly = pointer && fine ? pointer.y - y : g.y - y, ld = Math.hypot(lx, ly) || 1;
    eyeX += ((lx / ld) * 2.4 - eyeX) * 0.2; eyeY += ((ly / ld) * 1.6 - eyeY) * 0.2;
    eyes.style.transform = `translate(${eyeX.toFixed(2)}px,${eyeY.toFixed(2)}px)`;
    if (!reduce && Math.hypot(vx, vy) > 4 && t - lastSpark > 50) {
      lastSpark = t;
      const s = el('i', { class: 'aSpark' }); s.style.left = x + 'px'; s.style.top = y + H / 2 - 4 + 'px';
      trail.append(s); setTimeout(() => s.remove(), 720);
    }
    placeBubble();
  }
  function placeBubble() {
    if (!bubble.classList.contains('show')) return;
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, m = 10;
    const left = clamp(x - bw / 2, m, innerWidth - bw - m);
    const fitsAbove = y - H / 2 - bh - 14 > m, fitsBelow = y + H / 2 + 16 + bh < innerHeight - m;
    const above = bubble.dataset.pref === 'below' ? !fitsBelow : fitsAbove;
    const top = above ? y - H / 2 - bh - 14 : y + H / 2 + 16;
    bubble.style.transform = `translate3d(${left.toFixed(1)}px,${top.toFixed(1)}px,0)`;
    bubble.style.setProperty('--tail', clamp(x - left, 18, bw - 18) + 'px');
    bubble.classList.toggle('below', !above);
  }
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer = null; });
  setInterval(() => { if (!visible) return; bot.classList.add('blink'); setTimeout(() => bot.classList.remove('blink'), 140); }, 4300);
  function setVisible(v) { visible = v; bot.classList.toggle('on', v); if (!v) { hush(); } }
  function enterFrom(px, py) { x = px; y = py; vx = vy = 0; setVisible(true); }
  requestAnimationFrame(t => { const r = bot.getBoundingClientRect(); W = r.width || 40; H = r.height || 48; frame(t); });
  addEventListener('resize', () => { const r = bot.getBoundingClientRect(); W = r.width || W; H = r.height || H; });

  /* ---------- speech bubble ---------- */
  let hushTimer = null, typeTimer = null, idleTimer = null;
  function hush() {
    clearTimeout(hushTimer); clearInterval(typeTimer); clearTimeout(idleTimer);
    bubble.classList.remove('show');
    if (target && target.frozen) target = null;
  }
  function say(text, opts = {}) {
    clearTimeout(hushTimer); clearInterval(typeTimer); clearTimeout(idleTimer);
    const buttons = opts.buttons || [];
    bubble.dataset.pref = opts.below ? 'below' : '';
    const txt = el('span', { class: 'aTxt', 'aria-hidden': 'true' });
    bubble.replaceChildren(el('small', { class: 'aName' }, '// ' + G.name), txt, el('span', { class: 'sr-only' }, text));
    if (buttons.length) {
      bubble.append(el('div', { class: 'aBtns' }, buttons.map(b => {
        const c = el('button', { type: 'button', class: 'aChip' + (b.solid ? ' solid' : '') + (b.ghost ? ' ghost' : '') }, b.label);
        c.addEventListener('click', () => { hush(); b.fn && b.fn(); });
        return c;
      })));
    }
    bubble.classList.add('show');
    if (reduce) txt.textContent = text; else { let i = 0; typeTimer = setInterval(() => { txt.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeTimer); }, 14); }
    if (buttons.length) {                          // a bubble with buttons holds still so the buttons can be clicked
      const px = x, py = y; target = { get: () => ({ x: px, y: py }), until: Infinity, frozen: true };
      idleTimer = setTimeout(hush, 24000);
    } else hushTimer = setTimeout(hush, opts.hold || Math.max(4500, text.length * 75));
  }
  bubble.addEventListener('pointerenter', () => clearTimeout(idleTimer));

  /* ---------- hologram cards she pulls out of herself ---------- */
  let card = null, veil = null, cardCloseCb = null;
  function ejectCard(def) {
    closeCard(true);
    hush();
    veil = el('div', { class: 'aVeil' });
    const close = el('button', { type: 'button', class: 'aX', 'aria-label': 'Close' }, '\u00d7');
    card = el('section', { class: 'aCard', role: 'dialog', 'aria-modal': 'true', 'aria-label': def.title, tabindex: '-1' },
      el('i', { class: 'gc tl' }), el('i', { class: 'gc tr' }), el('i', { class: 'gc bl' }), el('i', { class: 'gc br' }), close,
      el('p', { class: 'aK' }, def.kicker), el('h2', { class: 'aT' }, def.title), def.sub ? el('p', { class: 'aSub' }, def.sub) : null, def.body, def.actions);
    cardCloseCb = def.onClose || null;
    document.body.append(veil, card);
    const beam = el('div', { class: 'aBeam' }); document.body.append(beam);
    requestAnimationFrame(() => veil.classList.add('show'));
    const r = card.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = x - cx, dy = y - cy;
    if (!reduce) {
      const len = Math.hypot(cx - x, cy - y), ang = Math.atan2(cy - y, cx - x) * 180 / Math.PI;
      beam.style.left = x + 'px'; beam.style.top = y + 'px'; beam.style.width = len + 'px'; beam.style.transform = `rotate(${ang}deg)`;
      beam.animate([{ opacity: 0, transform: `rotate(${ang}deg) scaleX(.1)` }, { opacity: 1, transform: `rotate(${ang}deg) scaleX(1)`, offset: .35 }, { opacity: 0, transform: `rotate(${ang}deg) scaleX(1)` }], { duration: 1100, easing: 'ease-out' }).onfinish = () => beam.remove();
      card.animate([
        { transform: `translate(${dx}px,${dy}px) scale(.04) rotateX(80deg)`, opacity: 0, clipPath: 'inset(47% 6% 47% 6%)', filter: 'brightness(3) blur(3px)' },
        { transform: `translate(${dx * .4}px,${dy * .4}px) scale(.45) rotateX(30deg)`, opacity: 1, clipPath: 'inset(46% 0 46% 0)', filter: 'brightness(2.2) blur(1px)', offset: .42 },
        { transform: 'translate(0,0) scale(1.035) rotateX(0)', opacity: 1, clipPath: 'inset(0 0 0 0)', filter: 'brightness(1.5)', offset: .78 },
        { transform: 'none', opacity: 1, clipPath: 'inset(0 0 0 0)', filter: 'brightness(1)' }
      ], { duration: 1050, easing: 'cubic-bezier(.2,.8,.25,1)' });
    } else beam.remove();
    close.addEventListener('click', () => closeCard());
    veil.addEventListener('click', () => closeCard());
    card.focus({ preventScroll: true });
    return card;
  }
  function closeCard(instant) {
    if (!card) return;
    const c = card, v = veil, cb = cardCloseCb; card = veil = cardCloseCb = null;
    v.classList.remove('show');
    const done = () => { c.remove(); v.remove(); cb && cb(); };
    if (instant || reduce) return done();
    const r = c.getBoundingClientRect(), dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    c.animate([{ transform: 'none', opacity: 1, clipPath: 'inset(0 0 0 0)' },
      { transform: `translate(${dx * .5}px,${dy * .5}px) scale(.4) rotateX(40deg)`, opacity: .9, clipPath: 'inset(45% 0 45% 0)', offset: .6 },
      { transform: `translate(${dx}px,${dy}px) scale(.03) rotateX(80deg)`, opacity: 0, clipPath: 'inset(48% 8% 48% 8%)' }], { duration: 480, easing: 'ease-in' }).onfinish = done;
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && card) closeCard(); });

  /* ---------- content for the briefs (all from data.js) ---------- */
  const uniq = a => [...new Set(a)];
  const coreSkills = () => uniq((D.skillPages || []).filter(p => !p.glow).flatMap(p => p.groups.flatMap(g => g.items)));
  const exploring = () => uniq((D.skillPages || []).filter(p => p.glow).flatMap(p => p.groups.flatMap(g => g.items)));
  const chips = a => el('div', { class: 'aChips' }, a.map(t => el('span', null, t)));
  const row = (k, v) => el('div', { class: 'aRow' }, el('b', null, k), el('div', null, v));
  const btnA = (label, href, solid, ext = true) => { const a = el('a', { class: 'aBtn' + (solid ? ' solid' : ''), href }, label); if (ext) { a.target = '_blank'; a.rel = 'noopener'; } return a; };
  const btnB = (label, fn, solid, sm) => { const b = el('button', { type: 'button', class: 'aBtn' + (solid ? ' solid' : '') + (sm ? ' sm' : '') }, label); b.addEventListener('click', fn); return b; };

  const smooth = id => { const n = $(id); n && n.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  function openProject(i) {
    closeCard(true); smooth('capsules');
    setTimeout(() => window.openProjectByIndex && window.openProjectByIndex(i), reduce ? 100 : 900);
  }
  const openChat = () => { hush(); window.openAssistant && window.openAssistant(); };

  function recruiterBrief() {
    const p0 = P[0];
    const acts = el('div', { class: 'aActs' },
      C.resume ? btnA('Resume (PDF)', abs(C.resume), true) : null,
      C.email ? btnA('Email', 'mailto:' + C.email, false, false) : null,
      C.linkedin ? btnA('LinkedIn', C.linkedin) : null,
      C.github ? btnA('GitHub', C.github) : null,
      btnB('More \u25B8', () => closeCard()));
    return ejectCard({
      kicker: 'RECRUITER BRIEF // 30 SECONDS', title: D.name || 'Malaika Fatima', sub: [D.role, D.tagline].filter(Boolean).join(' \u00b7 '),
      body: el('div', null,
        E.degree ? row('Education', `${E.degree}, ${E.school}`) : null,
        E.cgpa ? row('CGPA', `${E.cgpa}${E.label ? ' \u00b7 ' + E.label : ''}`) : null,
        row('Core skills', chips(coreSkills().slice(0, 9))),
        exploring().length ? row('Exploring', chips(exploring().slice(0, 6))) : null,
        p0 ? row('Main project', el('span', null, `${p0.name}: ${p0.subtitle} `, btnB('Open', () => openProject(0), false, true))) : null,
        C.availability ? row('Open to', C.availability) : null),
      actions: acts, onClose: () => menu()
    });
  }
  function clientBrief() {
    const tiles = P.map((p, i) => el('div', { class: 'aTile' }, el('h4', null, p.name), el('p', null, p.short || p.subtitle),
      el('div', { class: 'aActs', style: 'margin:0' }, p.live ? btnA('Live demo', p.live, true) : null, btnB('Case study', () => openProject(i), !p.live, false))));
    return ejectCard({
      kicker: 'CLIENT BRIEF // WHAT I BUILD', title: 'See it working', sub: G.clientLine,
      body: el('div', null, tiles, C.availability ? el('p', { style: 'margin:12px 0 0;color:#8fd6e2' }, C.availability) : null),
      actions: el('div', { class: 'aActs' }, btnB('Start a project', () => { closeCard(true); smooth('contact'); }, true), C.email ? btnA('Email me', 'mailto:' + C.email, false, false) : null, btnB('More \u25B8', () => closeCard())),
      onClose: () => menu()
    });
  }

  /* ---------- shortcuts she offers ---------- */
  const visitor = () => window.__visitor || 'viewer';
  function goSkills() {
    smooth('hub'); window.hubGo && window.hubGo('skills');
    setTimeout(() => { const p = $('hubPanel'); if (p) { flyTo(p, isMobile() ? 'top' : 'left', 7000, 30); say('Core skills and what I am exploring right now. Use the arrows on the card for more.', { hold: 6500 }); } }, reduce ? 50 : 700);
  }
  function goProjects() {
    smooth('capsules');
    setTimeout(() => { const c = document.querySelector('#capTrack .cap'); if (c) { flyTo(c, 'topleft', 7000, 30); say(visitor() === 'client' ? 'Open a capsule for the full story, the tech and the live demo.' : 'Project Sentinel is my main project. Open the first capsule.', { hold: 6500 }); } }, reduce ? 50 : 900);
  }
  function goContact() {
    smooth('contact');
    setTimeout(() => { const c = $('contactPanel'); if (c) { flyTo(c, 'top', 7000, 30); say(visitor() === 'client' ? 'Tell me about your project. The form goes straight to my email.' : 'Email works best. My resume is on the top right of the first screen too.', { hold: 6500 }); } }, reduce ? 50 : 900);
  }
  function menu() {
    const v = visitor(), B = (label, fn, o) => Object.assign({ label, fn }, o);
    const ask = B('Ask me anything', openChat, { solid: true });
    const hush2 = B(quiet ? 'Talk to me' : 'Be quiet', () => {
      quiet = !quiet; store.set('auraQuiet', quiet ? '1' : '0');
      say(quiet ? "Okay, I'll stay quiet. Click me any time to ask something." : "I'm back! I'll point things out as you explore.", { hold: 3200 });
    }, { ghost: true });
    const sets = {
      recruiter: ['Anything else? Ask me a question, or I can show skills, the main project or contact details.', [ask, B('30-sec brief', recruiterBrief), B('Skills', goSkills), B('Main project', () => openProject(0)), B('Contact', goContact), hush2]],
      client: ['Want more? Ask me a question, or I can show the projects again or take you to contact.', [ask, B('Client brief', clientBrief), B('Projects', goProjects), B('Contact', goContact), hush2]],
      viewer: ['Need a hand? Ask me a question, or I can jump you to the projects or to contact.', [ask, B('Projects', goProjects), B('Contact', goContact), hush2]]
    }[v];
    say(sets[0], { buttons: sets[1] });
  }
  window.openGuideMenu = menu;

  /* ---------- the story ---------- */
  const gateEl = () => $('gate');
  function gateSpot() {
    const h = $('gateHolo'); if (!h) return dock();
    const r = h.getBoundingClientRect();
    return keep({ x: r.right - (isMobile() ? 30 : 52), y: r.top + (isMobile() ? -6 : 8) });
  }
  // 1) gate: she says hello, then follows the visitor's hover from card to card
  setTimeout(() => {
    if (!gateEl() || window.__visitor) return;
    enterFrom(-60, 160); fly(gateSpot, Infinity);
    say(`Hi, I'm ${G.name}, Malaika's guide. Who's visiting today?`, { hold: 5200 });
  }, 1700);
  document.addEventListener('gate:hint', e => {
    if (window.__visitor || !visible) return;
    flyTo(e.detail.el, 'top', 4200, 36);
    say(e.detail.text, { hold: 4200 });
  });

  // 2) a choice was made
  document.addEventListener('visitor:pick', e => {
    const v = e.detail;
    if (!visible) enterFrom(-60, 160);
    if (v === 'viewer') {
      say("Viewer! Sit back and enjoy the full show. I'll meet you inside.", { hold: 3000 });
      fly(() => ({ x: innerWidth / 2, y: -80 }), Infinity);
      setTimeout(() => { setVisible(false); }, 2600);
    } else {
      fly(() => ({ x: innerWidth - (isMobile() ? 40 : 90), y: innerHeight * .55 }), 3000);
      say(v === 'recruiter' ? 'Recruiter mode. Skipping the cinematic, your brief is loading.' : 'Client mode. Straight to the work, one second.', { hold: 2600 });
    }
  });

  // 3) the portfolio is open
  document.addEventListener('hub:open', async e => {
    const v = e.detail.visitor;
    if (v === 'viewer') {
      await wait(1500);
      enterFrom(innerWidth + 50, innerHeight + 30);
      const nb = $('hubNext');
      fly(() => (nb && !isMobile() ? anchor(nb, 'bottom', 38) : dock()), 9000);
      if (!quiet) say(`Welcome to the lab! Press NEXT to flip through the profile cards. Click me any time to ask a question.`, { hold: 7500, below: true });
      return;
    }
    await wait(1400);
    if (!visible) enterFrom(innerWidth - 60, innerHeight * .55);
    (v === 'recruiter' ? recruiterBrief : clientBrief)();
  });

  // 4) viewer: react to the cards, then to each section while scrolling
  let tipDone = false, lastCardTip = false;
  document.addEventListener('hub:page', e => {
    if (visitor() !== 'viewer' || !visible || quiet) return;
    const { index, total } = e.detail;
    if (index > 0 && !tipDone) { tipDone = true; hush(); }
    if (index === total - 1 && !lastCardTip && total > 1) {
      lastCardTip = true; const nb = $('hubNext');
      if (nb) { flyTo(nb, 'bottom', 6000, 38); say("That's my profile. Next stop: the projects!", { hold: 5000, below: true }); }
    }
  });
  const seen = new Set();
  const lines = {
    capsules: { recruiter: 'Start with Project Sentinel, my main project.', client: 'Open any capsule for the full story and the tech.', viewer: 'These are my project capsules. Open one!' },
    contact: { recruiter: 'Email me directly, or grab the resume from the top right of the first screen.', client: 'Tell me about your project. The form goes straight to my email.', viewer: 'You made it to the end! Say hi, I read every message.' }
  };
  function section(id) {
    if (!visible || card || quiet || chatPanel || seen.has(id)) return;
    seen.add(id);
    const v = visitor();
    if (id === 'capsules') { const c = document.querySelector('#capTrack .cap'); if (c) { flyTo(c, 'topleft', 6500, 30); say(lines.capsules[v], { hold: 5200 }); } }
    if (id === 'contact') { const c = $('contactPanel'); if (c) { flyTo(c, 'top', 6500, 30); say(lines.contact[v], { hold: 5200 }); } }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) section(en.target.id); }), { threshold: 0.6 });
    ['capsules', 'contact'].forEach(id => { const n = $(id); n && io.observe(n); });
  }

  // the chat panel: she sits in its header like an avatar, and her eyes scan while she thinks
  let chatPanel = null;
  document.addEventListener('chat:open', e => {
    chatPanel = e.detail.panel; closeCard(true); hush();
    if (!visible) enterFrom(innerWidth - 60, innerHeight - 60);
    fly(() => { const r = chatPanel.getBoundingClientRect(); return { x: r.left + 34, y: r.top + 27 }; }, Infinity);
  });
  document.addEventListener('chat:close', () => { chatPanel = null; target = null; bot.classList.remove('think'); });
  document.addEventListener('chat:think', e => bot.classList.toggle('think', !!e.detail));
  addEventListener('keydown', e => { if (e.key === '?' && visible && !card) menu(); });
})();
