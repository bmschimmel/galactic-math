# Visuals and Animations

Galactic Math uses two HTML5 Canvas elements for all animated visuals. CSS animations handle UI transitions and feedback flashes.

---

## Canvases

| Canvas | ID | Purpose |
|---|---|---|
| Background starfield | `starfield` | Twinkling stars and slowly rotating nebula gradients |
| Effects overlay | `shipCanvas` | All celebration animations and the hyperspace jump |

Both canvases are fullscreen and positioned fixed behind the UI (`z-index` below content). The effects canvas (`shipCanvas`) reuses the same element for all celebrations — only one celebration runs at a time, guarded by `celebrationActive`.

---

## Starfield

The starfield is a `requestAnimationFrame` loop owned by the `starBackground` module in `game.js`. It is built to cost as little as possible per frame, because it runs behind every screen on the tablets and phones the app targets.

**Layers.** The visible canvas is composed each frame from two offscreen canvases with three `drawImage` blits:

| Layer | Contents | Repainted |
|---|---|---|
| `nebula` | Three rotating radial-gradient blobs | Every ~100 ms (~10fps) — a 100-second rotation does not need 60fps |
| `starLayers[0]` / `starLayers[1]` | Half the stars each, at full opacity | Once per resize or theme change |

**Stars**: Density is calculated from viewport area (1 star per ~7000px²). Each star has a random position and radius (0.2–1.4px) and is assigned to one of the two layers. Twinkle is a slow sine wave (about one breath every four seconds) applied through `globalAlpha` — the two layers fade in opposite phase between opacity 0.25 and 0.6, so the sky shimmers without ever pulsing as a whole. No per-star `arc()` calls happen in the frame loop.

**Nebula**: Three radial gradient blobs rotate around a central point with a ~100-second cycle. Two blobs orbit opposite each other (blue/purple); a third trails at 120°. This creates a subtle sense of depth without being distracting.

**Lifecycle**: The loop stops on `visibilitychange` when the tab is hidden and restarts when it returns. The `resize` handler is debounced to 150 ms because mobile browsers fire it repeatedly while the URL bar shows and hides. Under `prefers-reduced-motion` the loop never starts — the field is drawn once and left still (see [Reduced motion](#reduced-motion)).

**Theme integration**: `currentStarColor` is updated by the theme cycler, which then calls `starBackground.refresh()` to repaint the star layers in the new color (the running loop would notice the change on its own; the explicit call is what makes a still, reduced-motion starfield update too).

---

## Reduced motion

`REDUCED_MOTION` in `game.js` reads `window.matchMedia('(prefers-reduced-motion: reduce)')` once at load. When it is set:

- The starfield is painted once and never animates.
- `launchCelebration` and `launchKesselCelebration` still play their sounds and show the `congratsBanner`, but spawn no rings or comets and never enter their frame loops.
- `launchHyperspace` draws no streaks; it holds on the win banner for 1.2 s and then calls `onComplete` so the results screen still follows.
- In `style.css`, a `@media (prefers-reduced-motion: reduce)` rule collapses every CSS animation and transition to a single instant frame, so banners and feedback flashes appear without sliding, popping or shaking.

The reward — sound, banner, rank — is unchanged; only the motion is removed. `pages/alien-invasion.html` is a game whose play *is* motion and is deliberately not covered.

---

## Ring Shockwave Celebration (`launchCelebration`)

Triggered on a passing score in **Standard** and **Hyperspace** modes.

- 9 expanding rings, staggered 280ms apart over ~2.5 seconds
- Each ring expands outward from the screen center at increasing speed
- Colors cycle through the design system palette: saber-blue, saber-green, saber-purple, gold, star-white
- Each ring has three layers: a wide soft glow, a solid core, and a bright white inner edge
- A congratulations banner (`congratsBanner`) appears 300ms in with the `victory` sound
- The animation loop runs for 5 seconds total

---

## Kessel Run Comet Celebration (`launchKesselCelebration`)

Triggered on a passing score in **Kessel Run** mode.

- 22 comets staggered 185ms apart over ~4 seconds
- Each comet spawns randomly from either the left edge or top edge and flies diagonally across the screen
- Each comet has a gradient tail (transparent at base, opaque at head) and a radial glow at the head
- Colors picked randomly from the design system palette
- Comets fade out when they leave the viewport (life decreases rapidly off-screen) or decay naturally
- The animation loop runs for 9 seconds total

---

## Hyperspace Jump Animation (`launchHyperspace`)

Triggered when Hyperspace mode is completed successfully.

- 200 streaks radiate outward from the screen center
- Each streak accelerates over ~3 seconds (180 frames), simulating exponential speed increase
- A deep blue ambient glow builds as speed increases
- A brief bright blue flash appears at the very start
- Streaks are gradient lines: dark blue tail → bright cyan-white head
- When the animation completes, `onComplete()` is called (which then shows the results screen)

---

## CSS Animations

Key UI animations defined in the `<style>` block:

| Animation | Used on | Effect |
|---|---|---|
| `feedbackFlash` | Correct/wrong flash overlay | Brief `✓` or `✗` centered on screen |
| `congratsBanner` | Pass banner | Fade/scale in, auto-dismiss after 3.5s |
| `hyperWinBanner` / `hyperFailBanner` | Hyperspace outcome banners | Slide in from top |
| `.launching` / `.liftoff` on `#startBtn` | Begin Mission button (both games) | Left-to-right fill + flash; cleared on `pageshow` |
| `cardFwd` / `cardBack` | Setup deck flashcards | 14px slide + slight scale in, spring easing, direction follows Next/Back |
| `boing` | Any tapped tile on the setup deck | Squash-and-stretch (1 → 1.12 → 0.96 → 1) over 0.4s; re-triggered by removing and re-adding the class |
| `fpPulse` | Current flight-path node | Gentle scale pulse |
| `kesselPenaltyFlash` | Wrong answer in Kessel Run | Red penalty flash beside the input |
| `progress-fill` | Quiz progress bar | CSS width transition |
