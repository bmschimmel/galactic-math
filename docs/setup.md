# Setup Screen

The setup screen is the first thing a user sees. It lets them choose which numbers to practice, which operations to use, and whether to enable a timed game mode.

---

## Number Selection

A 14-button grid lets users pick any combination of numbers from **0 to 13**. Selected numbers are highlighted with a `.selected` class.

### Presets

Three quick-select buttons make it easy to pick common ranges:

| Button | What it does |
|---|---|
| **Basic (2–12)** | Selects numbers 2 through 12 (default) |
| **All (0–13)** | Selects all 14 numbers |
| **Clear** | Deselects all numbers |

Custom selections (made by toggling individual buttons) clear the active preset highlight.

### Validation

`startQuiz()` requires **at least 3 numbers** selected before it will start. If fewer than 3 are selected, an error message is shown and the quiz does not begin.

---

## Operation Mode

Four toggle buttons let users pick which operations to include in the quiz: **Multiply (×)**, **Divide (÷)**, **Add (+)**, **Subtract (−)**.

- Any combination of operations can be selected.
- An **"All"** button selects all four operations at once.
- At least one operation must be selected to start.

Questions are **evenly distributed** across selected operations. For example, with Multiply and Divide selected, 10 questions will be multiplication and 10 will be division (with any remainder distributed to the first operations).

---

## Game Modes

Two optional timed modes can be enabled from the setup screen. They are mutually exclusive — enabling one automatically disables the other.

### Standard Mode (default)
No timer. Complete all 20 questions at your own pace. A ring shockwave celebration plays if you pass (≥75%).

### Hyperspace Mode
A countdown timer is added to the quiz. You must answer all questions before the timer hits zero.

Three difficulty cards appear when Hyperspace is toggled ON:

| Difficulty | Time limit |
|---|---|
| Wicked Easy | 5 minutes |
| Harder | 3 minutes |
| Hyperdrive | 1 minute |

A blue hyperspace jump animation plays on completion. A failure banner shows if time runs out.

### Kessel Run Mode
A count-up timer runs during the quiz. Wrong answers add a **+5 second penalty**. Final time = elapsed + penalties. A comet streak celebration plays on a passing score.

---

## Begin Training Mission Button

The **Begin Mission** button (`startBtn`) has a launch animation: it fills left-to-right over ~1.1 seconds (mimicking a rocket launch sequence), then flashes at liftoff, and transitions to the quiz screen at 1.3 seconds. A `missionStart` sound effect plays on click.

The button guards against double-clicks with a `.launching` class check.
