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

A canvas-based space shooter at `pages/alien-invasion.html`. Selected numbers and operations are passed in via URL params (`nums`, `ops`) by the main setup screen, along with how bad the invasion is: `aliens=5|10|25` sets `N_ALIENS` (Recon / Invasion / Chaos on the setup deck). Any other value, or opening the page on its own, gives the normal 10.

### Objective

Shoot down every alien ship. Flying into one of the 18 **math rings** opens a question; a correct answer earns **2 missiles** (`clearGate()`), a wrong one costs 5% fuel and pushes the ship away so it must re-approach. Rings can be reused, just not the same ring twice in a row. The game ends in victory the moment the last alien is destroyed (`aliensRemaining` hits 0), and in defeat when fuel or lives reach 0.

### Modes

The alien count is the only thing the mode changes. It also decides how many aliens shoot back: none in Recon, otherwise half, rounded up (`N_SHOOTERS = N_ALIENS > 5 ? Math.ceil(N_ALIENS / 2) : 0`). The first `N_SHOOTERS` aliens spawned in `generateObstacles()` get `isShooter: true` and are drawn with a gun barrel aimed at the ship.

| Mode | `aliens=` | Alien ships | Shoot back | Lives | Fuel | Rings | Asteroids / comets |
|---|---|---|---|---|---|---|---|
| 🛸 Recon | 5 | 5 | 0 (0%) | 5 | 100% | 18 | 28 / up to 6 |
| 👾 Invasion | 10 | 10 | 5 (50%) | 5 | 100% | 18 | 28 / up to 6 |
| 🌀 Chaos | 25 | 25 | 13 (52%) | 5 | 100% | 18 | 28 / up to 6 |

Lives, fuel, fuel pickups (6), comets and asteroids do not vary by mode — that is tracked in IDT-278. Player-facing copy deliberately keeps the exact shooter counts a surprise: the setup deck cards say "Alien ships unarmed" / "Aliens fire lasers!" / "Good luck, pilot" rather than stating numbers, and the alien-count cards carry an `ALIENS` unit label so the big number reads as a ship count without spelling out who shoots.

### Alien lasers

`updateAlienLasers()` runs every frame. Each shooter has its own `nextShot` timestamp: the first shot comes 4–9 s after spawn, then every 3–6.5 s. A shooter only fires when the ship is within 900 world px; if the ship is farther away the shot is skipped and the timer resets. Lasers travel at `ALIEN_LASER_SPEED` (5.55 px/frame, view-scaled — see below) straight at where the ship was when fired, fade out after ~5.5 s, and cost one life on contact (`hitByLaser()`), followed by 2 s of invincibility.

### Resources

| Resource | Starting value | Notes |
|---|---|---|
| Fuel | 100% | Drains while thrusting (`THRUST_FUEL_RATE`); wrong answers cost −5%; ⛽ pickups restore +10% |
| Missiles | 0 | +2 per correct ring answer |
| Lives | 5 | Lost by colliding with asteroids, aliens, or comets, or by being hit by an alien laser |

### Hazards

- **Asteroids** — drifting rocks; collision costs a life with screen shake and debris particles
- **Alien ships** — flying into one costs a life; shooting one triggers a multi-layered explosion (boom, noise burst, alien screech, colorful particles)
- **Alien lasers** — fired by shooter aliens (see above); cost a life on contact
- **Comets** — streak across the canvas from random directions with glowing color trails; collision costs a life

### Projectile speeds on small screens

The world draws at a 1:1 world-to-screen pixel mapping, so a phone shows a
much smaller slice of it than a desktop and the same world-px/frame speed
feels several times faster. `viewScale()` (`canvas.width / 1400`, capped at 1)
scales **comets and alien lasers** down on narrow canvases so they stay
dodgeable. The **ship and the player's own missiles are not scaled** — doing
so made both feel sluggish on phones (IDT-299 feedback, IDT-307), so they run
at the same flat `SHIP_SPEED` / `MISSILE_SPEED` everywhere. Alien lasers fire
at `ALIEN_LASER_SPEED` (5.55 px/frame before scaling; IDT-307 raised it 50%
from 3.7 so shooters stay a threat now that the player's missiles are quick
again).

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

A pulsing directional arrow points toward the nearest alien when it is off-screen.

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
