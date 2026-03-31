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
| `hyperspaceTimer` | The `setInterval` handle |
| `hyperspaceTimeRemaining` | Seconds left |
| `hyperspaceHalfwayShown` | Whether the halfway status message has been shown |
| `hyperspaceHandled` | Guards against the success/failure path running twice |

### Timer behavior

- A progress bar (`hyperspaceBarFill`) shrinks from 100% to 0% as time drains
- When time remaining drops below 25%, both the countdown text and bar switch to a `.warning` state (red pulsing)
- At 50% time elapsed, a status message appears: `▸ COORDINATES CHECKED, ALMOST READY`
- If time hits 0: `hyperspaceFailure()` is called — plays a failure sound, shows the fail banner for 2.5s, then shows results
- If all questions are answered in time: `hyperspaceSuccess()` is called — plays the hyperspace jump sound, launches the `launchHyperspace()` animation (~3s), then shows results

### Notes

- The `hyperspaceHandled` flag ensures that if the quiz finishes on the exact tick the timer hits 0, only one outcome fires
- Enabling Hyperspace automatically disables Kessel Run and vice versa

---

## Kessel Run Mode

A count-up timer records how long it takes to complete the quiz. Wrong answers add a **+5 second penalty**. The final score is `elapsed + total penalties`.

### State variables

| Variable | Purpose |
|---|---|
| `kesselRunEnabled` | Whether the mode is toggled on |
| `kesselRunTimer` | The `setInterval` handle |
| `kesselRunElapsed` | Seconds elapsed since quiz start |
| `kesselRunPenalties` | Total penalty seconds accumulated |

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
