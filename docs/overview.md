# Galactic Math Academy — Architecture Overview

Galactic Math Academy is a space-themed math trainer for kids in grades K–6. The entire game is a **single HTML file** (`index.html`) with no build step, no external dependencies (beyond Google Fonts), and no server requirement. It runs entirely in the browser.

---

## File Structure

```
galactic-math/
├── index.html          # The game — HTML, CSS, and JS in one file
├── pages/
│   ├── feedback.html   # User feedback submission form
│   └── workflow.html   # Development workflow explainer
├── worker/
│   ├── feedback-worker.js   # Cloudflare Worker: receives feedback, creates GitHub issues
│   └── wrangler.toml        # Cloudflare deployment config
├── og-image.svg        # Open Graph preview image
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
| `SETUP` | Number grid, presets, operation buttons |
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

1. **Setup** (`screen-setup`) — number selection, operation mode, game mode
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

Cloudflare Pages deploys automatically from the `main` branch. Every merge to `main` triggers a deploy; the live site updates within ~60 seconds at `https://galactic-math.pages.dev/`.

The feedback worker (`worker/feedback-worker.js`) is deployed separately to Cloudflare Workers via `wrangler`.
