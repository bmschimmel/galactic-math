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

---

## Flight Deck — `pages/prototypes/flight-deck.html` (IDT-214, refined Option A)

Option A on its own, dressed as the real setup screen (title, divider, one card). Three refinements over the exploration page came out of review:

- **Fixed-size deck.** `.deck-body` reserves a minimum height (`--deck-height`, 400px on desktop and 440px on phones) with the flight path above and the nav bar below, so the card never changes height between steps and the buttons never move. The body never clips or scrolls: the slide-in animation moves only 14px so it stays inside the deck's padding, and the tap "boing" on an edge tile spills into that padding instead of being cut off. On phones the game cards switch to a row layout so the game step fits the reserved height. The status line ("11 numbers · 2–12", "Training ×") is pinned to the bottom-left of the body, just above the nav row, on every step.
- **Consistent nav.** Every step has the same two slots: **◂ Back** on the left (disabled on the first card rather than hidden) and one primary action on the right — **Next ▸**, or **Begin Mission** in the game's colour on the briefing card. All nav buttons share `.nav-btn` and the same height.
- **"Begin Mission"**, not "Begin Training Mission", for both games.

**The options step is per game, and arrives with the normal choice already made.** Step 4 is labelled *Options*, not *Challenge*, because it is optional: picking a game preselects its normal option (Standard for Galactic Math, Invasion for Alien Invasion) so Next is live on arrival and the card is a chance to change, not a gate. Rows and cards select on tap — there are no ON/OFF badges; the chosen row shows a check.

Galactic Math asks *Pick your game mode!*: Standard / Hyperspace / Kessel Run, with Hyperspace opening its three difficulty cards. Alien Invasion has no timer to turn off, so it asks *How bad is the alien invasion?* — three cards mirroring the Hyperspace difficulty shape, each with one big number and an Easy / Normal / Hard badge (the Hyperspace cards carry the same badges):

| Card | Badge | Aliens | Sub line |
|---|---|---|---|
| 🛸 Sneak Attack | Easy | 5 | Alien ships unarmed |
| 👾 Invasion (default) | Normal | 10 | Aliens fire lasers! |
| 🌀 Chaos | Hard | 25 | Good luck, pilot |

More aliens means more missiles, which means more gates and more math, so one dial sets difficulty and math volume together. Which game levers move under each card is decided in IDT-278, not here. The launch step shows an `aliens=N` URL param for Alien Invasion, which would replace the fixed `N_ALIENS` constant when this is built.

The game step also carries a dashed "More games coming soon" card to show that step 3 is a list that grows, not a pair of buttons. The launch step shows what the app would receive and offers **↺ New Mission** in the primary slot.
