# UI — Themes, Session History, and Navigation

---

## Theme Cycler

A fixed button in the top-right corner (`themeBtn`) cycles through 5 color themes. Clicking it calls `cycleTheme()`, which:

1. Increments `currentThemeIdx` (wrapping at 5)
2. Sets `data-theme` attribute on `<html>`
3. Updates the button label
4. Updates `currentStarColor` so the starfield matches the theme

| Theme | `data-theme` | Character |
|---|---|---|
| Dark (default) | (none) | Deep space blue-black, bright cyan accents |
| Dim | `dim` | Muted, soft blue-grey |
| Midnight | `midnight` | Deep purple, violet accents |
| Deep Blue | `deep-blue` | Rich ocean blue |
| Retro | `retro` | Green-on-black terminal look |

All theme colors are defined as CSS custom properties (`--saber-blue`, `--star-white`, etc.) in `:root` and overridden per-theme via `html[data-theme="..."]` selectors. No JavaScript color manipulation is done directly — everything flows through CSS variables.

---

## Session History

Session scores are tracked in the `sessionScores` array for the lifetime of the page (resets on reload, never written to localStorage).

### Session score object

Each entry pushed to `sessionScores` after a quiz:

```js
// Standard or Hyperspace mode
{ mode: 'Standard' | 'Hyperspace', correct, total, pct }

// Kessel Run mode
{ mode: 'Kessel Run', correct, total, pct, time, elapsed, penalties }
```

### Results screen session section

The results screen always shows a session history table below the score, displaying all rounds played this session. The current round is highlighted with `.current-run`. Each row shows:

- Round number
- Mode label
- Score (`N/20`) or final time (Kessel Run)
- Percentage (all modes) + elapsed/penalties breakdown (Kessel Run)

A background bar behind each row is colored green/yellow/red based on score percentage.

### Session history modal

A floating button (clock icon) in the top-right area opens a modal showing the same session history from anywhere in the app, not just the results screen. The modal closes on Escape, clicking the backdrop, or the close button.

---

## Banner Clicking

Clicking the **GALACTIC MATH** header banner from any screen returns to the setup screen. This makes it easy for kids to restart without hunting for a button.

---

## Keyboard Navigation

- **Number keys (0–9)**: Play a keypress sound while typing in the answer field
- **Enter**: Submit the current answer
- **Escape**: Close the session history modal if open

---

## Mobile Support

The layout is responsive down to ~375px wide. Key mobile considerations:
- The number selection grid uses `auto-fill` columns that wrap naturally
- Operation mode buttons and game mode tiles are centered on small screens
- The answer input is large and touch-friendly
- A dedicated **Submit** button appears for touch users (Enter still works on keyboard)

## Desktop Support

Above 900px wide, `.container`/`.page-wrapper` widen from the 700px column to 860px, and the setup deck's number, operation, and game tiles scale up to match (see [setup.md](setup.md)) — before IDT-282 the page stayed pinned at 700px on any screen, leaving growing empty margins on laptop/desktop.

### Alien Invasion touch controls

On touch devices, `pages/alien-invasion.html` renders a virtual D-pad (bottom-left) and a fire button (bottom-right). These wire into the same `keys[]` state used by keyboard input so all physics and audio remain unchanged. A pause button is also overlaid on-screen. The planet fact popup dismisses on tap. Responsive CSS (`≤600px`) shrinks the HUD bar, question text, and answer input for small phones, and stacks end-screen buttons vertically.
