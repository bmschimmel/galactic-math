# Galactic Math — Architecture Overview

Galactic Math is a space-themed math trainer for kids in grades K–6. The entire game is a **single HTML file** (`index.html`) with no build step, no external dependencies (beyond Google Fonts), and no server requirement. It runs entirely in the browser.

---

## File Structure

```
galactic-math/
├── index.html          # The game — HTML, CSS, and JS in one file
├── pages/
│   ├── feedback.html       # User feedback submission form
│   ├── workflow.html       # Development workflow explainer
│   └── release-notes.html  # GitHub releases and recent PRs
├── worker/
│   ├── feedback-worker.js   # Cloudflare Worker: receives feedback, creates GitHub issues
│   └── wrangler.toml        # Cloudflare deployment config
├── _headers            # Cloudflare Pages response headers (CSP and other security headers)
├── _redirects          # Cloudflare Pages redirects: analytics virtual paths back to / (see analytics.md)
├── robots.txt          # Crawler policy: search and AI assistants allowed, AI training disallowed
├── og-image-v2.png     # Open Graph / Twitter Card preview image (1200×630)
├── CLAUDE.md           # Instructions for Claude Code
├── CONTRIBUTING.md     # Contributor and workflow guide
└── docs/               # This documentation folder
```

---

## index.html Structure

The file is organized into major sections, marked with `// ===== SECTION NAME =====` comments in the JS:

| Section | What it does |
|---|---|
| `<style>` | All CSS — design tokens, themes, layout, animations |
| `<body>` HTML | Screens (setup, quiz, results), overlays, and canvases |
| `STARS` | Animated starfield and nebula background (Canvas) |
| `AUDIO ENGINE` | Web Audio API sound synthesis primitives and sound library |
| `SPACESHIP FLYBY` | Canvas element shared by all celebration animations |
| `RING SHOCKWAVE CELEBRATION` | Expanding color rings for Standard mode pass |
| `KESSEL RUN COMET CELEBRATION` | Streaking comets for Kessel Run mode pass |
| `HYPERSPACE JUMP ANIMATION` | Blue streak warp animation for Hyperspace mode completion |
| `APP STATE` | Global state variables |
| `SETUP` | Number grid, presets, operation cards |
| `SETUP DECK` | Flashcard steps, flight path, briefing, nav buttons, `refreshSetup()` |
| `HYPERSPACE MODE` | Toggle, difficulty selection, countdown timer |
| `KESSEL RUN MODE` | Toggle, elapsed timer, penalty system |
| `HELPERS` | `getCorrectAnswer()`, `getQuestionText()` |
| `QUIZ` | Question loading, answer submission, nav dots |
| `RESULTS` | Score calculation, rank, missed problems, session history |
| `THEME CYCLER` | 5-theme cycle via `data-theme` attribute |
| `SESSION HISTORY MODAL` | Modal showing all rounds played this session |

---

## Design Constraints

- **No external JS dependencies** — vanilla JavaScript only
- **No localStorage or cookies** — all state lives in memory; nothing persists between page loads
- **Web Audio API only** — all sounds are synthesized; no audio files
- **No `<form>` tags** — button `onClick` handlers only
- **No build step** — open `index.html` in any browser to run locally
- **Single-file app** — only `index.html` for the game itself; auxiliary pages go in `pages/`

---

## Screens

The app has three screens, toggled with the `showScreen(name)` function by adding/removing the `.active` class:

1. **Setup** (`screen-setup`) — a five-step flashcard deck: numbers, math, game, options, launch (see [setup.md](setup.md))
2. **Quiz** (`screen-quiz`) — active question, nav dots, answer input, live score
3. **Results** (`screen-results`) — rank badge, score breakdown, missed problems, session history

---

## Key Global State (`APP STATE` section)

| Variable | Type | Purpose |
|---|---|---|
| `selectedNums` | `Set<number>` | Which numbers (0–13) are selected for this session |
| `selectedOps` | `Set<string>` | Which operations are active (`multiply`, `divide`, `add`, `subtract`) |
| `questions` | `Array<[number, number]>` | The 20 question pairs for the current session |
| `questionOps` | `Array<string>` | The operation for each question, parallel to `questions` |
| `answers` | `Array<number\|null>` | User's submitted answer for each question (null = unanswered) |
| `currentQ` | `number` | Index of the question currently displayed |
| `score` | `number` | Running correct count, updated on each answer |
| `sessionScores` | `Array<object>` | Scores from all rounds this session (never resets until page reload) |
| `hyperspaceEnabled` | `boolean` | Whether Hyperspace timed mode is active |
| `kesselRunEnabled` | `boolean` | Whether Kessel Run speed mode is active |
| `DEBUG_MODE` | `boolean` | Set by `?debug=1` URL param — runs 1-question sessions |

