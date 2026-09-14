# Setup Screen — the Flight Deck

The setup screen is the first thing a user sees. It is a deck of five flashcards, one decision per card, ending in a Mission Briefing and a **Begin Mission** button. The design came out of the IDT-214 prototypes (see [prototypes.md](prototypes.md)); this page describes what shipped.

---

## The five steps

| Step | Card | Ready when |
|---|---|---|
| 1 | **Numbers** — "What numbers should we practice?", presets + the 0–13 grid | at least 3 numbers |
| 2 | **Math** — × ÷ + − as big cards, plus "Practice all" | at least 1 operation |
| 3 | **Game** — Galactic Math or Alien Invasion (plus a dashed "More games coming soon" card with a link to the feedback form) | a game is picked |
| 4 | **Options** — per game, see below | always (the normal option is preselected) |
| 5 | **Launch** — Mission Briefing rows + Begin Mission | always |

Steps 1 and 2 arrive with defaults (Basic 2–12, Multiply) so a returning kid can tap Next twice. Steps 3 and 4 are single choices that advance by themselves ~420 ms after the tap, long enough to see the bounce. Hyperspace is the one exception: it stays on the card so a difficulty can be picked, and the difficulty tap advances.

### Why numbers and math come before the game

The training goal (which numbers, which operations) is decided first; the game is how the kid practises it. That keeps a parent's "practise your 7s" at the front, and it means every game receives the same `nums` / `ops` contract — adding a game is adding one card to step 3.

---

## The deck

```text
.setup-card.deck
├── .flight-path      five .fp-node buttons (done ✓ / now / upcoming)
├── .deck-body        the five .flashcard elements; only .active is shown
├── .error-msg        #setupError, for the rare validation message
└── .deck-nav         #backBtn | #nextBtn or #startBtn
```

- **`.deck-body` reserves a minimum height** (400px, 440px on phones) so the nav row sits in the same place on every step. It never clips or scrolls: the card slide-in moves only 14px, inside the card's padding, and the tap bounce on an edge tile spills into that padding.
- **Each flashcard's content fills or centers within that reserve** instead of clumping at the top (IDT-282). `.op-cards` and `.game-cards` stretch their tiles to fill the leftover height with `flex: 1` grid rows; `.mode-list`, the alien `.diff-grid`, and `.briefing` center their rows vertically with `flex: 1; justify-content: center`. The number grid stays square tiles (aspect-ratio driven) and is centered by the flashcard itself. Above 900px wide, `.container`/`.page-wrapper` widen to 860px and a few tile sizes (`.num-btn`, `.op-card`, `.game-card`) scale up, so the deck actually uses extra desktop width instead of floating in a fixed 700px column.
- **The nav row has the same two slots on every step.** Back on the left (disabled on step 1, not hidden), and one primary action on the right: Next, or Begin Mission on the briefing card. `#nextBtn` and `#startBtn` share the slot and swap via the `hidden` attribute.
- **The flight path** shows done steps as green checks and the current step pulsing blue. Done nodes are clickable and jump back; `goToStep()` refuses forward jumps that do not come through Next.
- **Next is always clickable.** When a step is not ready, `nextStep()` puts the reason in `#setupError` ("⚠ Pick at least 3 numbers", "⚠ Pick at least one kind of math", "⚠ Pick a game first") and plays the wrong-answer sound; the message clears as soon as the step becomes ready. There is no running "you picked…" status text on the cards — the Mission Briefing is where the choices are read back.
- The cards have no "Step x of y" header; the flight path is the progress indicator.

State lives in `game.js`: `setupStep`, `selectedNums`, `selectedOps`, `selectedGame`, `gameMode`, `hyperspaceDiff`, `invasionSize`. `refreshSetup()` repaints everything that depends on it (flight path, hints, which options panel shows, briefing rows, nav buttons) and is called after every change.

---

## Number selection (step 1)

A 14-button grid lets users pick any combination of numbers from **0 to 13**. Selected numbers carry `.selected`.

