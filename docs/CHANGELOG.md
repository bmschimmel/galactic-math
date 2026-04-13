# Changelog

All notable changes to Galactic Math Academy are listed here, newest first.
Each entry references the Linear issue ID (IDT-XX) and the GitHub PR that merged it.

---

## 2026-04-13 (3)

### IDT-103 — Show "Skipped" instead of "null" for unanswered questions (PR #TBD)
Unanswered questions in the missed-problems review showed "You: null". The fix checks whether the recorded answer is null and displays "Skipped" instead, keeping the language friendly for kids.

## 2026-04-13 (2)

### IDT-101 — Race to Earth game mode (PR #74)
New canvas-based game at `pages/race-to-earth.html`. The player pilots a detailed rocket ship (nose cone, swept fins, engine bell, porthole, animated flame) through 20 math gates in any order to reach home. Thrusting burns oxygen continuously; wrong answers cost an additional 5%. Three bonus rainbow gates require 3 correct answers each and refuel +10% O₂ on completion. Five lives are lost by colliding with drifting asteroids (screen shake + debris particles), alien UFO saucers (multi-layered explosion sound with boom, noise burst, and alien screech + colorful particle explosion), or comets that streak across the screen from random directions with glowing color trails. A pulsing directional arrow always points toward the nearest uncleaned gate when it is off-screen. Gates can be tackled in any order. A "Race to Earth" tile in the main setup screen's Special Modes section passes current number and operator selections into the game as URL params.

## 2026-04-13

### IDT-100 — GitHub repo link in footer and developer docs TOC in README (PR #72)
The "Created for fun." text in the app footer now links to the GitHub repository. The main `README.md` also gains a developer docs table of contents, mirroring `docs/README.md`, so contributors can find the right doc file without digging into the `docs/` folder first.

---

## 2026-03-30

### IDT-65 — Even question distribution across operations (PR #70)
When multiple operations are selected, questions are now evenly distributed across them. For example, Multiply + Divide gives exactly 10 of each (with remainders distributed to earlier operations). Previously, operations were picked randomly per question, leading to uneven mixes.

### IDT-63 — Abort Mission sound effect (PRs #68, #69)
Added a deflating power-down sound to the Abort Mission (quit) button. The sound plays engines losing thrust and trailing to silence. The sound was also scoped to the quit button only (not other navigation actions).

### Kessel Run comet celebration extended (PR #67)
The Kessel Run comet celebration was extended to run for 9 seconds (22 comets staggered over ~4s), giving it more visual impact on a passing score. The Standard mode ring celebration was extended to 5 seconds. Both celebrations now have equal visual weight.

---

## 2026-03-29

### IDT-60 — Debug mode for quick UX testing (PR #65)
Added `?debug=1` URL parameter that reduces session length to 1 question. Makes it faster to test the quiz → results flow during development without answering all 20 questions.

### IDT-59 — Ring shockwave celebration for Standard mode (PR #64)
Replaced the comet streak celebration in Standard mode with a new ring shockwave animation: 9 expanding colored rings burst outward from the screen center, cycling through the design system palette. Includes a deep bass `shockwaveImpact` sound. Also added a left-to-right fill animation on the Begin Mission button at launch.

### IDT-58 — Favicon on feedback and workflow pages (PR #63)
Added the Galactic Math favicon (SVG inline) to `pages/feedback.html` and `pages/workflow.html` so all pages display the icon in browser tabs.

### IDT-57 — Banner click returns to setup (PR #62)
Clicking the "Galactic Math Academy" header banner now navigates back to the setup screen from any screen. Previously the banner was non-interactive.

### IDT-56 — Switch feedback title generation to Cloudflare Workers AI (PR #61)
The feedback worker now uses Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) to generate GitHub issue titles from feedback messages. Previously used the Claude API. Falls back to the first 50 characters of the message if AI is unavailable.

### IDT-50 — View existing issues link on feedback page (PR #55)
Added a footer link on `pages/feedback.html` to the GitHub issues page, so users can check if their issue already exists before submitting.

### IDT-48 — Feedback form improvements (PR #53)
- Added a category picker (Bug / Feature Request / Other) that maps to GitHub labels (`bug`, `enhancement`, `feedback`)
- Auto-generates a concise GitHub issue title using AI
- Contextual form copy and vivid category badge colors

### IDT-49 — Workflow page with hover explainers (PR #51)
Added `pages/workflow.html` — a visual explainer of the development pipeline (GitHub → Linear → PR → merge). Includes hover-activated panels explaining each step and a link from the game's footer.

### IDT-46 — Distinct sound effects for timed mode toggles (PR #50)
Each game mode toggle now has its own activation sound:
- Hyperspace ON: rising hyperdrive charging sound
- Kessel Run ON: three countdown beeps + race start burst
- Previously both used a generic `modeActivate` sound

### IDT-43 — Mobile layout fixes (PR #56)
- Fixed number grid overflow that was clipping buttons 6 and 13 on small screens
- Centered operation buttons and game mode tiles on mobile
- Added Linear issue lookup instructions to CONTRIBUTING.md

---

## 2026-03-28

### IDT-40 — Observability logging config in wrangler.toml (PR #43)
Enabled Cloudflare invocation logs in `worker/wrangler.toml` so feedback worker activity is visible in the Cloudflare dashboard.

### IDT-39 — Observability logging in feedback worker (PR #42)
Added structured `console.log` calls in `feedback-worker.js` for key events: rate limit hits, honeypot triggers, successful issue creation (with URL, IP, category, and generated title).

