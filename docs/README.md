# Galactic Math Academy — Documentation

This folder contains developer documentation explaining how each part of Galactic Math Academy works.

---

## Contents

| File | What it covers |
|---|---|
| [overview.md](overview.md) | Architecture, file structure, screens, global state, deployment |
| [setup.md](setup.md) | Number selection, operation modes, game mode selection, Begin Mission |
| [quiz-engine.md](quiz-engine.md) | Question generation, answer submission, nav dots, live score |
| [game-modes.md](game-modes.md) | Standard, Hyperspace, and Kessel Run modes; rank system |
| [audio-engine.md](audio-engine.md) | Web Audio API primitives and sound library |
| [visuals.md](visuals.md) | Starfield, ring shockwave, comet celebration, hyperspace jump, CSS animations |
| [ui.md](ui.md) | Theme cycler, session history, keyboard navigation, mobile support |
| [feedback-system.md](feedback-system.md) | Feedback form, Cloudflare Worker, GitHub Issues integration |
| [CHANGELOG.md](CHANGELOG.md) | Full history of changes by Linear issue and PR |

---

## Quick start for developers

```bash
git clone https://github.com/bmschimmel/galactic-math.git
cd galactic-math
open index.html   # macOS
xdg-open index.html   # Linux/WSL
```

No build step. No server. See [overview.md](overview.md) for the full architecture, and [CONTRIBUTING.md](../CONTRIBUTING.md) for the workflow.
