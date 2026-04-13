# Galactic Math Academy
Space themed math trainer for elementary school kids

![Galactic Math](https://img.shields.io/badge/grade-K--6-blue?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-green?style=flat-square) ![No dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)

---

## ✨ Features

- **20-question quizzes** — multiplication, division, addition, subtraction, or any combo — randomized every time
- **Pick your numbers** — select any combination of 0–13
- **Keyboard-first navigation** — Enter to submit, no mouse needed
- **Space sound effects** — lightsaber hums, droid beeps, and blaster buzzes (Web Audio API, no files needed)
- **Comet celebration** — passing scores (75%+) trigger streaking comets across the screen
- **Hyperspace mode** — optional timed challenge: complete all 20 before the countdown hits zero (Wicked Easy / Harder / Hyperdrive)
- **Kessel Run mode** — race against the clock; wrong answers add a 5-second penalty
- **Theme cycler** — switch between Dark, Dim, Midnight, Deep Blue, and Retro color themes
- **Session history** — track your scores across all rounds without any persistent storage
- **Live grading** — see your score as you go, full breakdown at the end with missed problems reviewed
- **Rank system** — Youngling → Rebel Recruit → Padawan → Jedi Knight → Jedi Master ⭐
- **Zero dependencies** — one HTML file, works offline, no internet required after first load

----

## 🚀 Play It Now

👉 **[Launch Galactic Math Academy](https://galactic-math.pages.dev/)**

Or download `index.html` and open it in any modern browser.

---

## 🎮 How to Play

1. Select which numbers you want to practice (e.g. just the 6s and 7s, or all 0–13)
2. Select an operation mode (multiply, divide, add, subtract, or a combo)
3. Optionally, select a timed challenge with **Hyperdrive** or **Kessel Run** Modes
4. Hit **Begin Training Mission**
5. Type your answer and press **Enter**
6. Finish all 20 to see your rank and review any missed problems

---

## 🛠 Run Locally

No build step, no server required.

```bash
git clone https://github.com/bmschimmel/galactic-math.git
cd galactic-math
open index.html   # macOS
# or just double-click index.html in your file explorer
```

---

## 📚 How It Works — Developer Docs

| File | What it covers |
|---|---|
| [docs/overview.md](docs/overview.md) | Architecture, file structure, screens, global state, deployment |
| [docs/setup.md](docs/setup.md) | Number selection, operation modes, game mode selection, Begin Mission |
| [docs/quiz-engine.md](docs/quiz-engine.md) | Question generation, answer submission, nav dots, live score |
| [docs/game-modes.md](docs/game-modes.md) | Standard, Hyperspace, and Kessel Run modes; rank system |
| [docs/audio-engine.md](docs/audio-engine.md) | Web Audio API primitives and sound library |
| [docs/visuals.md](docs/visuals.md) | Starfield, ring shockwave, comet celebration, hyperspace jump, CSS animations |
| [docs/ui.md](docs/ui.md) | Theme cycler, session history, keyboard navigation, mobile support |
| [docs/design-ux.md](docs/design-ux.md) | Design concept, color palette, typography, tone, wording, interaction patterns |
| [docs/feedback-system.md](docs/feedback-system.md) | Feedback form, Cloudflare Worker, GitHub Issues integration |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Full history of changes by Linear issue and PR |

---

## 🤝 Contributing

Contributions? Yeah sure...it's a side project to help my kids learn math I don't know? Sure.

[Open an issue or submit a PR.](https://github.com/bmschimmel/galactic-math/issues/new)

---

## 📄 License

MIT — free to use, modify, and share. See [LICENSE](LICENSE).

---

*Built with vanilla HTML, CSS, and JavaScript. No frameworks. No trackers. No nonsense.*