### IDT-34 — Feedback form wired to GitHub Issues via Cloudflare Worker (PR #37)
Built and deployed `worker/feedback-worker.js` — a Cloudflare Worker that receives form submissions and creates GitHub issues via the GitHub REST API. Includes rate limiting (3 per IP per 10 min) and a honeypot anti-spam field.

### IDT-33 — Abort Mission button (PR #36)
Added an "Abort Mission" quit button to the quiz screen so users can return to the setup screen without finishing all 20 questions.

### IDT-32 — Code quality and accessibility improvements (PR #35)
- Fixed `fmt()` function scope crash in Kessel Run results
- Switched `==` comparisons to `===` for strictness
- Fixed duplicate session history rendering
- Added ARIA labels to interactive elements
- Improved touch target sizes for mobile

### IDT-31 — Operation mode deselection and validation (PR #34)
- Allowed any operation to be freely deselected (previously required at least one always active)
- Added validation warning when all operations are deselected
- Added a Reset button to restore default (Multiply only)
- Fixed op button stuck hover state on mobile (scoped hover to pointer devices)

---

## 2026-03-27

### IDT-29 — Theme button off-screen fix on mobile (PR #32)
Fixed the Kessel Run penalty flash overflow that was pushing the theme button off-screen on small displays.

### IDT-30 — Reset button for operation mode selector (PR #33)
Added a Reset button next to the operation mode buttons that restores the default (Multiply only) with one click.

### IDT-28 — Mobile design improvements (PR #31)
- Fixed mobile layout for number grid and quiz screens
- Added a touch-friendly Submit button for mobile users (Enter key still works)
- Fixed footer wrapping on small screens

### IDT-24 — Spacing and layout polish (PR #30)
- Reduced excess spacing below game mode tiles and Begin Mission button
- Renamed the game mode section label to "Play Time Based Modes (Optional)"
- Matched divider margins between operation mode and game mode sections

### IDT-22 — Meta tags and Open Graph (PR #29)
- Added `<meta name="description">` for SEO
- Added Open Graph tags (`og:title`, `og:description`, `og:image`) for social previews
- Added Twitter Card tags
- Added version number to footer
- Created `og-image.svg` for social preview image

### IDT-21 — Session history viewer (PR #26)
Added a session history modal accessible from a clock-icon button in the top-right corner. Shows scores from all rounds played in the current session (in-memory only, resets on page reload). Each row shows mode, score/time, percentage, and a color-coded bar.

### IDT-19 — Initial preset state fix (PR #25)
- Fixed a bug where the "Basic 2–12" preset appeared active on load but numbers 0, 1, and 13 were included in `selectedNums`
- Added an active glow state to the selected number preset button

### IDT-20 — Blue hyperspace jump animation (PR #24)
Changed the hyperspace jump animation from white streaks to deep blue → cyan-white gradients, matching the space aesthetic.

### IDT-16 — General UX improvements (PR #21)
A broad UX polish pass including:
- Penalty flash and session history bar gauge improvements
- Visual spacing and layout refinements
- Multiple rounds of UX polish based on playtesting

### IDT-8 — Kessel Run speed mode (PR #20)
Added Kessel Run mode: a count-up timer with 5-second wrong-answer penalties. Final score is elapsed + penalty seconds. Results show the time breakdown.

### IDT-17 — Hyperspace timer settings update (PR #19)
Adjusted Hyperspace mode difficulty time limits to: Wicked Easy 5min / Harder 3min / Hyperdrive 1min. Previous limits were different.

### IDT-13 — Feedback footer and feedback page (PR #16)
Added a footer with a "Send Feedback" link to the main game. Created `pages/feedback.html` as the feedback form page.

### IDT-9 — Theme mode cycler (PR #15)
Added a fixed theme cycler button (top-right corner) cycling through 5 themes: Dark, Dim, Midnight, Deep Blue, Retro. All themes are CSS-only via `data-theme` attribute and CSS custom property overrides.

### IDT-14 — Updated README with Cloudflare Pages URL (PR #14)
Updated documentation to point to the live Cloudflare Pages deployment URL.

### IDT-6 — Hyperspace timed challenge mode (PRs #12, #13)
Added Hyperspace mode: a countdown timer overlaid on the quiz. Three difficulty cards (Wicked Easy / Harder / Hyperdrive). Blue hyperspace jump animation on completion, failure banner on timeout.

---

## 2026-03-26

### IDT-4 — Addition and subtraction operation modes (PR #10)
Added Add and Subtract as selectable operation modes. Switched the operation selector from radio-select to multi-select (any combination of operations can be active).

### IDT-5 — Rocket ship icon on Begin Mission button (PR #8)
Replaced the lightning bolt icon on the Begin Mission button with a rocket ship (🚀), matching the space theme.

### IDT-2 — Initial integration and pipeline setup (PR #7)
Set up the GitHub → Linear integration, CONTRIBUTING.md, and the branching/commit/PR workflow.

---

## Before 2026-03-26 (Initial version)

The initial version of Galactic Math was a single `index.html` file with:
- Multiplication and division modes
- Number selector (0–13)
- 20 randomized questions per session
- Correct/wrong sound effects (Web Audio API)
- Comet streak celebration on passing score
- Animated starfield background
- Jedi rank system (5 levels)
- Keyboard navigation (Enter to submit)
- Nav dots showing question status
- Results screen with missed problem review