---

## Deployment

Cloudflare Pages deploys automatically from the `main` branch. Every merge to `main` triggers a deploy; the live site updates within ~60 seconds at `https://galacticmath.app/`.

The feedback worker (`worker/feedback-worker.js`) is deployed separately to Cloudflare Workers via `wrangler`.

### Security headers (`_headers`)

Cloudflare Pages reads `_headers` at the repo root and attaches its headers to every response. The `/*` block sets:

| Header | Value | Why |
|---|---|---|
| `Content-Security-Policy` | see below | Restricts where each kind of resource may load from |
| `X-Content-Type-Options` | `nosniff` | Stops browsers guessing a different MIME type than the one served |
| `X-Frame-Options` | `DENY` | Legacy twin of `frame-ancestors 'none'` for older browsers |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends only the origin, not the full URL, to other sites |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | The app uses none of these; turns them off outright |

The CSP is split into per-resource directives rather than one `default-src`:

| Directive | Allows | Needed by |
|---|---|---|
| `default-src 'self'` | Same-origin only | Fallback for anything not listed (media, workers, frames…) |
| `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com` | Own scripts, inline handlers, the Web Analytics beacon | `game.js`, the inline `onclick=` handlers and the inline scripts in `pages/`, the beacon `<script>` (see `analytics.md`) |
| `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` | Own CSS, inline styles, Google Fonts stylesheet | `style.css`, `style=` attributes, the Orbitron / Exo 2 `<link>` |
| `font-src https://fonts.gstatic.com` | Google Fonts files | Pulled in by the Google Fonts stylesheet |
| `img-src 'self' data:` | Own images and `data:` URIs | Favicons; the sub-pages use inline SVG `data:` favicons |
| `connect-src 'self' https://galactic-math-feedback.bmschimmel.workers.dev https://api.github.com https://cloudflareinsights.com` | `fetch()` / beacon targets | The feedback worker, the `fetch()` of `assets/audio/low-fuel.m4a` in Alien Invasion, the GitHub REST API calls in `pages/release-notes.html`, and the Web Analytics beacon's reports |
| `object-src 'none'` | Nothing | No plugins |
| `base-uri 'self'` | Same-origin `<base>` only | Blocks base-tag hijacking |
| `frame-ancestors 'none'` | No embedding | The game cannot be put in another site's iframe |

`'unsafe-inline'` has to stay in `script-src` while the pages use inline `onclick=` handlers (which `CLAUDE.md` prescribes). Scoping it to `script-src` and `style-src` means images, objects, frames and `<base>` no longer inherit it.

**When adding an external resource** (a new font host, a CDN, an API), add its origin to the matching directive here or the browser will block it silently — check the console for CSP violation reports.

### AI crawlers (`robots.txt` + Cloudflare)

One stance, enforced in two places: search engines and AI search / assistant bots may index and cite the site; AI *training* crawlers may not.

| Layer | Where | What it does |
|---|---|---|
| `robots.txt` (repo root) | Served by Pages | The version-controlled preference. `User-agent: *` carries a [Content Signals](https://contentsignals.org/) line — `search=yes, ai-input=yes, ai-train=no` — and each crawler in Cloudflare's **AI Crawler** category ([bot reference](https://developers.cloudflare.com/ai-crawl-control/reference/bots/)) gets `Disallow: /`. Advisory only: well-behaved bots honour it, nothing forces them to. |
| **Configure AI bot policies** | Cloudflare dashboard → zone → Security → Settings | The enforcement. Should read **Search: Allow**, **Training: Disallow AI Training** (or Block), **Agent: Allow** (or "Block on pages with ads" — the site has no ads, so that is the same thing). Training crawlers get a `403` at the edge before Pages is ever reached. |

Keep the two in agreement: if a bot is moved between the Search / Training / Agent buckets in the dashboard, update `robots.txt` to match, and vice versa.

Leave the dashboard's managed `robots.txt` toggle ("Set your preference to block training in robots.txt") **off**. When it is on, Cloudflare prepends its own block to the file above, which is harmless but duplicates it; `curl https://galacticmath.app/robots.txt` will show `# BEGIN Cloudflare Managed content` if it has been switched on.

To check the edge block is working:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -A 'GPTBot/1.0'   https://galacticmath.app/   # 403
curl -s -o /dev/null -w '%{http_code}\n' -A 'Googlebot/2.1' https://galacticmath.app/   # 200
```

Google Search Console may occasionally report `Syntax not understood` for the `Content-Signal` line; Cloudflare has observed no effect on crawling or ranking from that warning.
