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
| Beacon `<script>` tag (`"spa": true`) | `<head>` of `index.html` and every page under `pages/` (`alien-invasion`, `feedback`, `workflow`, `release-notes`) |
| `markPath()` / `classicModePath()` | `assets/js/game.js`, `// ===== ANALYTICS PATHS =====`; called from `startQuiz()` and `newMission()` |
| `markLaunchPath()` | `pages/alien-invasion.html`, `// ===== ANALYTICS PATH =====`; called from `initGame()` |
| CSP allow-list | `_headers` — `static.cloudflareinsights.com` in `script-src`, `cloudflareinsights.com` in `connect-src` |
| Real-load fallback | `_redirects` — `/classic/*` and `/alien/*` 301 to `/` |

`markPath()` is a no-op when the page is opened over `file://`, so local testing is unaffected.

## Relative URLs while a virtual path is active

A virtual path changes the document's base URL, so a relative link like `pages/feedback.html` would resolve to `/classic/kessel/pages/feedback.html`. Both pages pin their links to absolute URLs on load (`a.href = a.href`), and `pages/alien-invasion.html` resolves its audio clip URL and home URL up front for the same reason. Anything that still slips through lands on `/` via `_redirects` rather than a 404.

## The Cloudflare side

Plain pages (`feedback`, `workflow`, `release-notes`) carry the same tag and show up under **Paths** as ordinary page views of `/pages/<name>.html`.

The Web Analytics site for `galacticmath.app` lives in the Cloudflare dashboard under **Analytics & Logs → Web Analytics**. Its token (`c4e72870bf94459abffc8adfc8247408`) is in both beacon tags. The token is not a secret — it is visible in page source on every site that uses Web Analytics — so it lives in the repo.

The site must stay on **Enable with JS Snippet installation** (Manage site → RUM). The other "Enable" options inject Cloudflare's own beacon at the edge; that copy has no SPA flag, so it would miss the mode paths, and it would double-count alongside ours. Before this was set, the auto-injected beacon was also being blocked by the CSP in `_headers`, which is why the site showed zero views for months.

To confirm it is working: launch a Kessel Run on the live site and check DevTools → Network for a request to `cloudflareinsights.com/cdn-cgi/rum` after the URL changes to `/classic/kessel/`; the path appears under **Paths** in the dashboard a few minutes later. If the swaps never show up, the beacon may only hook `pushState`; change `markPath()` and `markLaunchPath()` from `replaceState` to `pushState`.

## What it does not tell you

Completions, scores, time spent, or which numbers and operations were chosen. Those would need custom events, which this deliberately avoids.
