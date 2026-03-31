# Design System, UX, and Tone

---

## Concept

Galactic Math is designed to feel like a mission briefing screen from a sci-fi film — the kind of terminal a junior Jedi or starship navigator would use. The aesthetic is intentionally cinematic and dramatic for an educational tool, because **the goal is to make a kid feel cool for doing math**.

Every design choice flows from that premise: dark space backgrounds, glowing lightsaber-colored accents, Orbitron monospace headings, and vocabulary borrowed from Star Wars. A wrong answer isn't a failure — it's a missed calculation. A quiz isn't a test — it's a training mission.

---

## Color Palette

All colors are defined as CSS custom properties in `:root` and must be referenced by variable name throughout the code. Never hard-code a hex value in a component style.

| Variable | Hex | Role |
|---|---|---|
| `--space-black` | `#030712` | Page background |
| `--deep-space` | `#0a0f1e` | Card backgrounds |
| `--nebula-blue` | `#1a2744` | Subtle surface tint |
| `--saber-blue` | `#00d4ff` | Primary interactive — borders, inputs, selected states |
| `--saber-green` | `#39ff14` | Correct / success / passing |
| `--saber-red` | `#ff2d55` | Wrong / error / danger |
| `--saber-purple` | `#b94fff` | Multiply and divide operations |
| `--gold` | `#ffd700` | Achievements, rank, preset highlights |
| `--star-white` | `#e8f4ff` | Body text, question numbers |
| `--muted` | `#6b7fa3` | Secondary text, inactive states |

### Color semantics

Colors carry consistent meaning across the whole UI:

- **Blue** = interactive / navigation / in-progress
- **Green** = correct, passing, "on"
- **Red** = wrong, danger, error
- **Purple** = multiplication and division (the harder operations)
- **Gold** = achievement, celebration, presets
- **Muted** = everything not yet interacted with

This color-to-meaning mapping must be preserved when adding new UI. Don't use green for anything other than correct/success. Don't use red for anything that isn't an error or wrong answer.

### Glow variants

Each primary color has a matching glow variable (rgba with ~0.3 alpha) used for `box-shadow` and `filter: drop-shadow`:

```css
--glow-blue:   rgba(0, 212, 255, 0.3)
--glow-green:  rgba(57, 255, 20, 0.3)
--glow-gold:   rgba(255, 215, 0, 0.4)
--glow-purple: rgba(185, 79, 255, 0.3)
```

The glows are what give the UI its "lit from within" feel. Selected buttons, active inputs, and highlighted elements all use glows to create the illusion that the interface is emitting light.

---

## Typography

Two Google Fonts are used. Both are loaded in the `<head>` and are the only external dependency.

### Orbitron — headings, labels, numbers

Used for anything that should feel technical, authoritative, or important. Orbitron is a geometric sans-serif designed to look like it belongs in a sci-fi cockpit display.

Applied to:
- The main title (`GALACTIC MATH`)
- Section labels (`▸ Confirm your training numbers`)
- Question text (`6 × 7 = ?`)
- The answer input
- Buttons (`BEGIN TRAINING MISSION`, `ABORT MISSION`)
- Timer displays, score counters, rank titles
- Nav labels (`PROBLEM 1 OF 20`, `HISTORY`, `◑ DARK`)

### Exo 2 — body, descriptions, footer

Used for anything conversational or supportive. Exo 2 is lighter and more readable at small sizes, making it appropriate for descriptive text that kids and parents read rather than scan.

Applied to:
- Game mode tile descriptions (`Finish before the jump!`)
- Footer text
- Feedback form body copy
- Preset button labels

### Type scale principles

- **Orbitron** is always `letter-spacing: 2px` or more — tight spacing kills its futuristic quality
- **All caps** for Orbitron labels — it's a display font that reads better capitalized
- **`clamp()`** for the question text size so it scales gracefully from phone to desktop without overflow
- Never mix fonts mid-label. If a button uses Orbitron, every word in that button uses Orbitron.

---

## Tone and Wording

### Voice: Mission Control for Kids

The writing voice is that of a calm, encouraging mission control operator speaking to a young trainee. It's serious but never stern. Confident but not condescending.

**What this sounds like:**
- "Confirm your training numbers" — not "Select numbers"
- "Begin Training Mission" — not "Start Quiz"
- "Abort Mission" — not "Quit"
- "Review Missed Problems" — not "Wrong answers"
- "New Mission" — not "Try again with different numbers"

### Encouraging, not punishing

The UI never frames a wrong answer as a failure. The red flash and shake animation are immediate and clear (the kid knows they got it wrong), but the copy never rubs it in. There's no "WRONG!" message — just a `✗` flash and the correct answer shown later in the review.

The rank system also follows this principle. Even the lowest rank ("Youngling") carries no shame — it's a Star Wars title that sounds cool. Every rank implies potential:

