# Design Prototypes

Throwaway, self-contained pages under `pages/prototypes/` used to try out a UX idea before it is built into the game. They load nothing from `assets/` so they can be edited freely without touching the app, and they are never linked from the game itself.

---

## Setup flow — `pages/prototypes/setup-flow.html` (IDT-214)

Explores how a kid should get from picking numbers to launching a game now that Alien Invasion sits beside Galactic Math. Today the setup screen ends with "Begin Training Mission" plus a dashed "Try Alien Invasion" link, and the timed challenge modes (Hyperspace, Kessel Run) only apply to Galactic Math.

The page has three fully clickable prototypes and a comparison tab. Each prototype keeps its own copy of the selection state (numbers, operations, game, mode, difficulty), so switching tabs does not reset the others.

| Tab | Order | Idea |
|---|---|---|
| **A · Flight Deck** | Numbers → Ops → Game → Challenge → Launch | One flashcard per step. Single-choice steps (game, challenge) advance on their own after a bounce; a flight-path stepper shows progress; a Mission Briefing card summarises every choice before launch. |
| **B · Mission Board** | Game → Challenge → Numbers → Ops → Launch | Game-first, one page. Finished rows collapse to a summary line, the next row opens, later rows wait dimmed. Numbers and ops are pre-set so the launch bar lights up as soon as a game and challenge are picked. |
| **C · Launch Bay** | Numbers → Ops → Ship (Game + Challenge + Launch) | Closest to today. Two equal "ship" cards; tapping one expands it to hold its own challenge chips and its own launch button. |

The **Compare** tab tabulates order, screens, taps to launch (with defaults and with Hyperspace), phone fit and build cost for all three against the current screen.

### Shared pieces

The prototype reuses the game's design tokens (copied from `assets/css/style.css` `:root`), the Orbitron/Exo 2 pairing, and the same widgets in each flow: number grid with presets, operation toggles (purple for ×/÷, green for +/−), game cards (blue for Galactic Math, green for Alien Invasion), mode tiles with the Hyperspace difficulty sub-grid, and a launch button that reuses the `launchFill` sweep. Bouncy motion comes from one easing token, `--boing: cubic-bezier(0.34, 1.56, 0.64, 1)`, applied to `popIn`, `boing` (squash-and-stretch on tap) and the card slide-in. `prefers-reduced-motion` disables all of it.

The launch step does not navigate. It shows what the real app would receive — `startQuiz()` inputs for Galactic Math, or the `pages/alien-invasion.html?nums=…&ops=…` URL for Alien Invasion — and flags that Alien Invasion does not read a `mode` parameter yet.

### Deep links

The active tab is kept in the URL hash: `#a`, `#b`, `#c`, `#compare`.
