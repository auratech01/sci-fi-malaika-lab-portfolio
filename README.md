# Sci-Fi Malaika Lab — Portfolio

A cinematic, sci-fi portfolio of **Malaika Fatima**, a Computer Science student focused on AI.

Visitors "enter the lab" through a short interactive story, meet a robot guide, and then explore About, Education, Skills, Dev Tools, Credentials, Philosophy, Projects and Contact.

Built with plain **HTML, CSS and JavaScript**. No frameworks, no build step.

## The experience

1. **Door** — click the glowing OPEN panel and the camera moves through the doorway.
2. **Lab** — the light switches on and the lab video plays.
3. **Capsule** — click the capsule's small screen to open it.
4. **Welcome** — "WELCOME TO MY PORTFOLIO" is drawn by circuit lines.
5. **Meet the robot** — close-up intro with an "Enter the lab" button and an eye-beam transition.
6. **Hologram cards** — About, Education, Technical Skills, Dev Tools, Credentials and My Philosophy, one card at a time (Next / Prev, dots, swipe).
7. **Project capsules** — three projects, each opens into a detailed window.
8. **Contact** — email, WhatsApp, LinkedIn, GitHub, resume (download / print) and a message form.

## How visitors experience it

A hologram screen asks **who is visiting**. (Links can skip the question: `?as=recruiter`, `?as=client`, `?as=viewer`.)

- **Recruiter:** no videos. The portfolio opens right away with the hiring-relevant cards first (education, skills, credentials). AURA, the tiny guide robot, pulls out a 30-second brief card: education, CGPA, skills, main project, availability, resume and contact buttons.
- **Client:** no videos. The portfolio opens and AURA pulls out a client brief with the projects, live demos, case studies and a "Start a project" button.
- **Viewer:** the full cinematic experience, start to end, with no buttons to press: the door opens by itself, the switch flips, the capsule opens, the circuit title is written, then "Hi, I'm Malaika" and "Enter the lab".

If the browser blocks sound without a click, the videos play muted and the sound switches on at the visitor's first tap or key press.

**AURA** (mini robot): follows the mouse at a distance, flies to what she talks about, comments when the visitor reaches the projects and contact sections, and offers shortcuts (skills, main project, contact, ask the assistant). Press `?` to open her menu; "Hide guide" hides her for the session. Her name and the client line are in `data.js` -> `guide`.

There is no separate chat robot: **click AURA** (or press `?` and choose *Ask me anything*) and a chat panel opens with AURA sitting in its header.

## Ask AURA (the chat)

- **Built-in (default, no setup):** `brain.js` scores every question against weighted keywords and phrases (English + a few Roman Urdu words), tolerates typos, looks up exact skills and tools ("does she know Python?"), remembers the last project ("and its tech stack?") and says *"I'm not sure"* with suggestions instead of guessing. It only uses facts from `data.js`, so it never invents anything. It is not an AI model.
- **Real AI answers (Gemini), without putting the key on GitHub:** GitHub Pages is public, so any key placed in the website files or the repo can be read by anyone. Instead the key lives only inside a free Cloudflare Worker (`chatbot-worker.js`), and the website only contains the Worker's URL (`data.js` -> `chat.endpoint`). Setup steps are at the top of `chatbot-worker.js` (about 10 minutes). If a key was ever committed, delete it in Google AI Studio and create a new one.
- **Hybrid mode (default, `chat.mode: 'hybrid'`):** the built-in brain answers every question it is sure about from the verified facts (no cost, no chance of invention). Only questions it is unsure about go to the AI. Use `mode: 'ai'` to send everything to the AI.
- **How the AI is kept honest:** it sees only a numbered list of facts generated from `data.js`; it must return `{answer, grounded, facts}`; if it says it is not grounded, cites a fact that does not exist, or writes a number, link or email that is not in the facts it cited, the visitor gets "I don't have that information, so I won't guess. You can email her" instead. Temperature 0.1, 3 short sentences, portfolio topics only. These guards remove most invented answers but cannot make any AI 100% perfect, which is why hybrid mode is the default and AI answers carry an "AI answer, checked against the portfolio facts" label.
- **Language:** AURA answers in the visitor's language (English, Roman Urdu, Urdu script). Roman Urdu / Urdu questions go to the AI so the reply sounds natural; skills, names, numbers and links stay exactly as in `data.js`. Without the AI, the built-in brain also answers common Roman Urdu questions.
- **Model names change:** the Worker tries `gemini-3.8-flash`, then `gemini-flash-latest` and `gemini-flash-lite-latest` (also when Google says "high demand", after one short retry), and several "thinking" settings, and remembers what worked. The `?test=1` page shows which model is in use.
- **Check your setup:** open your Worker URL (status) and Worker URL + `?test=1` (checks the key and model). See `SETUP-AI-CHAT.md`.
- **Limits that protect your quota:** only your site's origin is accepted; messages are cut to 500 characters; 6 questions per minute and 40 per day per visitor; 250 AI answers per day in total; 15 AI answers per visit. Add a KV namespace (step 5 in the Worker file) so these limits are reliable.
- **When you edit `data.js`:** run `node tools/make-worker.js` (rebuilds the facts inside `chatbot-worker.js`) and paste the new file into Cloudflare.
- **Tests:** `node tests/brain_test.js` (142 questions incl. Roman Urdu) and `node tests/worker_test.mjs` (34 safety checks with a pretend Gemini).

