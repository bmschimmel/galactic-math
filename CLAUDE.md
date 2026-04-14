# Galactic Math — Claude Code Instructions

## Project Overview

A space-themed math trainer for elementary school kids (K-6) covering all four operations.
The main app lives in `index.html`. Auxiliary pages (e.g. feedback form) live under `pages/`. No build system, no dependencies, no frameworks.

## Audience

- **Primary users:** Kids ages 5–12
- **Secondary users:** Parents and teachers sharing/assigning it
- Keep UI language simple, fun, and encouraging. Avoid anything that feels punishing or frustrating.

## Tech Constraints

- **One file for the app:** The game itself stays in `index.html` — HTML, CSS, and JS together. Auxiliary pages (feedback form, etc.) go in `pages/` only when an issue explicitly requires it.
- **No external dependencies:** No npm, no frameworks, no CDN libraries except Google Fonts. The game must work offline after first load.
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
- Comet streaks celebration on passing (≥75%) in Standard and Kessel Run modes
- Hyperspace mode: timed challenge tile with difficulty cards (Wicked Easy 5m / Harder 3m / Hyperdrive 1m) and a countdown bar; blue jump animation on completion
- Kessel Run mode: time how fast you finish; wrong answers add a 5s penalty
- Theme cycler: Dark, Dim, Midnight, Deep Blue, Retro — fixed button top-right corner
- Session history panel showing scores and mode labels for all rounds played
- Results screen with rank, score breakdown, and missed problem review
- Retry (same numbers) and New Mission (back to setup) options
- Feedback page at `pages/feedback.html` — linked from footer, pre-fills a GitHub issue on submit

## Passing Threshold

75% (15/20) triggers the celebration. Jedi ranks:

- 100% → Jedi Master 🌟
- 90%+ → Jedi Knight ⚔️
- 75%+ → Padawan 🤓
- 50%+ → Rebel Recruit 🚀
- <50% → Youngling 🌱

## What to Always Do

- Test changes by opening `index.html` directly in a browser — no server needed
- Warn if size of index.html would be too long to affect performance problems
- Preserve all existing sound effects when editing JS
- Mobile-friendly: game should work on a tablet or phone

## Workflow

- See CONTRIBUTING.md for branching, commit message format, PR rules, and Linear state transitions. Linear project ID is IDT. Always create a branch before starting work.
- Never push directly to main. Never merge your own PR.
