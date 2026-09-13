# Game Modes

Galactic Math has three game modes. Standard is always active; Hyperspace and Kessel Run are optional and mutually exclusive.

---

## Standard Mode

The default mode. No timer. The quiz runs at the user's own pace. On a passing score (≥75%), the **ring shockwave celebration** plays.

---

## Hyperspace Mode

A countdown timer is overlaid on the quiz screen. The user must complete all questions before time runs out.

### State variables

| Variable | Purpose |
|---|---|
| `hyperspaceEnabled` | Whether the mode is toggled on |
| `hyperspaceDiff` | Selected difficulty: `'wicked-easy'`, `'harder'`, or `'hyperdrive'` |
| `HYPERSPACE_LIMITS` | Time limits: 300s / 180s / 60s |
| `hyperspaceTimer` | The `setInterval` repaint handle |
| `hyperspaceStartedAt` | `Date.now()` when the round started |
| `hyperspaceTimeRemaining` | Seconds left, derived from the clock on each repaint |
| `hyperspaceLastBeepSecond` | Last second a countdown beep played for (prevents replays) |
| `hyperspaceHalfwayShown` | Whether the halfway status message has been shown |
| `hyperspaceHandled` | Guards against the success/failure path running twice |

### Timer behavior

- Time remaining is computed as `limit - floor((Date.now() - hyperspaceStartedAt) / 1000)` on every repaint, never by counting ticks. The interval runs every `TIMER_REPAINT_MS` (250 ms) purely to refresh the display, so the countdown keeps running accurately when the browser throttles a background tab and catches up as soon as the tab regains focus
- A progress bar (`hyperspaceBarFill`) shrinks from 100% to 0% as time drains
- When time remaining drops below 25%, both the countdown text and bar switch to a `.warning` state (red pulsing)
- At 50% time elapsed, a status message appears: `▸ COORDINATES CHECKED, ALMOST READY`
- In the final 10 seconds a countdown beep plays once per second; `hyperspaceLastBeepSecond` ensures that if several seconds pass in one repaint (e.g. returning to a throttled tab) only one beep plays rather than a burst
- If time hits 0: `hyperspaceFailure()` is called — plays a failure sound, shows the fail banner for 2.5s, then shows results
- If all questions are answered in time: `hyperspaceSuccess()` is called — plays the hyperspace jump sound, launches the `launchHyperspace()` animation (~3s), then shows results

### Notes

- The `hyperspaceHandled` flag ensures that if the quiz finishes on the exact tick the timer hits 0, only one outcome fires
- The final-10-seconds beep (`sounds.hyperspaceCountdownTick`) is guarded by `hyperspaceLastBeepSecond`, so returning from a throttled tab plays at most one beep rather than replaying every skipped second
- Enabling Hyperspace automatically disables Kessel Run and vice versa

---

## Kessel Run Mode

A count-up timer records how long it takes to complete the quiz. Wrong answers add a **+5 second penalty**. The final score is `elapsed + total penalties`.

### State variables

| Variable | Purpose |
|---|---|
| `kesselRunEnabled` | Whether the mode is toggled on |
| `kesselRunTimer` | The `setInterval` repaint handle |
| `kesselRunStartedAt` | `Date.now()` when the run started |
| `kesselRunElapsed` | Seconds elapsed since quiz start, derived from the clock |
| `kesselRunPenalties` | Total penalty seconds accumulated |

### Timer behavior

Elapsed time is `floor((Date.now() - kesselRunStartedAt) / 1000)`, recomputed on every repaint (`TIMER_REPAINT_MS`, 250 ms). Because the value comes from the wall clock rather than a tick count, switching tabs mid-run doesn't freeze the clock — the full time away is counted. `stopKesselTimer()` takes a final reading from the clock so the results screen shows the true elapsed time regardless of when the last repaint fired.

### Timer behavior

The clock is wall-time based, not a tick count: `elapsed = floor((Date.now() - kesselRunStartedAt) / 1000)`. Tabbing away mid-run does not freeze the clock, so a Kessel time always reflects real seconds. `stopKesselTimer()` takes a final reading from the clock so the results screen never depends on whether the last repaint happened to fire.

### Penalty display

Each wrong answer triggers `addKesselPenalty()`:
- Adds 5 to `kesselRunPenalties`
- Updates the penalty counter display (`+Ns`)
- Flashes a penalty indicator (`kesselPenaltyFlash`) for 1.4 seconds

### Results

