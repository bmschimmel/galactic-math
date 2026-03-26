# Galactic Math — Claude Code Instructions

## Project Overview
A single-file space-themed multiplication trainer for elementary school kids (K-6).
The entire app lives in `index.html`. No build system, no dependencies, no frameworks.

## Audience
- **Primary users:** Kids ages 5–12
- **Secondary users:** Parents and teachers sharing/assigning it
- Keep UI language simple, fun, and encouraging. Avoid anything that feels punishing or frustrating.

## Tech Constraints
- **One file only:** Everything stays in `index.html` — HTML, CSS, and JS together. Do not split into separate files.
- **No external dependencies:** No npm, no frameworks, no CDN libraries except Google Fonts. The game must work offline after first load.
- **No localStorage or cookies:** Don't persist data between sessions.
- **Web Audio API only:** All sound effects are synthesized via Web Audio API. Do not add audio files.
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
  - `--gold` #ffd700 — achievements/rank
  - `--star-white` #e8f4ff — body text
  - `--muted` #6b7fa3 — secondary text
- **Theme:** Space / Star Wars aesthetic. Keep all new UI elements consistent with this — dark backgrounds, glowing borders, Orbitron font for labels.

## Key Features (do not break these)
- Number selector (0–12) with quick-select buttons
- 20 randomized questions per session
- Keyboard-only navigation: Enter to submit, ←→ to move between questions
- Nav dots showing answered/unanswered/current state
- Correct/wrong sound effects on answer submission
- Keypress sounds on number input
- Rocket ship flyby animation + victory fanfare on passing (≥75%)
- Results screen with rank, score breakdown, and missed problem review
- Retry (same numbers) and New Mission (back to setup) options

## Passing Threshold
75% (15/20) triggers the celebration. Jedi ranks:
- 100% → Jedi Master 🌟
- 90%+ → Jedi Knight ⚔️
- 75%+ → Padawan 🤓
- 50%+ → Rebel Recruit 🚀
- <50% → Youngling 🌱

## Possible Future Features (ask before starting)
- Division mode
- Timed challenge mode
- Addition / subtraction modes
- More ships (Millennium Falcon, TIE Fighter)
- Printable results / share score
- Adaptive difficulty (asks more of what you got wrong)

## What to Always Do
- Test changes by opening `index.html` directly in a browser — no server needed
- Keep the file under ~1200 lines if possible or warn if size of index.html would be too long to affect performance problems
- Preserve all existing sound effects when editing JS
- Mobile-friendly: game should work on a tablet or phone