| Rank | Framing |
|---|---|
| Youngling 🌱 | You're just starting your training |
| Rebel Recruit 🚀 | You've joined the cause |
| Padawan 🔵 | You're learning from a Jedi |
| Jedi Knight ⚔️ | You've passed the trials |
| Jedi Master 🌟 | You've mastered the Force |

### Brevity

Labels and copy are kept extremely short. Kids don't read instructions — they scan for buttons. Every label should fit comfortably without wrapping, and every message should communicate its point in three words or fewer when possible.

Examples:
- `▸ SESSION HISTORY` (not "Your past rounds this session")
- `↺ RETRY SAME NUMBERS` (not "Try again with the same configuration")
- `How fast can you finish?` (not "Race against the clock to see how quickly you can complete all 20 questions")

### The `▸` arrow prefix

Section labels that introduce a group of controls use `▸` as a prefix. It reads as a terminal prompt — reinforcing the mission control aesthetic and visually anchoring the label to the content below it.

---

## Interaction Design

### Selection states

Every interactive element has three states:

1. **Default** — low opacity border, muted color. Feels passive, waiting.
2. **Hover** — border brightens to the relevant accent color, glow appears. Feels responsive.
3. **Selected/Active** — filled background (low opacity), bright border, full glow. Feels engaged.

Hover styles are scoped to `@media (hover: hover)` so they don't fire on touch devices, where "hover stuck" states after a tap are a known annoyance.

### Glow as selection indicator

Selected states always have a `box-shadow` glow in the relevant color. This is the primary visual affordance for selection — not a checkmark, not a background fill alone. The glow creates a sense of the element being "activated" or "powered on," which fits the aesthetic.

### Feedback immediacy

Answer feedback is immediate and multi-sensory:
- The input border flashes green or red
- A `✓` or `✗` overlay appears centered on the card
- A sound plays (ascending hum for correct, descending buzz for wrong)
- On wrong: the input shakes horizontally

All of this happens within the same animation frame. The feedback loop must be fast — any delay between pressing Enter and seeing a response breaks immersion for kids.

### Disabled states

Inputs and buttons are disabled immediately after submission, not after the animation completes. This prevents double-submission when kids press Enter quickly. Disabled styles use `opacity: 0.4` rather than `display: none` so the layout doesn't shift.

---

## Layout and Visual Hierarchy

### One card, one task

Each screen presents a single card with a single primary action. The setup card contains all configuration. The question card contains only the current question. The results card contains only the outcome.

There's no sidebar, no persistent navigation bar, no floating menus (except the fixed theme and history buttons, which are always-available utilities rather than navigation).

### Card styling

Cards use:
- Dark translucent backgrounds (`rgba(10, 15, 30, 0.85)`)
- A 1px border in the accent color at low opacity
- `backdrop-filter: blur(10px)` for depth against the animated starfield
- `box-shadow` with a soft glow outward

This makes cards feel like holographic display panels floating in space.

### The horizontal divider

`<div class="saber-divider">` renders as a horizontal line with a gradient from transparent to `var(--saber-blue)` and back — like a lightsaber blade lying flat. It's used between major sections to separate concern without adding visual weight.

### Z-index layers

| Layer | z-index | What's on it |
|---|---|---|
| Background | 0 | Starfield canvas |
| Content | 1 | All screens and cards |
| Effects | (above content) | shipCanvas celebration overlay |
| Fixed UI | 10 | Theme button, history button |
| Modal | 100 | Session history modal |
| Banners | above all | Celebration/failure banners |

---

## Theming

Themes exist for two reasons:

1. **Personalization** — older kids and parents who find the default neon-blue too intense can switch to Dim or Deep Blue
2. **Accessibility** — Dim reduces contrast slightly for users who find bright glowing interfaces harsh; Retro offers a green-on-black CRT look for nostalgia

All five themes remap the same CSS variables — no component style changes per-theme. This means any new component built with the existing variables inherits all themes automatically.

The theme button intentionally stays visible on all three screens so users never feel locked into a theme. It's also small and muted (9px Orbitron, low-opacity border) so it doesn't compete visually with the content.

---

## What to Preserve

If editing or extending the UI:

- **Don't add new colors** to components without first defining them in `:root` and ensuring they map to all five themes
- **Don't write punishing copy** — no "WRONG", "FAILED", "YOU LOSE"
- **Don't use Exo 2 for numbers** — all numerical displays (scores, timers, question text) use Orbitron
- **Don't add hover styles without `@media (hover: hover)` guards** on elements that kids will tap on mobile
- **Keep labels short** — if a label takes more than a breath to say aloud, it's too long
- **Keep Star Wars vocabulary** — the mode names (Hyperspace, Kessel Run), rank names (Padawan, Youngling), and action names (Abort Mission, Begin Training Mission) are core to the identity. Don't replace them with generic names.
