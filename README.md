# Sci-Fi Malaika Lab — Portfolio

A cinematic, sci-fi portfolio of **Malaika Fatima**, a Computer Science student aspiring to work in AI and game development.

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

A **Skip** button lets visitors skip the intro one scene at a time.

Separate videos and images are used for phones (files ending in `9`) and desktops (files ending in `16`).

## Projects shown

- **Project Sentinel** — desktop security monitoring and AI code auditing (Python, HTML/CSS/JS).
- **Jade Lantern** — fine-dining restaurant website with a 3D flip-book menu.
- **Birthday Experience** — 22-level escape-room game on HTML5 Canvas (desktop only).

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
script.js         door, lab, capsule, welcome title, skip button
hub.js            robot intro, beam transition, hologram cards
site.js           project capsules, project window, contact
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
