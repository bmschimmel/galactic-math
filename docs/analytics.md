# Analytics

Galactic Math uses [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) to count how many times each game mode is launched. It is cookieless, does not fingerprint visitors, and stores nothing in the browser, so it fits the project's no-cookies / no-localStorage rule.

---

## The problem it solves

Standard, Hyperspace and Kessel Run all run inside `index.html` without navigating, and Alien Invasion only differs from a plain visit by its query string. Ordinary page-view analytics therefore see one path (`/`) for everything and cannot tell the modes apart.

## How it works

When a mode launches, the game swaps the visible URL for a **virtual path** with `history.replaceState()`. Nothing navigates and no request is made; only the address bar changes. The Cloudflare beacon runs in SPA mode, treats each swap as a page view, and the dashboard's **Paths** panel becomes a per-mode launch count.

| Launch from the flight deck | Virtual path |
|---|---|
| Standard | `/classic/standard/` |
| Hyperspace | `/classic/hyperspace/wicked-easy/` · `/classic/hyperspace/harder/` · `/classic/hyperspace/hyperdrive/` |
| Kessel Run | `/classic/kessel/` |
| Alien Invasion | `/alien/recon/` · `/alien/invasion/` · `/alien/chaos/` |

**New Mission** swaps the URL back to `/`. Retry and Restart stay on the current mode path and do not fire a new page view, so the numbers are *launches from the flight deck*, not games played.

## Where the code lives

| Piece | Location |
|---|---|
| Beacon `<script>` tag (`"spa": true`) | `<head>` of `index.html` and `pages/alien-invasion.html` |
| `markPath()` / `classicModePath()` | `assets/js/game.js`, `// ===== ANALYTICS PATHS =====`; called from `startQuiz()` and `newMission()` |
| `markLaunchPath()` | `pages/alien-invasion.html`, `// ===== ANALYTICS PATH =====`; called from `initGame()` |
| CSP allow-list | `_headers` — `static.cloudflareinsights.com` in `script-src`, `cloudflareinsights.com` in `connect-src` |
| Real-load fallback | `_redirects` — `/classic/*` and `/alien/*` 301 to `/` |

`markPath()` is a no-op when the page is opened over `file://`, so local testing is unaffected.

## Relative URLs while a virtual path is active

A virtual path changes the document's base URL, so a relative link like `pages/feedback.html` would resolve to `/classic/kessel/pages/feedback.html`. Both pages pin their links to absolute URLs on load (`a.href = a.href`), and `pages/alien-invasion.html` resolves its audio clip URL and home URL up front for the same reason. Anything that still slips through lands on `/` via `_redirects` rather than a 404.

## Setting up the Cloudflare side

The repo ships with `CF_BEACON_TOKEN_PLACEHOLDER` in both beacon tags. The token is not a secret (it is visible in page source on every site that uses Web Analytics), so it lives in the repo once issued.

1. Cloudflare dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**, hostname `galacticmath.app`.
2. Turn **off** "Automatic setup". That option injects Cloudflare's own beacon at the edge without the SPA flag and would double-count alongside ours.
3. Copy the `token` from the snippet Cloudflare shows and replace the placeholder in `index.html` and `pages/alien-invasion.html`.
4. After deploy, launch a Kessel Run on the live site and confirm in DevTools → Network that a request to `cloudflareinsights.com/cdn-cgi/rum` fires after the URL changes to `/classic/kessel/`.
5. If the swaps never show up under **Paths**, the beacon may only hook `pushState`; change `markPath()` and `markLaunchPath()` from `replaceState` to `pushState`.

## What it does not tell you

Completions, scores, time spent, or which numbers and operations were chosen. Those would need custom events, which this deliberately avoids.