| Preset | What it does |
|---|---|
| **Basic (2–12)** | Selects 2 through 12 (default) |
| **All (0–13)** | Selects all 14 numbers |
| **Clear** | Deselects everything |

Custom selections clear the active preset highlight. Next explains itself if fewer than 3 numbers are selected.

---

## Math (step 2)

Four flashcards — **Multiply (×)**, **Divide (÷)**, **Add (+)**, **Subtract (−)** — purple for × ÷ and green for + −, matching the operation colours used everywhere else. Any combination may be selected; **Practice all** selects them all. Next explains itself if none is on.

Questions are evenly distributed across selected operations (see [quiz-engine.md](quiz-engine.md)).

---

## Game (step 3)

Two equal cards: 🚀 **Galactic Math** (blue) and 👾 **Alien Invasion** (green). Tapping one marks it with a check, dims the other, plays `sounds.modeActivate()`, and advances. Switching game resets step 4 to that game's normal option so a Galactic Math mode never leaks into Alien Invasion.

The dashed "More games coming soon" card is not a game; it carries a **Have an idea for a game? Submit it here** link to `pages/feedback.html?category=feature`, which opens the feedback form with Feature Request already chosen.

---

## Options (step 4)

The card's title and contents depend on the game.

### Galactic Math — "Pick your game mode!"

Three rows, one choice, **Standard preselected**. The row is the control; the selected row shows a check in its right-hand ring. There are no ON/OFF toggles.

| Row | Effect |
|---|---|
| 🧘 **Standard** | No timer. Advances on tap. |
| ⚡ **Hyperspace** | Opens the three difficulty cards below it (`#hyperspaceOptions.open`); the difficulty tap advances. Plays `sounds.hyperspaceActivate()`. |
| ☄️ **Kessel Run** | Count-up timer, +5s per wrong answer. Advances on tap. Plays `sounds.kesselRunActivate()`. |

`setGameMode(mode)` sets `gameMode` and derives `hyperspaceEnabled` / `kesselRunEnabled` from it, so the quiz, results and session history code is unchanged.

The difficulty cards carry Easy / Normal / Hard badges: Wicked Easy 5:00 · Harder 3:00 · Hyperdrive 1:00.

### Alien Invasion — "How bad is the alien invasion?"

Three cards in the same shape as the Hyperspace difficulty cards, one big number each, **Invasion preselected**:

| Card | Badge | Aliens | Sub line |
|---|---|---|---|
| 🛸 Recon | Easy | 5 | Alien ships unarmed |
| 👾 Invasion | Normal | 10 | Aliens fire lasers! |
| 🌀 Chaos | Hard | 25 | Good luck, pilot |

`setInvasion(size)` sets `invasionSize`; the alien count is passed to the game as `aliens=5|10|25`. The count also decides who shoots: 5 (Recon) spawns no shooters, otherwise the first half of aliens are shooters. Comets and fuel don't yet vary by mode — that's IDT-278.

---

## Launch (step 5)

The Mission Briefing lists Numbers, Math, Game and Options as rows; tapping a row jumps back to that step. Below it, in the primary slot, sits **Begin Mission** — blue for Galactic Math, green (`#startBtn.alien`) for Alien Invasion.

`launchMission()` routes to `startQuiz()` or `launchAlienInvasion()`. Both use the same `#startBtn` animation: `.launching` fills the button left-to-right over ~1.1s, `.liftoff` flashes at 1100 ms, and at 1300 ms the quiz screen shows or the browser navigates to `pages/alien-invasion.html?nums=…&ops=…&aliens=…`.

Double-clicks are guarded by `alienLaunchPending` (a flag) and the `.launching` class check in `startQuiz()`. **Never disable a launch button through CSS**: the class survives a back/forward-cache restore and previously left the button permanently unclickable. A `pageshow` listener calls `clearLaunchState()` to reset the flag and strip `.launching` / `.liftoff` so a restored page never shows a stuck mid-launch glow.

---

## Coming back

- **Retry** (results screen) keeps everything and never touches the deck.
- **New Mission**, **Abort Mission** and clicking the title banner call `newMission()`, which shows the setup screen at step 1 with every previous choice kept.
