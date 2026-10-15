/* ------------------------------------------------------------------
   Scene 4: close-up intro (robot eyes)  ->  eye-beam transition  ->  hologram hub
   Text comes from data.js (window.PORTFOLIO).
------------------------------------------------------------------- */
(() => {
  const D = window.PORTFOLIO;
  if (!D) return;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), welcomeEl = $('welcome'), intro = $('intro'), hub = $('hub'), site = $('site'), flash = $('flash');
  const mode = () => (innerWidth <= 768 || innerHeight > innerWidth) ? 'mobile' : 'desktop';
  const setMode = () => { document.documentElement.dataset.mode = mode(); };
  setMode();

  /* Image data. w/h = original pixel size the coordinates were measured on. */
  const INTRO = {
    mobile:  { src: 'images/closeup9.webp',  w: 1152, h: 2048, eyeL: [0.668, 0.459], eyeR: [0.920, 0.451], eyeSize: 150, angle: -6.7 },
    desktop: { src: 'images/closeup16.webp', w: 1024, h: 578,  eyeL: [0.615, 0.372], eyeR: [0.739, 0.360], eyeSize: 70,  angle: -3.8 }
  };
  /* quad = the 4 corners (fractions of the image) of the glass screen: TL, TR, BR, BL */
  const HUB = {
    mobile:  { src: 'images/holo9.webp',  w: 1152, h: 2048, hand: [0.405, 0.51], head: [0.249, 0.43],
               quad: [[0.528, 0.250], [0.945, 0.212], [0.945, 0.607], [0.528, 0.590]], view: { x0: 0.195, span: 0.74, cy: 0.47 } },
    desktop: { src: 'images/holo16.webp', w: 1600, h: 884,  hand: [0.4125, 0.475], head: [0.275, 0.277],
               quad: [[0.497, 0.222], [0.905, 0.196], [0.898, 0.700], [0.512, 0.672]] }
  };

  const cover = (cfg, W, H) => {
    const s = Math.max(W / cfg.w, H / cfg.h);
    const ox = (W - cfg.w * s) / 2, oy = (H - cfg.h * s) / 2;
    return { s, ox, oy, px: (fx, fy) => [ox + fx * cfg.w * s, oy + fy * cfg.h * s] };
  };

  /* ---------- typing helper ---------- */
  const typers = new WeakMap();
  function typeText(el, text, speed = 32, done) {
    const token = {}; typers.set(el, token);
    el.textContent = '';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; done && done(); return; }
    let i = 0;
    (function step() {
      if (typers.get(el) !== token) return;
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, speed); else done && done();
    })();
  }

  /* ================= INTRO ================= */
  const introImg = $('introImg'), eyeL = $('eyeL'), eyeR = $('eyeR'), beam = $('beamBar');
  const nameEl = $('introName'), eyebrow = $('introEyebrow'), roleEl = $('introRole'), lineEl = $('introLine'), enterBtn = $('introBtn');
  let introOn = false, firing = false;

  function layoutIntro() {
    setMode();
    const m = mode(), cfg = INTRO[m], W = stage.clientWidth, H = stage.clientHeight, c = cover(cfg, W, H);
    if (introImg.getAttribute('data-m') !== m) { introImg.src = cfg.src; introImg.setAttribute('data-m', m); }
    const place = (el, f) => {
      const [x, y] = c.px(f[0], f[1]), sz = cfg.eyeSize * c.s;
      Object.assign(el.style, { left: x + 'px', top: y + 'px', width: sz + 'px', height: sz + 'px', marginLeft: -sz / 2 + 'px', marginTop: -sz / 2 + 'px' });
    };
    place(eyeL, cfg.eyeL); place(eyeR, cfg.eyeR);
    const [bx, by] = c.px(cfg.eyeL[0], cfg.eyeL[1]);
    Object.assign(beam.style, { left: bx + 'px', top: by + 'px' });
    beam.dataset.angle = cfg.angle;
    const [fx, fy] = [bx / W * 100, by / H * 100];
    flash.style.setProperty('--fx', fx + '%'); flash.style.setProperty('--fy', fy + '%');
  }

  window.startIntro = function () {
    if (introOn) return;
    introOn = true; document.documentElement.dataset.scene = 'intro';
    layoutIntro();
    intro.classList.remove('hidden');
    void intro.offsetWidth;
    intro.classList.add('show');
    setTimeout(() => { welcomeEl.classList.remove('show'); setTimeout(() => welcomeEl.classList.add('hidden'), 900); }, 900);
    // staged text
    setTimeout(() => eyebrow.classList.add('in'), 900);
    setTimeout(() => {
      nameEl.classList.add('in');
      typeText(nameEl, `Hi, I'm ${D.name}`, 55, () => {
        nameEl.classList.add('done');
        roleEl.textContent = `${D.role} · ${D.tagline}`; roleEl.classList.add('in');
        setTimeout(() => { lineEl.textContent = D.intro; lineEl.classList.add('in'); }, 350);
        setTimeout(() => enterBtn.classList.add('in'), 800);
      });
    }, 1500);
  };

  enterBtn.addEventListener('click', () => {
    if (firing) return;
    firing = true;
    enterBtn.disabled = true;
    const ang = beam.dataset.angle || -4;
    intro.classList.add('firing');
    beam.style.opacity = 1;
    beam.style.width = '230vw';
    beam.style.transform = `translate(-100%,-50%) rotate(${ang}deg) scaleY(1)`;
    setTimeout(() => { beam.style.transform = `translate(-100%,-50%) rotate(${ang}deg) scaleY(260)`; }, 350);
    setTimeout(() => flash.classList.add('go'), 600);
    setTimeout(() => {                                        // swap scenes while the screen is white-cyan
      startHub();
      intro.classList.add('hidden');
      flash.classList.remove('go'); flash.classList.add('out');
      setTimeout(() => flash.classList.remove('out'), 1200);
    }, 1150);
  });

  /* ================= HUB ================= */
  const hubImg = $('hubImg'), hand = $('handGlow'), panel = $('hubPanel'), head = $('hubHead'), body = $('hubBody'), bubble = $('robotBubble');
  const dots = $('hubDots'), prevBtn = $('hubPrev'), nextBtn = $('hubNext');
  let hubOn = false, idx = 0, pages = [], curPg = null;

  /* maps a flat rectangle onto the 4 glass corners (perspective) */
  function homography(src, dst) {
    const A = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [X, Y] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X]);
      A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]);
    }
    const n = 8;
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < n; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((row, i) => row[n] / row[i]);
  }
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function layoutHub() {
    setMode();
    const m = mode(), cfg = HUB[m], W = hub.clientWidth, H = hub.clientHeight;
    if (hubImg.getAttribute('data-m') !== m) { hubImg.src = cfg.src; hubImg.setAttribute('data-m', m); }
    let px, imgBox;
    if (m === 'desktop') {
      const c = cover(cfg, W, H);
      px = c.px; imgBox = { left: c.ox, top: c.oy, width: cfg.w * c.s, height: cfg.h * c.s };
      const [bx, by] = c.px(cfg.head[0], cfg.head[1]);
      Object.assign(bubble.style, { left: bx + 'px', top: by - 16 + 'px', transform: 'translate(-50%,-100%)' });
    } else {
      // phones: robot on the left, the card sits on the hologram glass on the right
      const v = cfg.view, iw = cfg.w, ih = cfg.h;
      const s = Math.max(W / (v.span * iw), H / ih);
      let left = -v.x0 * iw * s, top = H * 0.47 - v.cy * ih * s;
      left = Math.min(0, Math.max(W - iw * s, left)); top = Math.min(0, Math.max(H - ih * s, top));
      px = (fx, fy) => [left + fx * iw * s, top + fy * ih * s];
      imgBox = { left, top, width: iw * s, height: ih * s };
      const [bx, by] = px(cfg.head[0], cfg.head[1]);
      const panelLeft = px(cfg.quad[0][0], 0)[0];
      Object.assign(bubble.style, { left: '10px', top: Math.max(10, by - 22) + 'px', transform: 'translateY(-100%)', maxWidth: Math.max(120, panelLeft - 22) + 'px' });
    }
    // perspective card
    const q = cfg.quad.map(p => px(p[0], p[1]));
    const w = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2, h = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
    const hm = homography([[0, 0], [w, 0], [w, h], [0, h]], q);
    Object.assign(panel.style, { left: '0px', top: '0px', width: w + 'px', height: h + 'px', right: 'auto', bottom: 'auto',
      transform: `matrix3d(${hm[0]},${hm[3]},0,${hm[6]},${hm[1]},${hm[4]},0,${hm[7]},0,0,1,0,${hm[2]},${hm[5]},0,1)` });
    Object.assign(hubImg.style, { left: imgBox.left + 'px', top: imgBox.top + 'px', width: imgBox.width + 'px', height: imgBox.height + 'px' });
    const [hx, hy] = px(cfg.hand[0], cfg.hand[1]);
    Object.assign(hand.style, { left: hx + 'px', top: hy + 'px' });
    fit();
  }

  /* --- tiny DOM helper --- */
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in (attrs || {})) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    kids.flat().forEach(k => { if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); });
    return e;
  }
  const chips = arr => el('div', { class: 'chips' }, arr.map(t => el('span', { class: 'chip' }, t)));
  const svgHeart = () => { const d = document.createElement('div'); d.className = 'heart'; d.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'; return d; };

  /* --- pages: every page = one card (title + content). Nothing here scrolls: the text size adapts to the content. --- */
  function buildPages() {
    const P = [];
    const ab = D.about || [], half = Math.ceil(ab.length / 2);
    P.push({ id: 'about', title: 'About', sub: 'Profile', view: () => ab.slice(0, half).map(t => el('p', null, t)) });
    if (ab.length > half) P.push({ id: 'about', title: 'About', sub: 'Journey', view: () => ab.slice(half).map(t => el('p', null, t)) });
    const E = D.education;
    if (E) P.push({ id: 'education', title: 'Education', sub: 'Academic matrix', view: () => {
      const pct = Math.round(100 * E.done / E.total);
      return [el('div', { class: 'edu' }, el('div', null, el('h4', { class: 'deg' }, E.degree), el('div', { class: 'school' }, E.school), el('p', null, E.blurb), chips(E.tags || [])),
        el('div', { class: 'prog' }, el('div', { class: 'progTop' }, el('span', null, E.label), el('b', null, `${E.done} / ${E.total} semesters`)),
          el('div', { class: 'bar' }, el('i', { style: `width:${pct}%` })),
          el('div', { class: 'progBot' }, el('span', null, `${E.done} semesters cleared (${pct}%)`), el('em', null, `CGPA ${E.cgpa}`))))]; } });
    (D.skillPages || []).forEach(sp => P.push({ id: 'skills', title: sp.title, sub: sp.glow ? 'Active research' : 'Core domains', glow: sp.glow,
      view: () => sp.groups.flatMap(g => [el('div', { class: 'lbl' }, g.group), chips(g.items)]) }));
    if (D.tools) P.push({ id: 'tools', title: 'Dev Tools', sub: 'Workflow & badges', view: () => [
      el('div', { class: 'tools' }, D.tools.map(t => el('div', { class: 'tool' }, el('b', null, t.name), el('span', null, t.note)))),
      D.toolsNote ? el('p', { class: 'toolNote' }, D.toolsNote) : null] });
    if (D.certs) P.push({ id: 'certs', title: 'Credentials', sub: 'Verified Cisco certifications', view: () =>
      [el('div', { class: 'tools certs' }, D.certs.map(c => el('div', { class: 'cert' }, el('div', { class: 'certTop' }, el('b', null, c.title), el('span', { class: 'ver' }, 'Verified')), el('div', { class: 'org' }, c.org), el('p', null, c.note))))] });
    const PH = D.philosophy;
    if (PH && (PH.quote || PH.text)) P.push({ id: 'philosophy', title: 'My Philosophy', sub: 'Core belief system', center: true, view: () => [
      svgHeart(), PH.quote ? el('blockquote', { class: 'quote' }, PH.quote) : null,
      ...String(PH.text || '').split(/\n+/).filter(Boolean).map(t => el('p', { class: 'phText' }, t)),
      PH.note ? el('div', { class: 'note' }, '✦ ' + PH.note) : null] });
    return P;
  }

  /* --- adapt the text size so the card never needs scrolling --- */
  function fit() {
    if (!curPg) return;
    const max = mode() === 'mobile' ? 21 : 26, min = 8.5;
    let lo = min, hi = max;
    const cs = getComputedStyle(body), avail = body.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2;
    body.style.fontSize = hi + 'px';
    if (curPg.offsetHeight <= avail) return;
    while (hi - lo > 0.2) {
      const mid = (lo + hi) / 2; body.style.fontSize = mid + 'px';
      if (curPg.offsetHeight <= avail) lo = mid; else hi = mid;
    }
    body.style.fontSize = lo + 'px';
  }

  function show(i, dir) {
    idx = (i + pages.length) % pages.length;
    const pg = pages[idx];
    head.replaceChildren(el('span', { class: 'pgNo' }, String(idx + 1).padStart(2, '0') + ' / ' + String(pages.length).padStart(2, '0')),
      el('h3', { class: 'pgTitle' }, pg.title), el('span', { class: 'pgSub' }, '// ' + pg.sub), el('i', { class: 'pgRule' }));
    panel.classList.toggle('glow', !!pg.glow);
    curPg = el('div', { class: 'pg' + (pg.center ? ' center' : '') }, pg.view());
    body.replaceChildren(curPg);
    curPg.style.animation = `${dir < 0 ? 'slideL' : 'slideR'} .45s ease both`;
    fit();
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === idx));
    const last = idx === pages.length - 1;
    nextBtn.firstChild.textContent = last ? 'Projects' : 'Next';
    nextBtn.classList.toggle('last', last);
    prevBtn.style.visibility = idx === 0 ? 'hidden' : 'visible';
    typeText(bubble.querySelector('span'), (D.bubbles && (D.bubbles[pg.id] || D.bubbles.start)) || '', 24);
  }
  const goNext = () => { if (idx === pages.length - 1) { const c = $('capsules'); c && c.scrollIntoView({ behavior: 'smooth' }); } else show(idx + 1, 1); };
  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', () => show(idx - 1, -1));
  panel.addEventListener('keydown', e => { if (e.key === 'ArrowRight') goNext(); if (e.key === 'ArrowLeft' && idx > 0) show(idx - 1, -1); });
  // swipe on the card
  let sx = null;
  panel.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) { dx < 0 ? goNext() : (idx > 0 && show(idx - 1, -1)); } });

  function startHub() {
    if (hubOn) return;
    hubOn = true; document.documentElement.dataset.scene = 'hub';
    document.querySelectorAll('video').forEach(v => { try { v.pause(); } catch (e) {} });
    document.documentElement.classList.add('site');
    site.classList.remove('hidden');
    stage.style.display = 'none';
    window.scrollTo(0, 0);
    pages = buildPages();
    dots.replaceChildren(...pages.map((p, k) => { const d = el('button', { type: 'button', 'aria-label': `Card ${k + 1}: ${p.title}` }); d.addEventListener('click', () => show(k, k < idx ? -1 : 1)); return d; }));
    const rl = $('hubResume'); if (rl && D.contact && D.contact.resume) { rl.href = D.contact.resume; rl.classList.remove('hidden'); }
    layoutHub();
    panel.classList.add('holoOn');
    window.initSite && window.initSite();
    setTimeout(() => { show(0, 1); }, 700);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  $('scrollCue').addEventListener('click', () => { const c = $('capsules'); c && c.scrollIntoView({ behavior: 'smooth' }); });

  /* resize + image preloading */
  let rz; addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { setMode(); if (introOn && !hubOn) layoutIntro(); if (hubOn) layoutHub(); }, 120);
  });
  setTimeout(() => { const m = mode(); [INTRO[m].src, HUB[m].src].forEach(s => { const i = new Image(); i.src = s; }); }, 1200);
})();