## Speed

Intro videos exist twice: `.webm` (VP9, about 27% smaller, used by Chrome, Edge, Firefox, Android) and the original `.mp4` (Safari, iPhone, and automatic fallback). The door video (about 330 KB) starts downloading right after the gate appears.

## Run it locally

Opening `index.html` directly works in most browsers. For the smoothest video loading, use a tiny local server:

```bash
# in this folder
python -m http.server 8000
# then open http://localhost:8000
```

## Edit the content

Almost all text lives in one file: **`data.js`**.

| What | Where in `data.js` |
| --- | --- |
| Name, role, tagline, intro line | top of the file |
| About text | `about` |
| Education | `education` |
| Skills cards | `skillPages` |
| Dev tools / certificates | `tools`, `certs` |
| My Philosophy | `philosophy` |
| Projects (text, links, images) | `projects` |
| Email, WhatsApp, LinkedIn, GitHub, resume, form | `contact` |

To show the **Live** or **Code** button on a project, fill its `live` or `source` link. Leave it empty (`''`) and the button is hidden.

Project pictures go in `images/projects/`. The resume PDF stays next to `index.html`.

### Contact form

Messages are sent through [FormSubmit](https://formsubmit.co) to the email in `contact.formEndpoint`. The first message triggers a one-time activation email, so click the link in it once. If the form cannot send, the visitor's email app opens instead. Set `formEndpoint` to `''` to always use the email app.

## Folder structure

```
index.html        page structure
style.css         door / lab / welcome scenes
hub.css           intro, hologram cards, capsules, contact
script.js         door, lab, capsule, welcome title (the cinematic for Viewers)
hub.js            robot intro, beam transition, hologram cards
site.js           project capsules, project window, contact
gate.js/.css      who-is-visiting hologram gate
guide.js/.css     AURA, the mini guide robot
brain.js          AURA's answer engine
chatbot.js/.css   the chat panel
chatbot-worker.js optional Cloudflare Worker (Gemini) for the chat, generated by tools/make-worker.js
tools/            make-worker.js + chatbot-worker.template.js
tests/            brain and Worker tests
wrangler.toml     optional command-line deploy of the Worker
data.js           all the text and links
images/           robot, corridor and project images
videos/           door, lab and capsule videos (mobile + desktop)
Malaika_Fatima_Resume.pdf
```

## Publish with GitHub Pages

1. Push this folder to a **public** GitHub repository.
2. Repository → **Settings** → **Pages**.
3. Source: **Deploy from a branch**, branch **main**, folder **/ (root)** → Save.
4. After a minute the site is live at `https://<username>.github.io/<repository-name>/`.

## Contact

- Email: auratech1101@gmail.com
- GitHub: [auratech01](https://github.com/auratech01)
- LinkedIn: [auratech01](https://linkedin.com/in/auratech01)

© Malaika Fatima
