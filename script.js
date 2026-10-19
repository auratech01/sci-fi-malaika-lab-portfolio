(() => {
  /* ---------- CONFIG ----------
     Files ending in 9 -> mobile, files ending in 16 -> desktop.
     Button/zoom data are fractions (0–1) of the video frame. */
  const DOOR = {
    mobile:  { src: 'videos/door9.mp4',  poster: 'videos/door9.jpg',  w: 510,  h: 796,
               button: { x: 0.398, y: 0.534, w: 0.086, h: 0.123 },
               zoom:   { x: 0.506, y: 0.59 } },
    desktop: { src: 'videos/door16.mp4', poster: 'videos/door16.jpg', w: 1160, h: 618,
               button: { x: 0.417, y: 0.388, w: 0.059, h: 0.235 },
               zoom:   { x: 0.483, y: 0.485 } }
  };
  // Lab scene: plays after the light switch. `button` = the capsule's small screen on the last frame.
  const LAB = {
    mobile:  { src: 'videos/lab9.mp4',  poster: 'videos/lab9.jpg',  w: 506, h: 832,
               button: { x: 0.741, y: 0.472, w: 0.115, h: 0.117 } },
    desktop: { src: 'videos/lab16.mp4', poster: 'videos/lab16.jpg', w: 996, h: 530,
               button: { x: 0.630, y: 0.406, w: 0.059, h: 0.157 } }
  };
  // Capsule-open video: plays when the capsule button is clicked (9 = mobile, 16 = desktop).
  const GAS = { mobile: 'videos/gas9.mp4', desktop: 'videos/gas16.mp4' };
  // Videos that play (in order) AFTER the capsule-open video. Example:
  // mobile: ['videos/scene3_9.mp4'], desktop: ['videos/scene3_16.mp4']
  const NEXT_VIDEOS = { mobile: [], desktop: [] };

  const ZOOM_SCALE = 7, ZOOM_MS = 2400, ARROW_MS = 3000;   // lighter zoom = smooth even on slow PCs
  const ZOOM_LEAD = 0.9;   // seconds BEFORE the door video ends that the zoom starts (no pause feeling)

  // Recording mode: open the site with ?clean at the end of the link. Hint arrows, Skip button and loader bar stay hidden.
  const CLEAN = /[?&]clean\b/.test(location.search);
  if (CLEAN) document.documentElement.classList.add('clean');
  const $ = id => document.getElementById(id);
  const setScene = n => { document.documentElement.dataset.scene = n; };
  setScene('door');
  const stage = $('stage'), zoomLayer = $('zoomLayer'), door = $('doorVideo'), hot = $('openHotspot'),
        blackout = $('blackout'), lightBtn = $('lightBtn'), lightLbl = $('lightLbl'), lab = $('labVideo'),
        nextVid2 = $('nextVideo2'), capHot = $('capsuleHotspot'), arrow = $('arrowHint'), doorArrow = $('doorArrow'), nextVid = $('nextVideo'), welcome = $('welcome'), circuit = $('circuit');

  /* ---------- PRELOADING (so playback never stutters) ----------
     Videos are downloaded fully in the background as blobs; if that is not possible
     (e.g. file:// in some browsers) the normal video URL is used instead. */
  const blobCache = {};
  function fetchBlob(src, onP) {
    if (!blobCache[src]) {
      blobCache[src] = fetch(src).then(async r => {
        if (!r.ok) throw 0;
        const total = +r.headers.get('content-length') || 0;
        if (!r.body || !onP || !total) return r.blob();
        const rd = r.body.getReader(), parts = []; let got = 0;
        for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onP(got / total); }
        return new Blob(parts, { type: 'video/mp4' });
      }).then(b => URL.createObjectURL(b)).catch(() => src);
    }
    return blobCache[src];
  }
  function waitReady(v, timeout = 10000) {
    return new Promise(res => {
      if (v.readyState >= 3) return res();
      const done = () => { v.removeEventListener('canplaythrough', done); res(); };
      v.addEventListener('canplaythrough', done);
      setTimeout(res, timeout);
    });
  }
  function prepare(video, src, poster) {
    return fetchBlob(src).then(url => {
      if (poster) video.poster = poster;
      video.src = url; video.load();
      return waitReady(video);
    });
  }
  let labReady = null, gasReady = null, warmedMode = null;
  function warmup() {                       // lab -> capsule video -> later videos, in that order
    if (warmedMode === current) return;
    warmedMode = current;
    labReady = prepare(lab, LAB[current].src, LAB[current].poster);
    gasReady = labReady.then(() => prepare(nextVid, GAS[current]));
    gasReady.then(() => NEXT_VIDEOS[current].forEach(fetchBlob));
  }

  let labLive = false, labSkipped = false;
  let doorStarted = false, labStage = 0;   // labStage: 0 none, 1 playing, 2 ended (capsule button live)
  const mode = () => (innerWidth <= 768 || innerHeight > innerWidth) ? 'mobile' : 'desktop';
  let current = mode();

  // object-fit: cover mapping of a video-frame fraction to screen pixels
  function cover(cfg) {
    const W = stage.clientWidth, H = stage.clientHeight;
    const s = Math.max(W / cfg.w, H / cfg.h);
    const ox = (W - cfg.w * s) / 2, oy = (H - cfg.h * s) / 2;
    return { s, px: (fx, fy) => [ox + fx * cfg.w * s, oy + fy * cfg.h * s] };
  }
  function placeBox(el, cfg) {
    const c = cover(cfg), b = cfg.button, [x, y] = c.px(b.x, b.y);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: b.w * cfg.w * c.s + 'px', height: b.h * cfg.h * c.s + 'px' });
  }

  function layout() {
    const d = DOOR[current], c = cover(d);
    placeBox(hot, d);
    const [zx, zy] = c.px(d.zoom.x, d.zoom.y);
    zoomLayer.style.transformOrigin = `${zx}px ${zy}px`;
    if (labStage === 2) { placeBox(capHot, LAB[current]); placeArrow(); }
    if (!doorStarted && !doorArrow.classList.contains('hidden')) placeArrowAt(doorArrow, hot);
  }
  function placeArrowAt(arrowEl, hotEl) {
    const l = hotEl.getBoundingClientRect(), s = stage.getBoundingClientRect();
    arrowEl.style.left = (l.left - s.left - 8) + 'px';
    arrowEl.style.top = (l.top - s.top + l.height / 2) + 'px';
  }
  const placeArrow = () => placeArrowAt(arrow, capHot);
  // Show an arrow for `ms`, then fade it out. Timers are tracked so a skip can cancel them instantly.
  const arrowTimers = new Set();
  function flashArrow(arrowEl, hotEl, ms, scene) {
    if (CLEAN) return null;
    if (scene && document.documentElement.dataset.scene !== scene) return null;   // never show it in a later scene
    arrowEl.classList.remove('hidden');
    placeArrowAt(arrowEl, hotEl);
    requestAnimationFrame(() => arrowEl.classList.add('show'));
    const t = setTimeout(() => { arrowTimers.delete(t); hideArrow(arrowEl); }, ms);
    arrowTimers.add(t);
    return t;
  }
  function hideArrow(arrowEl) {
    arrowEl.classList.remove('show');
    setTimeout(() => arrowEl.classList.add('hidden'), 450);
  }
  // Skip / scene change: both arrows vanish at once and nothing can bring them back
  function clearArrows() {
    arrowTimers.forEach(clearTimeout); arrowTimers.clear();
    clearTimeout(doorArrowTimer);
    [doorArrow, arrow].forEach(a => { a.classList.remove('show'); a.classList.add('hidden'); });
  }

  /* ---------- FIRST-LOAD LOADER ----------
     The door video is downloaded first (progress bar on screen); the door can only be opened once it is
     ready. While the visitor watches the door, the lab + capsule videos and the images load quietly. */
  const loader = $('loader'), ldFill = $('ldFill'), ldPct = $('ldPct');
  let doorIsReady = false, loadTok = 0, introHandled = false;
  function setLoader(p) {
    const v = Math.max(0, Math.min(1, p));
    ldFill.style.transform = `scaleX(${v})`;
    ldPct.textContent = Math.round(v * 100) + '%';
  }
  function finishLoader() {
    if (doorIsReady) return;
    doorIsReady = true;
    setLoader(1);
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 700);
    hot.classList.remove('wait');
    if (!doorStarted && !introHandled) {
      introHandled = true;
      doorArrowTimer = setTimeout(() => { if (!doorStarted) flashArrow(doorArrow, hot, ARROW_MS, 'door'); }, 500);
    }
  }
  function loadDoor() {
    const d = DOOR[current], my = ++loadTok;
    door.poster = d.poster;
    warmedMode = null; labReady = gasReady = null;
    layout();
    if (!doorIsReady) {
      hot.classList.add('wait'); setLoader(0);
    }
    fetchBlob(d.src, p => { if (my === loadTok && !doorIsReady) setLoader(p * 0.92); })
      .then(url => { if (my !== loadTok) return; door.src = url; door.load(); return waitReady(door, 12000); })
      .then(() => {
        if (my !== loadTok) return;
        finishLoader();
        warmup();                                   // lab + capsule videos start downloading now
        setTimeout(() => { const m = mode(); [INTRO_SRC[m], HUB_SRC[m]].forEach(x => { const i = new Image(); i.src = x; }); }, 400);
      });
  }
  const INTRO_SRC = { mobile: 'images/closeup9.webp', desktop: 'images/closeup16.webp' };
  const HUB_SRC = { mobile: 'images/holo9.webp', desktop: 'images/holo16.webp' };

  addEventListener('resize', () => {
    if (!doorStarted) { const m = mode(); if (m !== current) { current = m; loadDoor(); return; } }
    layout();
  });

  /* ---- Scene 1: door ---- */
  let doorArrowTimer = null;

  hot.addEventListener('click', () => {
    if (doorStarted || !doorIsReady) return;
    doorStarted = true;
    clearArrows();
    hot.style.pointerEvents = 'none';
    door.currentTime = 0;
    door.play().catch(() => door.play());
    watchDoorEnd();
  });

  // Zoom starts slightly BEFORE the door video ends, so the camera keeps moving (no pause)
  let zoomed = false;
  function startZoom() {
    if (zoomed) return;
    zoomed = true;
    zoomLayer.style.transition = `transform ${ZOOM_MS}ms cubic-bezier(.4,0,.6,1)`;
    zoomLayer.style.transform = `scale(${ZOOM_SCALE})`;
    setTimeout(() => { if (labStage === 0) blackout.classList.add('on'); }, ZOOM_MS * 0.35);
    setTimeout(() => {
      if (labStage !== 0 || lightBtn.classList.contains('show')) return;
      lightBtn.classList.remove('hidden');
      requestAnimationFrame(() => lightBtn.classList.add('show'));
      setScene('switch');
    }, ZOOM_MS * 0.5);          // switch fades in WHILE the screen goes dark: never an empty black screen
  }
  function watchDoorEnd() {
    const tick = () => {
      if (zoomed) return;
      const d = door.duration;
      if (d && door.currentTime >= d - ZOOM_LEAD) return startZoom();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  door.addEventListener('ended', startZoom);   // safety net

  /* ---- Scene 2: light switch -> lab video ---- */
  lightBtn.addEventListener('click', () => lightOn(false));
  function lightOn(skip) {
    if (lightBtn.classList.contains('on')) return;
    setScene('lab');
    lightBtn.classList.add('on');
    lightBtn.setAttribute('aria-checked', 'true');
    lightLbl.textContent = 'ON';
    warmup();
    lab.classList.remove('hidden');
    labStage = 1;
    const wait = new Promise(r => setTimeout(r, 450));           // let the switch animation finish
    Promise.all([wait, labReady]).then(() => {
      blackout.style.transition = 'opacity .9s ease-out';
      blackout.classList.remove('on');
      lightBtn.classList.remove('show');
      setTimeout(() => lightBtn.classList.add('hidden'), 700);
      labLive = true;
      if (skip || labSkipped) {                  // skipped before it started: show the last frame, no replay
        try { lab.pause(); lab.currentTime = Math.max(0, (lab.duration || 0) - 0.05); } catch (e) {}
        setTimeout(labEnded, 700);               // the capsule button/arrow only appear after the screen has faded in
      } else lab.play().catch(() => lab.play());
    });
  }

  // Lab video stopped -> capsule button goes live right away, arrow shows for 3 s
  lab.addEventListener('ended', () => labEnded());
  function labEnded() {
    if (labStage === 2 || labStage === 3) return;
    labStage = 2; setScene('capsule');
    placeBox(capHot, LAB[current]);
    capHot.classList.remove('hidden');
    flashArrow(arrow, capHot, ARROW_MS, 'capsule');
  }


  /* ---------- FINAL SCENE: circuit lines that form "WELCOME TO MY PORTFOLIO" ----------
     Each letter is a set of circuit-style polylines (straight lines with 45° corners). */
  const GLYPHS = {
    W:{w:4,l:[[[0,0],[0,5],[1,6],[2,5],[2,2]],[[4,0],[4,5],[3,6],[2,5]]]},
    E:{w:4,l:[[[4,0],[0,0],[0,6],[4,6]],[[0,3],[3,3]]]},
    L:{w:4,l:[[[0,0],[0,6],[4,6]]]},
    C:{w:4,l:[[[4,1],[3,0],[1,0],[0,1],[0,5],[1,6],[3,6],[4,5]]]},
    O:{w:4,l:[[[1,0],[3,0],[4,1],[4,5],[3,6],[1,6],[0,5],[0,1],[1,0]]]},
    M:{w:4,l:[[[0,6],[0,0],[2,3],[4,0],[4,6]]]},
    T:{w:4,l:[[[0,0],[4,0]],[[2,0],[2,6]]]},
    Y:{w:4,l:[[[0,0],[2,3],[4,0]],[[2,3],[2,6]]]},
    P:{w:4,l:[[[0,6],[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]]]},
    R:{w:4,l:[[[0,6],[0,0],[3,0],[4,1],[4,2],[3,3],[0,3]],[[3,3],[4,4],[4,6]]]},
    F:{w:4,l:[[[4,0],[0,0],[0,6]],[[0,3],[3,3]]]},
    I:{w:3,l:[[[0,0],[3,0]],[[1.5,0],[1.5,6]],[[0,6],[3,6]]]}
  };
  const WELCOME_LINES = { mobile: ['WELCOME', 'TO MY', 'PORTFOLIO'], desktop: ['WELCOME TO', 'MY PORTFOLIO'] };
  const NS = 'http://www.w3.org/2000/svg';
  let welcomeShown = false, welcomeTimers = [];

  function mk(tag, attrs) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function buildWelcome(animate) {
    welcomeTimers.forEach(clearTimeout); welcomeTimers = [];
    circuit.innerHTML = '';
    welcome.classList.remove('done');
    const W = stage.clientWidth, H = stage.clientHeight;
    circuit.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const lines = WELCOME_LINES[current], GAP = 1.6, SPACE = 3, LH = 9.5, GH = 6;
    const lineW = lines.map(t => [...t].reduce((a, ch) => a + (ch === ' ' ? SPACE : GLYPHS[ch].w + GAP), 0) - GAP);
    const totalH = (lines.length - 1) * LH + GH;
    const unit = Math.min(W * 0.88 / Math.max(...lineW), H * 0.7 / totalH, 30);
    const oy = (H - totalH * unit) / 2, sw = Math.max(2, unit * 0.2);
    const pts = [], letters = [];                       // letters: list of polylines in px
    lines.forEach((t, li) => {
      let x = (W - lineW[li] * unit) / 2;
      for (const ch of t) {
        if (ch === ' ') { x += SPACE * unit; continue; }
        const g = GLYPHS[ch];
        g.l.forEach(pl => letters.push(pl.map(([px, py]) => [x + px * unit, oy + li * LH * unit + py * unit])));
        x += (g.w + GAP) * unit;
      }
    });
    const d = pl => 'M' + pl.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    const rnd = (a, b) => a + Math.random() * (b - a);

    // 1) incoming circuit traces (straight + 45° bend) that run into the start of each stroke
    const traces = letters.map(pl => {
      const P = pl[0], top = P[1] < H / 2, dir = top ? 1 : -1;
      const ax = Math.min(W - 6, Math.max(6, P[0] + rnd(-4, 4) * unit));
      const y2 = P[1] - dir * unit * 1.2, dx = Math.abs(ax - P[0]);
      const y1 = y2 - dir * dx, ay = top ? -20 : H + 20;
      return [[ax, ay], [ax, y1], [P[0], y2], P];
    });
    const all = [];
    traces.forEach(pl => { const e = mk('path', { class: 'trace', d: d(pl), 'stroke-width': Math.max(1, sw * 0.45) }); circuit.appendChild(e); all.push([e, 'trace']); });
    // 2) the letters themselves
    letters.forEach(pl => { const e = mk('path', { class: 'letter', d: d(pl), 'stroke-width': sw }); circuit.appendChild(e); all.push([e, 'letter']); });
    // 3) solder nodes at the ends / corners
    const nodes = [];
    letters.forEach(pl => [pl[0], pl[pl.length - 1]].forEach(p => {
      const n = mk('circle', { class: 'node', cx: p[0], cy: p[1], r: sw * 0.9 }); circuit.appendChild(n); nodes.push(n);
    }));

    if (!animate) { nodes.forEach(n => n.classList.add('on')); welcome.classList.add('done'); return; }

    // Letters are written one after another (left to right); each letter's circuit line
    // arrives at its start point just before the letter starts to draw.
    const START = 0.4, STEP = 0.07, L_DUR = 0.7, T_DUR = 0.7;   // seconds  (total writing time ≈ 3.5 s)
    const nT = traces.length;
    all.forEach(([e, kind], i) => {
      const len = e.getTotalLength();
      e.style.strokeDasharray = len; e.style.strokeDashoffset = len;
    });
    void circuit.getBoundingClientRect();                         // commit the hidden start state
    all.forEach(([e, kind], i) => {
      const k = kind === 'trace' ? i : i - nT;                    // index of the letter stroke
      const letterStart = START + k * STEP;
      const delay = kind === 'trace' ? Math.max(0, letterStart - T_DUR) : letterStart;
      const dur = kind === 'trace' ? T_DUR : L_DUR;
      e.style.transition = `stroke-dashoffset ${dur}s ease-in-out ${delay}s`;
      e.style.strokeDashoffset = 0;
    });
    letters.forEach((pl, k) => {
      const end = (START + k * STEP + L_DUR) * 1000;
      [nodes[k * 2], nodes[k * 2 + 1]].forEach(n => welcomeTimers.push(setTimeout(() => n.classList.add('on'), end - 150)));
    });
    welcomeTimers.push(setTimeout(() => welcome.classList.add('done'), (START + letters.length * STEP + L_DUR) * 1000 + 400));
  }

  function showWelcome() {
    if (welcomeShown) return;
    welcomeShown = true; setScene('welcome'); clearArrows();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    welcome.classList.remove('hidden');          // must be visible BEFORE building, or the browser skips the animation
    void welcome.getBoundingClientRect();
    buildWelcome(!reduce);
    requestAnimationFrame(() => welcome.classList.add('show'));
    // after the title has been written and held for a moment, move on to the close-up intro
    setTimeout(() => window.startIntro && window.startIntro(), reduce ? 2000 : 5600);
  }
  let rsz; addEventListener('resize', () => { if (welcomeShown) { clearTimeout(rsz); rsz = setTimeout(() => buildWelcome(false), 150); } });

  /* ---- Scene 3: capsule opened -> gas video, then NEXT_VIDEOS (two players, no black flash) ---- */
  const slots = [nextVid, nextVid2];
  const endedOnce = v => new Promise(r => v.addEventListener('ended', r, { once: true }));
  async function playList(list) {
    let ready = gasReady || (gasReady = prepare(slots[0], list[0]));
    for (let i = 0; i < list.length; i++) {
      const v = slots[i % 2], o = slots[(i + 1) % 2];
      await ready;
      v.style.zIndex = 6 + i;
      v.classList.remove('hidden');
      v.play().catch(() => {});
      const done = endedOnce(v);
      ready = i + 1 < list.length ? prepare(o, list[i + 1]) : null;   // preload the next one meanwhile
      await done;                                                      // last video stays on its final frame
    }
    showWelcome();                                                     // everything has ended -> circuit title
  }
  capHot.addEventListener('click', () => {
    if (labStage !== 2) return;
    labStage = 3; setScene('gas');
    capHot.classList.add('hidden'); clearArrows();
    playList([GAS[current], ...NEXT_VIDEOS[current]]);
  });

  /* ---------- SKIP: one scene at a time (like skipping cut-scenes in a game) ---------- */
  function skipDoor() {
    doorStarted = true; zoomed = true; introHandled = true; finishLoader();
    clearArrows();
    hot.style.pointerEvents = 'none';
    try { door.pause(); } catch (e) {}
    zoomLayer.style.transition = 'none'; zoomLayer.style.transform = `scale(${ZOOM_SCALE})`;
    blackout.style.transition = 'none'; blackout.classList.add('on');
    warmup();
    lightOn(false);                           // the light switch is skipped together with the door: lab video starts
    setTimeout(() => { blackout.style.transition = ''; }, 60);
  }
  function skipLab() {
    clearArrows();
    if (!labLive) { labSkipped = true; return; }   // the lab video has not started yet: it will jump to its end by itself
    try { lab.pause(); lab.currentTime = Math.max(0, (lab.duration || 0) - 0.05); } catch (e) {}
    labEnded();
  }
  function skipGas() {
    labStage = 3; clearArrows();
    capHot.classList.add('hidden');
    try { nextVid.pause(); nextVid2.pause(); } catch (e) {}
    showWelcome();
  }
  $('skipBtn').addEventListener('click', () => {
    switch (document.documentElement.dataset.scene) {
      case 'door': skipDoor(); break;
      case 'lab': skipLab(); break;
      case 'capsule': case 'gas': skipGas(); break;
      case 'welcome': window.startIntro && window.startIntro(); break;
      case 'intro': $('introBtn').click(); break;
    }
  });

  door.addEventListener('canplaythrough', () => setTimeout(warmup, 300));
  setTimeout(warmup, 2500);
  loadDoor();
})();
