# Changelog

All notable changes to Galactic Math are listed here, newest first.
Each entry references the Linear issue ID (IDT-XX) and the GitHub PR that merged it.

---

## 2026-09-15

### IDT-306 — Add the Web Analytics beacon to the feedback, workflow and release-notes pages (PR #157)

IDT-305 put the Cloudflare Web Analytics beacon on `index.html` and `pages/alien-invasion.html` only, so visits to the feedback form, the How It Works page and the release notes were invisible. The same tag is now in the `<head>` of all three, so they appear under **Paths** as ordinary page views. No CSP change was needed; `_headers` already allow-lists the beacon origins site-wide. `docs/analytics.md` lists all five pages.

### IDT-305 — Count game-mode launches with virtual paths and Cloudflare Web Analytics (PR #155)

Standard, Hyperspace and Kessel Run all run inside `index.html` without navigating, so page-view analytics saw one path for everything. When a mode launches from the flight deck the game now swaps the address bar to a virtual path (`/classic/kessel/`, `/classic/hyperspace/harder/`, `/alien/recon/`, …) with `history.replaceState()`, and a cookieless Cloudflare Web Analytics beacon in SPA mode reports each swap as a page view. New Mission swaps the URL back to `/`. A new `_redirects` file sends any real load of a virtual path back to `/`, both pages pin their relative links to absolute URLs so they keep working while a virtual path is active, and `_headers` allow-lists the beacon origins. The beacon tag ships with a placeholder token; `docs/analytics.md` has the Cloudflare setup steps.

### IDT-299 — Fix oval circles, too-fast movement, touch targets, and a control overlap in Alien Invasion on mobile (PR #153)

Closes out the IDT-135 mobile research: several fixes, all in `pages/alien-invasion.html`.

**Oval circles:** `#gameCanvas`'s CSS box was sized with `100vw`/`100vh` while its drawing-buffer resolution came from `window.innerWidth`/`innerHeight` — on mobile these disagree whenever the address bar shows or hides (`100vh` reflects the large viewport, `innerHeight` the current one), stretching every `ctx.arc()` circle into an ellipse. `resizeCanvas()` now reads the canvas's own `getBoundingClientRect()` instead, backed by a `ResizeObserver` so it stays in sync through address-bar changes and orientation switches, not just the `resize` event. Verified by deliberately forcing the CSS box out of sync with `innerWidth`/`innerHeight` (the exact bug scenario) and confirming a freshly-drawn circle measured a perfect 1.000 width/height pixel ratio.

**Movement too fast on mobile:** the world renders at a fixed 1:1 world-to-screen pixel mapping with no zoom, so a ~390px-wide phone canvas shows a much smaller slice of the 2000×5600 world than a ~1400px desktop canvas — the same world-px/frame speed then crosses a far bigger fraction of the visible screen each frame. Missile, comet, and alien-laser speeds multiply by `viewScale()` (`canvas.width / 1400`, capped at 1 so desktop pacing is unchanged). Ship speed does not — view-scaling it made the ship feel way too slow on feedback, so it's back to a flat speed, just 10% under the original (4.2 → 3.78).

