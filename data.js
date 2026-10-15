/* ------------------------------------------------------------------
   PORTFOLIO DATA  –  edit only this file to change the text on the site.
   Leave a value as "" (empty) to hide it.
------------------------------------------------------------------- */
window.PORTFOLIO = {
  name: 'Malaika Fatima',
  role: 'Computer Science Student',
  tagline: 'Aspiring AI & Game Developer',
  intro: 'Technology should connect, not just compute.',

  bubbles: {
    start:      'Access granted. Choose a module.',
    about:      'Identity verified.',
    skills:     'Skill modules loaded.',
    philosophy: 'Core directive loaded.',
    education:  'Academic record loaded.',
    tools:      'Toolkit synced.',
    certs:      'Credentials verified.'
  },

  /* "My Philosophy" tab inside the hologram. */
  philosophy: {
    quote: 'Technology should connect, not just compute.',
    text:  "I don't want to create technology that simply works. I want to create technology that people can experience, understand, enjoy, and remember.",
    note:  'For me, code is not just words and symbols. It is a way to touch hearts.'
  },

  about: [
    "I'm Malaika Fatima, a Computer Science student who has completed six semesters and is passionate about AI, game development, and interactive digital experiences.",
    'My journey started with learning the fundamentals of programming and web development. Through my university studies and self-learning, I have worked with C++, Python, HTML, CSS, JavaScript, and SQL, and I continue to expand my skills by building projects rather than simply learning theory.',
    'I enjoy turning creative ideas into experiences that people can explore, enjoy, and remember. From interactive websites and game-like experiences to concepts involving AI and intelligent systems, every project gives me an opportunity to learn something new.',
    'I believe technology should connect, not just compute. My goal is to keep learning, keep creating, and eventually turn my ideas into meaningful products that people can genuinely connect with.'
  ],

  education: {
    degree: "Bachelor's in Computer Science (BSCS)",
    school: 'Virtual University of Pakistan',
    blurb:  'Currently in 7th semester with a 3.72 / 4.00 CGPA. Building strong foundations in OOP (C++), database systems and web engineering while exploring AI and interactive game mechanics.',
    label:  '7th semester student', done: 6, total: 8, cgpa: '3.72 / 4.00',
    tags:   ['OOP & C++', 'Data Structures', 'Database (SQL)', '3.72 High Merit']
  },

  /* Each entry = one card in the hologram. */
  skillPages: [
    { title: 'Technical Skills', groups: [
      { group: 'Programming', items: ['Python', 'JavaScript (ES6+)', 'C++', 'SQL', 'HTML5', 'CSS3'] },
      { group: 'Web Development', items: ['Responsive Web Design', 'DOM Manipulation', 'REST APIs', 'CSS 3D Transforms'] } ] },
    { title: 'Technical Skills', groups: [
      { group: 'Interactive Development', items: ['HTML5 Canvas (2D)', 'Game Loops', 'Collision Handling', 'Drag & Drop', 'Web Animations'] },
      { group: 'Frameworks & AI Libraries', items: ['CustomTkinter', 'Tkinter', 'psutil', 'pywebview', 'Google Gemini API', 'Multi-Threading (Python)'] } ] },
    { title: 'Currently Exploring', glow: true, groups: [
      { group: 'Active research & experiments', items: ['Artificial Intelligence', 'Machine Learning', 'Game Development', 'Cybersecurity', 'Neural Networks', 'Intelligent Systems'] } ] }
  ],

  tools: [
    { name: 'VS Code',             note: 'Primary code editor & debugger' },
    { name: 'Git & GitHub Desktop',note: 'Version control & project repos' },
    { name: 'Linux (Ubuntu)',      note: 'Terminal & OS lab assignments' },
    { name: 'Cisco Packet Tracer', note: 'Network topology & lab simulations' },
    { name: 'Figma',               note: 'UI exploration & wireframing' }
  ],
  toolsNote: 'Comfortable with Linux commands, Git repository management and structured VS Code workflows.',

  certs: [
    { title: 'CPA: Programming Essentials in C++', org: 'Cisco Networking Academy · Jun 2024', note: 'C++ syntax, object-oriented concepts, logic building, data structures and foundational programming essentials.' },
    { title: 'CCNA: Introduction to Networks (70 hrs)', org: 'Cisco Networking Academy / Virtual University · 2024', note: 'Fundamental networking concepts, IP addressing, packet protocols, network architecture and connectivity.' }
  ],

  /* Project capsules.
     Closed capsule shows: image, name, short, highlights, live/code links.
     Opened capsule shows everything else.
     live / source: leave '' to hide that button (Sentinel is not on GitHub yet). */
  projects: [
    {
      name: 'Project Sentinel',
      eyebrow: 'Desktop security application',
      subtitle: 'Real-Time Threat Monitoring & AI Code Auditing',
      short: 'Real-time threat monitoring with live ECG telemetry and AI code auditing.',
      highlights: ['117 tests passing', '5 live detectors'],
      image: 'images/projects/sentinel.webp',
      status: 'Active development',
      live: '', source: '',
      metrics: [['Tests', '117 Passing'], ['Detectors', '5 Live'], ['Experience', 'Live ECG Telemetry'], ['Design', 'Glassmorphism Cyber UI'], ['Stack', 'Python + HTML/CSS/JS']],
      problem: 'Most desktop security tools hide what they do, or they fake their alerts. Students and everyday users get no clear, real-time view of their machine’s health, and they get no email warning when something suspicious happens.',
      challenge: 'Built a local Python monitoring engine that detects real events, not simulated ones. It checks the firewall state, sustained CPU/RAM overload, suspicious outbound connections, repeated failed logins and internet loss. It serves a modern HTML/CSS/JS interface through a secured local server, so the UI stays separate from the backend logic.',
      architecture: 'A multi-threaded Python backend runs the detectors. It talks over a token-protected local HTTP API (127.0.0.1 only) to a vanilla ES-module front end, which is shown in a native desktop window. Every detected event is logged to disk and emailed as a responsive, severity-based alert. An optional Google Gemini integration adds AI-assisted code auditing on top of an offline pattern-based scanner.',
      modules: ['Real-Time Detection Engine (firewall, CPU/RAM, connections, logins)', 'Live ECG-Style System Health Graph (Canvas)', 'Offline + Gemini AI Code Auditor', 'Network Port Audit with Risk Explanation', 'Secure Auth: Owner Account, Guest Mode, Lockout', 'Email Alerts + OTP Password Recovery'],
      tags: ['Python 3', 'Multi-Threading', 'psutil', 'REST API (stdlib)', 'Vanilla ES Modules', 'HTML5 Canvas', 'CSS Glassmorphism', 'SMTP / Email', 'Google Gemini API', 'PBKDF2-HMAC-SHA256', 'unittest'],
      milestones: [
        'Built detectors that fire on real system events, verified on Windows. Firewall off, 5 failed logins and sustained 90%+ CPU/RAM each trigger a real alert email.',
        'Secured the local API with a per-launch token, Host-header validation, a Content-Security-Policy and path-traversal-safe static serving.',
        'Implemented a 5-attempt login lockout that survives restarts, plus view-only Guest Mode enforced on the server.',
        'Added OTP password recovery with hashed codes, a 10-minute expiry, an attempt limit and rate limiting.',
        'Wrote 117 automated unit tests covering the detectors, auth, recovery and the offline scanner.',
        'Rebuilt the UI from CustomTkinter into a responsive HTML/CSS/JS interface with particles and live telemetry graphs.'
      ],
      snippet: {
        title: 'Sustained-load detector / alert trigger', lang: 'Python',
        code: `# Sentinel: sustained CPU/RAM overload detector (simplified)
def check_load(self, cpu, ram):
    high = cpu >= 90 or ram >= 90
    now = time.time()

    if not high:
        self._high_since = None
        return

    if self._high_since is None:
        self._high_since = now          # start the timer

    if now - self._high_since >= 30 and not self._load_alerted:
        self._load_alerted = True
        culprits = self._top_processes()  # name the heavy processes
        self._emit("high", "LOAD",
                   f"CPU {cpu:.0f}% / RAM {ram:.0f}% for 30s: {culprits}",
                   count_threat=True, email=True)`
      }
    },
    {
      name: 'Jade Lantern',
      eyebrow: 'Interactive web experience',
      subtitle: 'Thai & Chinese Kitchen · Fine Dining',
      short: 'Fine-dining restaurant site with a 3D flip-book menu.',
      highlights: ['3D flip-book menu', 'Fully responsive'],
      image: 'images/projects/jadelantern.webp',
      status: 'Verified production deployment',
      live: 'https://auratech01.github.io/jade-lantern-restaurant/',
      source: 'https://github.com/auratech01/jade-lantern-restaurant',
      metrics: [['Experience', '3D Flip-Book'], ['Design', 'Fine Dining'], ['Layout', 'Fully Responsive'], ['Stack', 'Vanilla JS']],
      problem: 'Standard digital restaurant websites are passive, flat and unengaging, lacking tactile menu interaction and sensory immersion that fine dining guests anticipate.',
      challenge: 'Engineered hardware accelerated 3D CSS perspective transform matrices for smooth multi-page book turns, combined with client-side reactive category filtering.',
      architecture: 'Engineered an interactive fine dining digital presence featuring hardware accelerated 3D flip book page turns, asynchronous culinary category filtering, and responsive reservation mechanics built entirely without bloated heavy frameworks.',
      modules: ['3D CSS Matrix Flip Engine', 'Dynamic Menu State Machine', 'Fine-Dining Responsive UI Core', 'Client-Side Order & Reservation Cache', 'Interactive Editorial Mode'],
      tags: ['HTML5 Canvas', 'CSS 3D Transforms', 'Vanilla ES6+', 'DOM Audio API', 'LocalStorage Cache', 'Semantic Web'],
      milestones: [
        'Designed and calculated smooth 3D CSS perspective transform matrices for realistic physical book page turning.',
        'Implemented efficient DOM manipulation so the page turns and menu interactions feel smooth on desktop displays.',
        'Built client-side category filtering that updates the menu instantly, with smooth layout reflows.',
        'Kept the site lightweight with no heavy frameworks, and paid attention to crisp typography rendering.'
      ],
      snippet: {
        title: '3D flip-book engine / page-turn controller', lang: 'JavaScript',
        code: `// Jade Lantern 3D Book Turn State Controller
function flipBookPage(pageIndex, direction) {
  const pageElement = document.querySelector(\`#page-\${pageIndex}\`);
  if (!pageElement) return;

  const angle = direction === 'forward' ? -180 : 0;
  pageElement.style.transform = \`rotateY(\${angle}deg)\`;
  pageElement.style.zIndex = direction === 'forward' ? 100 - pageIndex : pageIndex;

  // Audio feedback trigger for physical tactile feel
  playBookTurnAudioEffect();
}`
      }
    },
    {
      name: 'Birthday Experience',
      eyebrow: 'Interactive escape-room game',
      subtitle: "The Dream Weaver's Labyrinth · Desktop only",
      short: 'A 22-level escape-room game built on HTML5 Canvas.',
      highlights: ['22 levels', 'Desktop only'],
      image: 'images/projects/birthday.webp',
      status: 'Verified production deployment',
      live: 'https://auratech01.github.io/birthday-experience/',
      source: 'https://github.com/auratech01/birthday-experience',
      metrics: [['Platform', 'Desktop only'], ['Levels', '22 Unlockable'], ['Engine', 'HTML5 Canvas'], ['Mechanics', 'Drag & Drop Puzzles']],
      problem: 'Traditional digital greeting cards are ephemeral and passive, failing to evoke deep emotional resonance or gamified interactive curiosity.',
      challenge: 'Architected a custom HTML5 Canvas particle explosion physics engine and a sequential 22-level state machine with drag-and-drop puzzle hitboxes and zero external game engines.',
      architecture: 'Conceived and engineered a multi-layered narrative escape labyrinth featuring 22 sequential unlockable stages, real-time 2D Canvas physics confetti bursts, drag-and-drop mechanics, and special ambient state management.',
      modules: ['22-Level Progress Engine', 'HTML5 Canvas Particle Burst System', 'Custom Drag and Drop Puzzle Rig', 'Ambient Spatial Audio Manager', 'Interactive Cinema & Memory Vault'],
      tags: ['HTML5 Canvas', 'RequestAnimationFrame', 'Custom Game Loop', 'Web Audio API', 'Drag & Drop API', 'State Persistence'],
      milestones: [
        'Built a Canvas particle engine with mathematical velocity decay, gravity, and alpha fade-outs.',
        'Programmed a sequential level unlocking system using localized progression state trees.',
        'Engineered tactile puzzle interactions with drag-and-drop hitboxes and precision collision thresholds.',
        'Architected an immersive digital escape room experience with zero external game engine dependencies.'
      ],
      snippet: {
        title: 'Canvas particle system & velocity physics', lang: 'JavaScript',
        code: `// Canvas 2D Particle Explosion & Physics Decay Loop
class MemoryConfetti {
  constructor(x, y, palette) {
    this.x = x;
    this.y = y;
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = (Math.random() - 0.8) * 14;
    this.gravity = 0.35;
    this.alpha = 1.0;
  }
  tick(ctx) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha = Math.max(0, this.alpha - 0.018);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fillRect(this.x, this.y, 4, 7);
  }
}`
      }
    }
  ],

  contact: {
    email:    'auratech1101@gmail.com',
    github:   'https://github.com/auratech01',
    linkedin: 'https://linkedin.com/in/auratech01',
    whatsapp: '+92 322 6898750',
    location: 'Pakistan (Virtual University)',
    availability: 'Available for internships, junior roles & collaborations',
    resume:   'Malaika_Fatima_Resume.pdf',   // your CV file (keep it in the same folder as index.html)
    /* Form: messages are sent to your email through FormSubmit (free, no sign-up).
       The very first message makes FormSubmit email you ONE activation link - click it once.
       Set '' to make the form open the visitor's email app instead. */
    formEndpoint: 'https://formsubmit.co/ajax/auratech1101@gmail.com'
  }
};
