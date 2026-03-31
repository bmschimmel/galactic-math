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

The starfield runs continuously as an `requestAnimationFrame` loop for the lifetime of the page.

**Stars**: Density is calculated from viewport area (1 star per ~7000px²). Each star has a random position, radius (0.2–1.4px), opacity, twinkle speed, and phase offset. Twinkle is a slow sine wave — glacially slow by design so it doesn't distract young users.

**Nebula**: Three radial gradient blobs rotate around a central point with a ~100-second cycle. Two blobs orbit opposite each other (blue/purple); a third trails at 120°. This creates a subtle sense of depth without being distracting.

**Theme integration**: `currentStarColor` is updated by the theme cycler so stars match the current color palette.

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
| `.launching` / `.liftoff` on `#startBtn` | Begin Mission button | Left-to-right fill + flash |
| `kesselPenaltyFlash` | Wrong answer in Kessel Run | Red penalty flash beside the input |
| `progress-fill` | Quiz progress bar | CSS width transition |