**Touch targets:** Alien Invasion's own setup-screen number grid had the same fixed-7-column problem as the main game's Numbers step ([IDT-301](https://linear.app/thehomefront/issue/IDT-301/number-grid-touch-targets-still-too-small-on-mobile-numbers-step)) — buttons measured 40×40px on phones. Same fix: `repeat(auto-fill, minmax(44px, 1fr))` on mobile instead of a fixed 7 columns, wrapping onto a third row. Now measures 45.5-51.7px across tested phones, desktop's 7-column/2-row layout unaffected.

**Controls overlapping the gate question:** `#questionOverlay` spans the full screen width at the bottom (`z-index: 20`) — exactly where the virtual D-pad and fire button sit (`z-index: 50`), so they rendered on top of the math question card. The D-pad/fire buttons now hide for the duration of the question (`openGateQuestion()`) and reappear once it closes, whichever way it closes (correct answer, wrong answer, or dismiss).

**Dead gap between the question card and the on-screen keyboard:** `#questionOverlay` is `position:fixed; bottom:0`, which anchors to the layout viewport — opening the mobile keyboard shrinks the *visual* viewport but leaves the layout viewport unchanged in most mobile browsers, so the overlay stayed pinned to where the screen bottom would be with no keyboard, leaving a dead gap above the keyboard. A `window.visualViewport` listener now keeps the overlay's `bottom` flush with the keyboard's actual top edge.

### IDT-301 — Make the mobile number grid responsive instead of squeezing 7 fixed columns (PR #152)

Trimming padding/gap to fit 7 fixed columns only got mobile `.num-btn` tiles to 44-49px in measurement, with no real perceptible improvement — the layout was still fundamentally fighting to cram 7 columns into a narrow phone width. Replaced the fixed `repeat(7, 1fr)` with `repeat(auto-fill, minmax(46px, 1fr))` on mobile so the column count adapts to the available width, wrapping the 14 numbers onto a third row (6+6+2) on narrow phones instead of forcing an undersized 7-across row. This surfaced a real bug: `game.js` hardcoded `if (i === 7) btn.style.gridColumn = '1'` to force a row break at exactly the old fixed 7-column boundary, which collided with the grid's own natural wrapping under a variable column count and produced broken, uneven rows (6, then 1, then 6, then 1). Removed it — it was already redundant on the fixed 7-column desktop grid and actively wrong for a responsive one. Real measured button size after the fix: 46-52px across iPhone SE/13/14 Pro/Pixel 7, no horizontal overflow, no regression to IDT-300's vertical-fit fix, and desktop's 7-column/2-row layout is unaffected.

### IDT-300 — Fix a mobile regression from IDT-297: title overlapping the header buttons, setup deck overflowing (PR #151)

IDT-297's short-viewport query (`@media (max-height: 820px)`, meant for short laptop windows) had no `min-width` guard, so it also fired on phones — nearly all of which are both ≤600px wide and ≤820px tall in portrait. It collided with the mobile-width rule's `.container { padding-top: 56px }` (added specifically to clear the fixed HISTORY/DARK buttons) and `.deck-body`'s mobile reserve, replacing both with laptop-tuned values on phones: the buttons rendered on top of the title on short phones like the iPhone SE, and the deck's reserve shrank too far for mobile's actual per-step content. Scoped the query to `min-width: 601px` so it never reaches phone widths again. Separately trimmed the mobile `.deck-body` reserve from 440px to 370px (measured natural content per step: 185–361px, same over-reservation pattern IDT-297 fixed for desktop) and tightened the title-divider/footer spacing for mobile, closing the remaining overflow on common phones (iPhone 13/14 Pro, Pixel 7). Also found and fixed a second, unrelated instance of the same cascade bug: `.title-divider` and `.page-footer` each had an unconditional base rule later in the stylesheet that was silently overriding *both* IDT-297's laptop trims and this fix's mobile trims (equal specificity, later source order always wins) — a 1280×650 laptop viewport was still overflowing despite IDT-297 being marked Done. iPhone SE (667px tall) still needs a normal scroll to see everything; no button/title overlap or overflow on any other tested size (iPhone 13/14 Pro, Pixel 7, 1366×768, 1280×650, 1920×1080). Docs: `docs/setup.md` updated.

### IDT-280 — Stop the virtual D-pad and fire button showing through the intro briefing (PR #150)

On touch devices, `initGame()` called `showVpad()` before `showIntroExplainer()` ever ran, so the virtual D-pad and fire button (`z-index: 50`) rendered on top of the full-screen "ALIEN INVASION!" briefing overlay (`z-index: 35`) instead of appearing once gameplay actually starts. `showVpad()` now fires from `dismissIntro()` instead, right as the briefing closes and the countdown begins.

### IDT-298 — Remove pages/prototypes/ from the repo (PR #149)

Throwaway UX prototypes were living in the public repo under `pages/prototypes/`, documented via `docs/prototypes.md`. Removed both, along with the dangling references in `docs/README.md`, `docs/setup.md`, and the page-structure bullet in `CLAUDE.md`. Going forward, prototype explorations are handed to the user directly (a file or a Claude Artifact) instead of being committed.

### IDT-296 — Rename Sneak Attack to Recon and fix aliens firing while "unarmed" (PR #146)

The easy Alien Invasion card was labeled "Sneak Attack" on the setup deck while its sub line already promised "Alien ships unarmed" — renamed to "Recon" everywhere it's user-facing (`index.html`'s card label and `data-invasion`/`setInvasion` value; `game.js`'s internal `invasionSize` key was already renamed in a direct main commit). The "unarmed" promise wasn't actually kept: `generateObstacles()` in `pages/alien-invasion.html` always made exactly half the spawned aliens shooters regardless of mode, so the 5-alien Recon run still took laser fire. `isShooter` is now `false` for every alien when `N_ALIENS` is 5 (Recon), leaving the half-shooters rule for Invasion and Chaos. Docs: `docs/setup.md` and `docs/game-modes.md` updated.

### IDT-291 — Auto-expand the most recent release on the release notes page (PR #143)

Every release row on `pages/release-notes.html` started collapsed unless it matched the footer's `?version=` link, so a plain visit to the page showed nothing but a list of closed headers. The most recent release (index 0 of the newest-first list GitHub returns) now always starts expanded, alongside whichever release a `?version=` param targets if that's a different, older one.

### IDT-282 — Fill the Flight Deck's empty space and widen it on desktop (PR #141)

The Flight Deck setup steps reserve a fixed-height card so Back/Next never jump between steps, but several steps (Math, Game, Options, Launch) had far less content than that reserve, leaving a large dead gap below the tiles. The math and game cards now stretch to fill that height with `flex: 1` grid rows instead of sitting at their natural size; the game mode list, alien invasion picker, and mission briefing rows center vertically in the leftover space instead of clumping at the top. Separately, the whole page was pinned to a 700px-wide column no matter how large the viewport got — above 900px wide it now widens to 860px, with the setup deck's number, operation, and game tiles scaling up to use the extra room.

### IDT-284 — Create a release notes page for Galactic Math (PR #140)

Seeing what changed meant leaving the app for GitHub, so `pages/release-notes.html` now shows it in place: it calls the public GitHub REST API on load for every published release plus the 15 most recently merged pull requests, rendering each release body through a small escape-first Markdown-to-HTML converter that only re-introduces headings, bold, lists, paragraphs, and links — both markdown links and the bare PR URLs GitHub's auto-generated "What's Changed" list uses, shown as `#N` (raw `<img>` screenshots are dropped rather than rendered). The page is two panels sized 1/3–2/3 — Recent Changes on the left, Releases on the right, stacking on narrow screens — and each release is a collapsible row that starts closed. Recent Changes tags each PR with the release it shipped in, read off the same release bodies already on the page rather than a request per PR — a PR with no matching release (merged after the last tag) just shows its date, no badge. The container is 20% wider (960px → 1152px) with a `min-width: 0` fix on the grid panels and `overflow-wrap` on long text so a stray unbroken URL in a release body can't force the page to scroll sideways at any viewport width. The footer gets a new "📜 Release Notes" link on its own row next to the other links, and the version number underneath keeps its original plain, unhighlighted look while opening this page pre-expanded and scrolled to its own release row — `game.js` reads the version straight from the link's own text rather than hardcoding a second copy, so the version string still lives in one place. A failed request (offline, GitHub down, rate-limited) falls back to a message linking straight to the GitHub releases page instead of a blank screen. `https://api.github.com` is added to `connect-src` in `_headers` for this. Docs: new `docs/release-notes.md`, `docs/overview.md` and `docs/README.md` updated.

### IDT-281 — Tiny fixes for Alien Invasion (PR #139)

Several papercuts in Alien Invasion. The pre-launch intro explainer was vague about what the game actually involves, and its move/shoot/pause instructions were wordy; the explainer now states the goal and stakes in two sentences (earn missiles from math rings, shoot down every alien ship, wrong answers cost fuel, dodge comets and asteroids) and the control descriptions are trimmed to one line each — both there and in the in-game bottom-right key hint, click-to-fly now correctly credits the mouse as well as the trackpad. Firing with zero missiles used to play only a dry-click sound; it now also plays a sharper error buzz and shows a red warning ("Fly to the rings and complete problems to get missiles!") floating just above the ship, close to where the player is actually looking, for 1.8s. Holding Space to spam-fire no longer machine-guns the buzz sound — it's throttled to once every 1.2s while the hint text stays up — so mashing the key in confusion doesn't turn into noise. The bottom-left dev banner dropped its "Still in development" wording (the game has shipped) and keeps only the "Submit ideas here" link to the feedback form. Also fixed: the ship's thruster flame kept animating while docked at a gate answering a question, since `updateShip()` (the only place that recomputes it) stops running as soon as `gameState` flips to `'question'` — `openGateQuestion()` now zeroes `ship.moving` itself so the flame cuts out the moment the ship parks, matching the engine sound which already stopped. The HUD's ammo icon was a 🚀, easy to mistake for a life/ship indicator, so it's now the plain text label "AMMO" (matching how the FUEL stat is already labeled); picking up missiles at a gate now pulses that label and the missile count so the gain is easy to spot instead of just changing a number quietly. The same stuck-thruster bug applied to planets — reading a planet's fact popup also parks the ship without clearing `ship.moving`, so it gets the same one-line fix. Fuel pickups get the same pulse treatment as ammo (the FUEL label and percentage flash gold) so a refuel reads as clearly as a missile pickup does, plus the same "⛽ FUEL +10%" flight banner the ammo pickup shows. The low-fuel audio warning now starts at 20% instead of 10%, giving kids more of a heads-up before it matters.

### IDT-283 — Bump version to 2.0.0 and document the release process (PR #136)

The footer version in `index.html` moves from v1.0.0 to v2.0.0 ahead of the v2.0.0 GitHub release, which gathers everything merged since the v1.0.0 tag in March — Alien Invasion, the Flight Deck setup deck, the Cloudflare feedback worker, security headers and the CSP split, the starfield battery fix and the wall-clock timers. `CONTRIBUTING.md` gains a **Releases** section that writes down the process for the first time: the version string lives only in the footer and is bumped in its own PR; a release is drafted from `main` with `gh release create --generate-notes --notes-start-tag <previous>`, which lists every PR since the last tag; publishing the draft is what creates the tag; and GitHub milestones are an optional tracking record that release notes do not depend on.

---

## 2026-09-13

### IDT-279 — Build the Flight Deck setup flow (PR #135)

The setup screen is now a deck of five flashcards — Numbers, Math, Game, Options, Launch — with a flight-path stepper on top and Back / Next in the same two slots on every step, replacing the single long card that ended in "Begin Training Mission" with a dashed "Try Alien Invasion" link underneath. Numbers and math keep their defaults so a returning kid taps Next twice; the game and option cards advance by themselves after a tap bounce; a Mission Briefing lists every choice (each row jumps back to its step) above a single **Begin Mission** button in the chosen game's colour. Alien Invasion is an equal game card, and step 4 is per game: Galactic Math picks a game mode (Standard preselected, Hyperspace with its difficulty cards, Kessel Run) by tapping the row itself — the ON/OFF badges are gone — while Alien Invasion picks how bad the invasion is (Sneak Attack 5 / Invasion 10 / Chaos 25 aliens, badged Easy / Normal / Hard). The game reads the new `aliens` URL param for its alien count; the rest of what each card implies is IDT-278. The deck body reserves a fixed minimum height and never clips or scrolls, so nothing moves between steps. The cards carry no step counters or running status text; Next is always clickable and explains what is missing when a step is not ready. The "More games coming soon" card links to the feedback form with Feature Request preselected (`pages/feedback.html?category=feature`). Docs: `docs/setup.md` rewritten; `game-modes.md`, `visuals.md`, `audio-engine.md`, `design-ux.md`, `overview.md`, `README.md` and `CLAUDE.md` updated.

### IDT-277 — Bring CLAUDE.md back in line with the feedback worker and pages/ (PR #134)

`CLAUDE.md` is the first file every agent session reads, and it had drifted: it said the feedback page "pre-fills a GitHub issue on submit" when it has POSTed to a Cloudflare Worker for some time, never mentioned the `worker/` directory, `pages/alien-invasion.html`, `pages/workflow.html` or `_headers`, and carried a stale "~40 KB" size threshold. It now has a Feedback worker section (what it does, that `GITHUB_TOKEN` is a Worker secret, that it deploys separately with `wrangler`, that `TITLE_MODELS` needs updating when Cloudflare retires a model), lists each page under `pages/` and states that those self-contained files are exempt from the split-CSS/JS rule, points at `_headers` as the place to update the CSP when adding an external origin, corrects the celebration line (rings in Standard and Hyperspace, comets in Kessel Run), and replaces the fixed size number with a per-PR growth threshold that will not go stale.

### IDT-275 — Cut starfield battery drain and honor prefers-reduced-motion (PR #132)

The background starfield redrew everything at 60fps forever — three full-screen radial gradients and ~300 individual star arcs every frame, on every screen, even with the tab hidden — a steady GPU and battery cost on the tablets and phones the app is aimed at. The nebula is now painted to an offscreen canvas at ~10fps and the stars are pre-rendered once per resize or theme change into two offscreen layers whose opposite-phase cross-fade carries the twinkle, so a frame is three blits instead of three gradient fills and hundreds of path fills. The loop stops while the tab is hidden and the resize handler is debounced to 150 ms so mobile URL-bar bounces no longer rebuild the field. The app also honors `prefers-reduced-motion` for the first time: the starfield is drawn once and left still, the ring, comet and hyperspace animations are skipped while their sounds and banners still play, and a CSS rule collapses every animation and transition to an instant frame.

### IDT-273 — Add missing security headers and split the CSP directives (PR #131)

`_headers` set a single loose `default-src` that carried `'unsafe-inline'` for every resource type, and nothing else. The CSP is now split into per-resource directives — `script-src` and `style-src` keep `'unsafe-inline'` (the pages rely on inline `onclick=` handlers), while `img-src`, `font-src`, `connect-src`, `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'none'` are each scoped to exactly what the site loads, so the game can no longer be embedded in another site's iframe. `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that turns off camera, microphone and geolocation are added alongside. `docs/overview.md` documents each header and directive and what to update when adding an external resource.

### IDT-276 — Harden the AI title prompt against injection (PR #133)

The worker built its title prompt by interpolating raw feedback text into the instruction, so a submission reading "ignore the above and reply with…" could dictate the GitHub issue title, which was used exactly as the model returned it. The instruction is now a `system` message that tells the model the feedback is data to summarize rather than commands to follow, and the feedback travels as a separate `user` message. Every model response then passes through `sanitizeTitle()`, which strips quotes, backticks and newlines, drops a "Title:" preamble and trailing punctuation, clamps the result to 80 characters at a word boundary, and treats anything under 3 characters as unusable so the next model — or the message-slice fallback — is used instead. `docs/feedback-system.md` documents both layers.

### IDT-270 — Enforce allowed origins and fix the rate limiter in the feedback worker (PR #130)
The feedback worker accepted requests from anywhere and its rate limiter was an in-memory `Map` that lived inside a single worker instance, so the 3-per-10-minutes cap reset whenever Cloudflare recycled the worker and never applied across instances. Requests whose `Origin` is not one of the game's own sites now get a `403` before any AI or GitHub call, on both the preflight and the `POST`. The rate limiter is now Cloudflare's Rate Limiting binding (`FEEDBACK_RATE_LIMITER`), declared in `wrangler.toml`, whose counters are shared across worker instances in a location and survive restarts; because the binding only supports 10- or 60-second windows the rule is now 3 submissions per IP per 60 seconds. The worker also refuses bodies over 8 KB by `Content-Length` before parsing, checks that `message` is a string before checking its length, sends `Vary: Origin` on CORS responses, and its `compatibility_date` moves from `2024-01-01` to `2026-09-01`.

### IDT-274 — Base Hyperspace and Kessel Run timers on the wall clock (PR #129)

Both timed modes counted `setInterval` ticks, and browsers throttle background-tab timers to roughly once a minute, so tabbing away paused the Hyperspace countdown and froze the Kessel Run clock — a kid could switch tabs mid-run and come back to a "record" that never happened. Each timer now records `Date.now()` when the round starts and derives elapsed or remaining seconds from that on every repaint; the interval runs at 250 ms and only repaints when the derived second changes, so the display catches up the moment a tab regains focus. The Hyperspace final-10-seconds beep is guarded by a last-announced-second check so a jumped second plays one beep, not a burst, and `stopKesselTimer()` takes a final clock reading so the results screen shows the true time.

### IDT-272 — Delete unreferenced images and resize the OG image (PR #128)

Two source PNGs in `assets/images/` — `logo-planet-only.png` (1.6 MB) and `logo-word-planet.png` (432 KB) — were being deployed to the public web root despite nothing in the HTML, CSS, or JS referencing them; they were only ever inputs for compositing the share image. Both are deleted (git history keeps them recoverable). `og-image-v2.png` was 1.0 MB at 4800×2520 while `index.html` declared it as 1200×630, so it is now downscaled to an actual 1200×630 and stored as an optimized RGB PNG at 286 KB, making the declared `og:image:width` / `og:image:height` true for social validators. Roughly 2.8 MB leaves the repo and the CDN.

### IDT-271 — Remove the Your Name field from the feedback page (PR #127)

The feedback form asked for a name and the worker wrote it verbatim into the public GitHub issue it filed, which for an app aimed at kids aged 5–12 meant a child's self-entered name could end up permanently public and search-indexed. The field is gone: `pages/feedback.html` no longer renders or validates it and no longer sends `name` in the request, and `worker/feedback-worker.js` no longer requires it, no longer enforces a name length, and files the message alone as the issue body. A `name` sent by a stale cached client is silently dropped rather than rejected, so older tabs keep working through the change. Choosing a category now drops focus straight into the message box, and the glowing divider and spacing that separated the message box from the Transmit button are gone, so the button sits directly under the field.

### IDT-214 — Prototype three setup-flow journeys for choosing a game (PR #126)

Alien Invasion joined the setup screen as a dashed "Try Alien Invasion" link under the main launch button, and the timed challenge modes only apply to Galactic Math, so the path from picking numbers to launching a game had become uneven. `pages/prototypes/setup-flow.html` is a self-contained, fully clickable page with three alternative journeys — a one-flashcard-per-step wizard (Flight Deck), a game-first page whose rows unlock in turn (Mission Board), and a two-ship layout where each game owns its challenge chips and launch button (Launch Bay) — plus a comparison tab covering order, taps to launch, phone fit and build cost. Each prototype reuses the game's tokens and widgets with bouncy spring motion, and the launch step shows what the real app would receive instead of navigating. Nothing in the game itself changes; `docs/prototypes.md` describes the page.

---

## 2026-09-10

### IDT-217 — Replace the retired feedback title model and detect the next retirement (PR #123)

Cloudflare retired `@cf/meta/llama-3.1-8b-instruct` on 2026-05-30, so the feedback worker's title generation had been failing silently ever since — every issue got a truncated-message title from the fallback path instead of a generated one. Title generation now walks an ordered `TITLE_MODELS` list (`@cf/meta/llama-3.2-3b-instruct`, then `@cf/zai-org/glm-4.7-flash`) and uses the first model that answers, so a single retirement rolls over on its own. When every model fails, the worker files one GitHub issue labelled `bug` and `worker-health` naming the failed models and their errors; that syncs into Linear triage, and the open issue doubles as the dedupe key so an outage produces one ticket rather than one per submission. Reporting runs in `ctx.waitUntil()` and is wrapped in its own `try`/`catch`, so it can never break or slow a feedback submission.

### IDT-216 — Stop the flying mode badge and gate questions from overlapping (PR #121)

Flying mode is kept while a gate question is open, so the `✈ FLYING MODE · CLICK TO STOP` pill and the question overlay both occupied the bottom centre of the screen and collided. The pill is now smaller and dimmer — 9px type, tighter padding, softer glow and a gentler pulse — so it reads as a status hint rather than a banner. `setFlyMode()` also toggles a `fly-mode` class on `<body>`, and `body.fly-mode #questionOverlay` raises the overlay's bottom padding so the gate label, problem and answer row sit above the pill. The clearance only applies while the pill is showing, so questions keep their full height everywhere else.

### IDT-215 — Fix dead launch buttons after returning from Alien Invasion (PR #122)

Pressing the browser's Back button in Alien Invasion returned to a setup screen where the "Try Alien Invasion" button no longer did anything. The button was the only one in the app that guarded double-clicks through CSS: its `.launching` class set `pointer-events: none` for the 1.9 second glow before navigating away, so any return that kept the DOM — a back/forward-cache restore in particular — brought the class back with it and left the button permanently unclickable. The guard now uses an `alienLaunchPending` flag instead, matching Begin Mission, and `pointer-events: none` is gone from the CSS: page state cannot outlive the page, so a restored setup screen always has a working button. A `pageshow` listener also clears the launch state so a restored page does not show a stuck mid-launch glow.

---

## 2026-09-08

### IDT-212 — Add trackpad steering to Alien Invasion (PR #119)

Kids who find arrow keys awkward can now drive the ship with a trackpad. Flying is a mode rather than a held gesture, since holding a click while dragging asks for more finger coordination than young kids have: one click on the game canvas turns flying mode on, and from then on the trackpad is used normally with nothing held down. A dashed neutral ring at screen centre marks "stop"; moving the pointer more than 44px off centre flies the ship that way and keeps it flying with the finger completely off the pad. Clicking again, or pressing any movement key, leaves flying mode. Pointer offset sets direction only — speed stays the same fixed `SHIP_SPEED` as the keyboard and the touch D-pad, since all three inputs now write into the same `keys[]` map. Direction is measured from screen centre rather than the ship's drawn position, so the camera's follow-lerp cannot feed back into the control and make it oscillate. Space remains the only way to fire. The flying-mode indicator sits at the bottom centre of the screen, and the pre-launch intro explainer now spells out how to move, shoot, and pause — showing keyboard/trackpad controls or touch controls depending on the device.

---

## 2026-05-05

### IDT-134 — Add sound effect to transmit feedback button (PR #136)

Added a themed transmission sound effect to the "📡 TRANSMIT FEEDBACK" button on `pages/feedback.html`. The sound plays an ascending radio-chirp sweep followed by a two-beep confirmation, giving the feel of a signal being beamed out. A self-contained Web Audio engine (mirroring the patterns used in `game.js`) was added inline to the feedback page since it does not load `game.js`.

---

## 2026-05-11

### IDT-142 — Docs audit: remove "Academy" branding, sync docs with recent work (PR #136)

Removed all occurrences of "Galactic Math Academy" from documentation, page titles, and link text across `docs/`, `README.md`, `CONTRIBUTING.md`, and `pages/`. The banner in the app already used "GALACTIC MATH"; the docs were just stale. Also filled documentation gaps introduced by recent issues: added an Alien Invasion mode section to `docs/game-modes.md`, added Alien Invasion touch-control details to `docs/ui.md`, documented the IDT-134 feedback audio in `docs/feedback-system.md`, and added the Alien Invasion game mode to `README.md`'s feature list.

### IDT-141 — Fix OG image letterboxing and og:title length (PR #107)

Rebuilt `og-image.png` using `logo-planet-only.png` (transparent background) composited on a full-bleed dark-navy gradient canvas with scattered stars and nebula blobs, eliminating the black letterbox bars that appeared in social share previews after IDT-109. Expanded `og:title`, `twitter:title`, and `<title>` from 21 characters ("Galactic Math Academy") to 55 characters ("Galactic Math — Space themed free math trainer for kids"), meeting the 30–60 character guideline for social validators.

### IDT-109 — Replace favicons and OG image with new branded logo (PR #136)

Replaced `favicon.ico`, `favicon-192.png`, and `og-image.png` with a new planet logo featuring the four math operation symbols (+, −, ×, ÷, =) arranged in a Saturn-ring design. The planet-only mark is used for all favicon sizes; the full wordmark version (logo + "GALACTIC MATH" text) is used for the Open Graph / Twitter Card share image. An `apple-touch-icon` link was added to `index.html` pointing to the 192×192 PNG so iOS home-screen bookmarks also use the new icon. Source PNGs are stored in `assets/images/`.

---

## 2026-04-15

### IDT-108 — Mobile support for Alien Invasion mode (PR #136)

Added full touch-device support for `pages/alien-invasion.html`. A virtual D-pad (four directional buttons, bottom-left) and a fire button (bottom-right) appear automatically on touch devices, wiring into the same `keys[]` state used by keyboard input so all existing physics and thrust audio remain unchanged. A pause button is also overlaid on-screen. Responsive CSS media queries (≤600px) shrink the HUD bar, question text, and answer input to fit small phone screens, and the end screen buttons stack vertically. The planet fact popup now dismisses on tap. Hint text in the how-to-play section, question overlay, and planet popup was updated to reference both keyboard and touch controls.

---

## 2026-04-14

### IDT-106 — Fix LinkedIn / social OG preview (PR #80)

Replaced the SVG `og-image` with a real PNG and added proper `favicon.ico` and `favicon-192.png` files so LinkedIn and other rich-link previewers could resolve the site icon and social card image. The `og:image:secure_url` tag was also updated to point to the PNG.

### IDT-105 — Low-fuel warning sound in Alien Invasion (PR #79)

Added an audio warning when the player's oxygen drops to 10% in Alien Invasion mode. A voice clip ("low fuel") plays, followed by rising-pitch tick sounds every second to create urgency. The warning re-triggers after an oxygen refuel pickup and a synthesized fallback plays if the clip fails to decode.

### IDT-104 — Alien Invasion UI/UX improvements (PR #81)

Post-launch polish pass on `pages/alien-invasion.html` based on initial playtesting feedback. Improvements include: adjusted planet proximity detection, an empty-missile click sound, icon and label fixes in the HUD, repositioned countdown overlay, missile handling edge cases, and updated planet fact copy.

---

## 2026-04-13 (4)

### IDT-102 — Block input after hyperspace timer completes (PR #136)

When the hyperspace countdown reached zero, a brief animation window before the results screen allowed players to sneak in one more answer. The fix disables the answer input and submit button immediately in `hyperspaceFailure()`, and guards `loadQuestion()` from re-enabling them once `hyperspaceHandled` is set. A ticking sound also plays each second for the final 10 seconds, rising in pitch as time runs out.

## 2026-04-13 (3)

### IDT-103 — Show "Skipped" instead of "null" for unanswered questions (PR #78)

Unanswered questions in the missed-problems review showed "You: null". The fix checks whether the recorded answer is null and displays "Skipped" instead, keeping the language friendly for kids.

## 2026-04-13 (2)

### IDT-101 — Alien Invasion game mode (PR #74)

New canvas-based game at `pages/alien-invasion.html`. The player pilots a detailed rocket ship (nose cone, swept fins, engine bell, porthole, animated flame) through 20 math gates in any order to reach home. Thrusting burns oxygen continuously; wrong answers cost an additional 5%. Three bonus rainbow gates require 3 correct answers each and refuel +10% O₂ on completion. Five lives are lost by colliding with drifting asteroids (screen shake + debris particles), alien UFO saucers (multi-layered explosion sound with boom, noise burst, and alien screech + colorful particle explosion), or comets that streak across the screen from random directions with glowing color trails. A pulsing directional arrow always points toward the nearest uncleaned gate when it is off-screen. Gates can be tackled in any order. A "Alien Invasion" tile in the main setup screen's Special Modes section passes current number and operator selections into the game as URL params.

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

Clicking the "GALACTIC MATH" header banner now navigates back to the setup screen from any screen. Previously the banner was non-interactive.

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
