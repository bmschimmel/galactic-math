# Galactic Math — Claude Code Instructions

## Project Overview

A space-themed math trainer for elementary school kids (K-6) covering all four operations.
The main app lives in `index.html`. Auxiliary pages live under `pages/`. No build system, no dependencies, no frameworks.

The one piece of server-side code is the feedback worker in `worker/` (see [Feedback worker](#feedback-worker) below).

## Audience

- **Primary users:** Kids ages 5–12
- **Secondary users:** Parents and teachers sharing/assigning it
- Keep UI language simple, fun, and encouraging. Avoid anything that feels punishing or frustrating.

## Tech Constraints

- **App structure:** The game entry point is `index.html` (HTML only). CSS lives in `assets/css/style.css` and JS lives in `assets/js/game.js`. Do not inline CSS or JS back into `index.html`.
- **Pages under `pages/`:** Each is a self-contained HTML file with its own inline `<style>` and `<script>` — they do not load `style.css` or `game.js`, and the split-file rule above does not apply to them. Add a new page only when an issue explicitly requires it.
  - `pages/alien-invasion.html` — a separate arcade game mode (~3,300 lines), launched from the Game step of the setup deck. It is the only thing that uses a local audio file (`assets/audio/low-fuel.m4a`).
  - `pages/feedback.html` — the feedback form. Linked from the footer.
  - `pages/workflow.html` — "How It Works" explainer of the development workflow. Linked from the footer.
- **Security headers:** `_headers` at the repo root is read by Cloudflare Pages and holds the Content-Security-Policy plus the other security headers. Any new external origin (a font host, an API, a CDN) must be added to the matching CSP directive there or the browser will block it silently. The CSP only applies on the deployed site, not when opening `index.html` locally.
- **No external dependencies:** No npm, no frameworks, no CDN libraries except Google Fonts. The game must work offline after first load.
- **Analytics:** The one third-party script is the Cloudflare Web Analytics beacon in the `<head>` of `index.html` and `pages/alien-invasion.html`. It is deferred, fails silently offline, and touches nothing in the browser. Game launches are counted by swapping the URL to a virtual path (`/classic/kessel/`, `/alien/recon/`, …) via `markPath()` in `game.js`; while one is active, relative URLs resolve against it, so new links or fetches must be resolved up front the way the existing ones are. See `docs/analytics.md`.
- **No localStorage or cookies:** Don't persist data between sessions.
- **Audio:** All sound effects are synthesized via Web Audio API by default. Do not fetch audio from external URLs. However, local audio files (e.g. `.m4a`, `.mp3`, `.wav`, `.ogg`) may be used when a file is explicitly provided in the repo (e.g. under `assets/audio/`). Load them with the Web Audio API (`fetch` + `decodeAudioData`) so playback is consistent with the rest of the audio system.
- **No `<form>` tags:** Use button `onClick` handlers instead.
- **Browser support:** Modern browsers only (Chrome, Firefox, Safari, Edge). No IE.

## Code Style

- Vanilla JavaScript — no TypeScript, no transpiling
- CSS custom properties (variables) for all colors and theming — defined in `:root`
- Comments for major sections using `// ===== SECTION NAME =====`
- Functions should be small and named clearly — this may be read by beginners

## Design System

- **Fonts:** Orbitron (headings/numbers), Exo 2 (body) — both from Google Fonts
- **Colors:** Use existing CSS variables only. Do not introduce new colors without adding them to `:root`
  - `--saber-blue` #00d4ff — primary interactive
  - `--saber-green` #39ff14 — correct/success
  - `--saber-red` #ff2d55 — wrong/error
  - `--saber-purple` #b94fff — multiply/divide operations
  - `--gold` #ffd700 — achievements/rank
  - `--star-white` #e8f4ff — body text
  - `--muted` #6b7fa3 — secondary text
- **Theme:** Space / Star Wars aesthetic. Keep all new UI elements consistent with this — dark backgrounds, glowing borders, Orbitron font for labels.

## Key Features (do not break these)

- Number selector (0–13) with quick-select presets (Basic 2–12, All 0–13, etc.)
- Operation mode selector: Multiply, Divide, Add, Subtract, or All
- 20 randomized questions per session
- Keyboard-only navigation: Enter to submit answer
- Nav dots showing answered/unanswered/current state
- Correct/wrong sound effects on answer submission
- Keypress sounds on number input
- Celebration on passing (≥75%): ring shockwave in Standard and Hyperspace modes, comet streaks in Kessel Run
- Setup deck: five flashcard steps (Numbers → Math → Game → Options → Launch) with a flight-path stepper, fixed-height body, Back/Next in the same slots, and a Mission Briefing before **Begin Mission**
- Hyperspace mode: game-mode row with difficulty cards (Wicked Easy 5m / Harder 3m / Hyperdrive 1m) and a countdown bar; blue jump animation on completion
- Kessel Run mode: time how fast you finish; wrong answers add a 5s penalty
- Theme cycler: Dark, Dim, Midnight, Deep Blue, Retro — fixed button top-right corner
- Session history panel showing scores and mode labels for all rounds played
- Results screen with rank, score breakdown, and missed problem review
- Retry (same numbers) and New Mission (back to setup) options
- Feedback page at `pages/feedback.html` — linked from footer; POSTs to the feedback worker, which files a GitHub issue
- Alien Invasion as an equal game card on the setup deck — opens `pages/alien-invasion.html` with `nums`, `ops` and `aliens` (5 / 10 / 25)

## Passing Threshold

75% (15/20) triggers the celebration. Jedi ranks:

- 100% → Jedi Master 🌟
- 90%+ → Jedi Knight ⚔️
- 75%+ → Padawan 🤓
- 50%+ → Rebel Recruit 🚀
- <50% → Youngling 🌱

## What to Always Do

- Test changes by opening `index.html` directly in a browser — no server needed
- Warn if a single PR grows `assets/js/game.js` or `assets/css/style.css` by more than ~10 KB (they are ~45 KB and ~37 KB today)
- Preserve all existing sound effects when editing JS
- Mobile-friendly: game should work on a tablet or phone

## Feedback worker

`worker/feedback-worker.js` is a Cloudflare Worker. `pages/feedback.html` POSTs JSON (`category`, `message`, `honeypot`) to `https://galactic-math-feedback.bmschimmel.workers.dev`; the worker validates it, rate limits by IP, generates an issue title with Workers AI, and files a GitHub issue in this repo via the REST API. Full detail is in `docs/feedback-system.md`.

- **Deploy:** not part of the Pages deploy. After merging a change to `worker/`, run `npx wrangler deploy` from `worker/`.
- **Secrets:** `GITHUB_TOKEN` is a Worker secret set in the Cloudflare dashboard. It is not in the repo and must never be — `worker/.env` and `.wrangler/` are gitignored.
- **Config:** `worker/wrangler.toml` declares the bindings (Workers AI, rate limiting) and `compatibility_date`.
- **Models:** `TITLE_MODELS` lists the Workers AI models tried in order for title generation. Cloudflare retires models on a rolling basis; when every model fails the worker files a `worker-health` GitHub issue, and the fix is to update the list and redeploy.
- The worker is the one place the "no npm" rule does not apply: `worker/package.json` pins `wrangler` as a dev dependency. `worker/node_modules/` is gitignored.

## Workflow

- See CONTRIBUTING.md for branching, commit message format, PR rules, and Linear state transitions. Linear project ID is IDT. Always create a branch before starting work.
- Never push directly to main. Never merge your own PR.