On quiz completion, the results screen shows:
- Final time (elapsed + penalties) in `M:SS` format
- Breakdown: `Xm elapsed + Ys penalties`

A **comet celebration** plays on a passing score (≥75%).

---

## Alien Invasion Mode

A canvas-based space shooter at `pages/alien-invasion.html`. Selected numbers and operations are passed in via URL params (`nums`, `ops`) by the main setup screen.

### Objective

Pilot a rocket through 20 math gates scattered around the canvas. Answer each gate's question correctly to clear it. All gates must be cleared (in any order) to win.

### Resources

| Resource | Starting value | Notes |
|---|---|---|
| Oxygen | 100% | Drains continuously while thrusting; wrong answers cost −5% |
| Lives | 5 | Lost by colliding with asteroids, UFO saucers, or comets |

### Hazards

- **Asteroids** — drifting rocks; collision causes screen shake and debris particles
- **UFO saucers** — cause a multi-layered explosion on hit (boom, noise burst, alien screech, colorful particles)
- **Comets** — streak across the canvas from random directions with glowing color trails

### Bonus gates

Three rainbow-colored gates require 3 correct answers each. Completing one refuels +10% O₂.

### Audio warning

When oxygen drops to 10%, a "low fuel" voice clip plays followed by rising-pitch tick sounds every second. The warning re-triggers after a refuel pickup.

### Controls

| Input | Action |
|---|---|
| Arrow keys / WASD | Thrust in direction |
| Space | Fire missile |
| Trackpad / mouse click-to-fly | Click once to enter flying mode, then steer by moving the pointer off screen centre; click again to exit |
| Touch D-pad (bottom-left) | Directional thrust on touch devices |
| Touch fire button (bottom-right) | Fire missile on touch devices |

Trackpad driving exists because arrow keys are awkward for younger players.
Flying is a **mode** rather than a held gesture, since holding a click while
dragging asks for more finger coordination than young kids have. One click turns
flying mode on; from then on the trackpad is used normally with nothing held
down. A dashed neutral ring is drawn at screen centre, and a small, dimmed
`✈ FLYING MODE · CLICK TO STOP` pill sits at the bottom centre of the screen
while the mode is active. Flying mode is kept when a gate question opens, so the
pill shares the bottom of the screen with the question overlay: `setFlyMode()`
toggles a `fly-mode` class on `<body>`, and `body.fly-mode #questionOverlay`
raises the question's bottom padding so the problem and answer row sit above the
pill instead of on top of it.
Move the pointer more than 44px from centre and the ship flies that way — and
keeps flying with the finger completely off the pad. Bring the pointer back
inside the ring to stop. Click again, or press any movement key, to leave flying
mode.

Direction comes from the pointer's offset from **screen centre**, not from the
ship's drawn position. The camera lerps toward the ship at `0.12`/frame, so
measuring against the ship would feed its own motion back into the control and
make it oscillate around the pointer; screen centre is a fixed origin, and the
camera keeps the ship there anyway. Offset distance sets direction only — speed
is always the same fixed `SHIP_SPEED`, matching the keyboard and D-pad.

Browsers cannot read a trackpad's surface: there is no absolute finger position,
no lift event, and a finger resting still is indistinguishable from a finger
lifted (both are silence). A mode is what makes continuous flight possible
without any of that. All three pointer inputs (keyboard, D-pad, trackpad) write
into the same `keys[]` map, so `updateShip()` has one movement path regardless
of input.

### Intro explainer

`#introOverlay` appears after the mission is launched and before the countdown.
Alongside the story text it lists how to move, shoot, and pause. Two variants
exist in the markup and `showIntroExplainer()` shows only the one matching the
device: `#introControlsKeys` (arrow keys / WASD, the trackpad click-to-fly
explanation, Space to shoot, P to pause) or `#introControlsTouch` (D-pad, FIRE
button). The touch variant omits pause because there is no on-screen pause
control.

A pulsing directional arrow points toward the nearest uncleaned gate when it is off-screen.

---

## Celebration Threshold

All modes trigger a celebration when the score is **≥75% (15/20 questions correct)**. Hyperspace mode uses its own completion animation instead of a separate celebration.

---

## Jedi Rank System

| Score | Rank | Emoji |
|---|---|---|
| 100% | JEDI MASTER | 🌟 |
| 90–99% | JEDI KNIGHT | ⚔️ |
| 75–89% | PADAWAN | 🔵 |
| 50–74% | REBEL RECRUIT | 🚀 |
| < 50% | YOUNGLING | 🌱 |
