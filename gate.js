/* ------------------------------------------------------------------
   "Who's visiting?" gate: Recruiter / Client / Viewer.
   - Recruiter & Client: no intro videos, the portfolio opens right away and AURA (the mini robot) guides.
   - Viewer: the full cinematic experience, start to end.
   Deep links: ?as=recruiter | ?as=client | ?as=viewer   (and ?skip = recruiter, ?clean = viewer without gate)
------------------------------------------------------------------- */
(() => {
  const gate = document.getElementById('gate');
  if (!gate) return;
  const $ = id => document.getElementById(id);
  const cards = [...gate.querySelectorAll('.gateCard')];
  const ring = $('gateRing'), pct = $('gatePct'), CIRC = 119.4;
  let picked = null, closed = false, lastP = 0;

  function progress(p) {
    lastP = p;
    ring.style.strokeDashoffset = String(CIRC * (1 - p));
    pct.textContent = Math.round(p * 100) + '%';
  }
  function close() {
    if (closed) return;
    closed = true;
    gate.classList.add('done');
    setTimeout(() => gate.remove(), 900);
  }

  function pick(mode) {
    if (picked) return;
    picked = mode;
    window.__visitor = mode;
    document.documentElement.dataset.visitor = mode;
    document.dispatchEvent(new CustomEvent('visitor:pick', { detail: mode }));
    if (mode === 'viewer') {
      gate.classList.add('loading');            // hologram ring while the door video downloads
      progress(lastP);
      window.startViewer();                       // closes the gate itself once the door is ready
    } else {
      window.__stopIntro();                       // no videos for recruiters and clients
      window.skipToSite();                        // portfolio opens right away
      close();
    }
  }

  cards.forEach(c => {
    c.addEventListener('click', () => pick(c.dataset.mode));
    const hint = () => document.dispatchEvent(new CustomEvent('gate:hint', { detail: { el: c, text: c.dataset.hint, mode: c.dataset.mode } }));
    c.addEventListener('pointerenter', hint);
    c.addEventListener('focus', hint);
  });
  // the viewer's door video starts downloading as soon as the visitor shows interest (or has waited a few seconds)
  const warm = () => window.preloadDoor && window.preloadDoor();
  const vc = cards.find(c => c.dataset.mode === 'viewer');
  vc.addEventListener('pointerenter', warm, { once: true });
  vc.addEventListener('focus', warm, { once: true });
  const idle = setTimeout(warm, 1300);          // the door video is small (~330 KB); start it early so Viewers never wait
  cards.forEach(c => c.addEventListener('click', () => clearTimeout(idle)));

  window.Gate = { progress, close, pick };

  // keyboard: first card gets focus once the cards have appeared; R / C / V shortcuts
  setTimeout(() => { if (!picked) cards[0].focus({ preventScroll: true }); }, 1600);
  addEventListener('keydown', e => {
    if (picked || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const m = { r: 'recruiter', c: 'client', v: 'viewer' }[k];
    if (m) pick(m);
  });

  // deep links
  const q = location.search;
  const as = (q.match(/[?&]as=(recruiter|client|viewer)\b/) || [])[1] || (/[?&]skip\b/.test(q) ? 'recruiter' : /[?&]clean\b/.test(q) ? 'viewer' : '');
  if (as) { gate.style.transition = 'none'; setTimeout(() => pick(as), 0); }
})();
