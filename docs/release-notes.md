# Release Notes Page

`pages/release-notes.html` shows GitHub release notes and recent merged pull requests inside the app, so a parent, teacher, or curious kid can see what changed without leaving the site.

---

## Components

| File | Role |
|---|---|
| `pages/release-notes.html` | The release notes page — self-contained, no `game.js`/`style.css` |
| `index.html` footer | A "📜 Release Notes" link (unfiltered) plus the `v2.0.0` link that opens this page filtered to that release |

---

## Layout

The page is two panels in a `.panels-wrap` grid — a 1fr/2fr split, so Releases gets twice the width of Recent Changes — stacking to one column under 720px (same breakpoint pattern as `pages/workflow.html`):

- **Left (1/3) — Recent Changes**: the merged-PR list, each row tagged with the release it shipped in.
- **Right (2/3) — Releases**: one collapsible row per release, given the extra width since release bodies run long.

Each release row is a `<button class="release-toggle">` header (version badge, date, chevron) plus a `.release-body` that starts `hidden`; clicking the header calls `toggleRelease()`, which flips `aria-expanded`, the `hidden` attribute, and an `.expanded` class that rotates the chevron. Rows are collapsed by default.

Each Recent Changes row also carries a `.pr-release` badge — the release `tag_name` if the PR shipped in one, or "Unreleased" if it merged after the last tag. `buildPRReleaseMap()` gets this for free from data already on the page: every release body's auto-generated "What's Changed" list links each PR by number, so the page scans those bodies for `/pull/(\d+)` once and looks up each PR's number in the result, rather than making a request per PR.

---

## Data source

The page has no server of its own and the repo has no build step, so it calls the public GitHub REST API directly from the browser on load:

- `GET https://api.github.com/repos/bmschimmel/galactic-math/releases` — every published release, newest first
- `GET https://api.github.com/repos/bmschimmel/galactic-math/pulls?state=closed&sort=updated&direction=desc&per_page=30` — recently closed PRs, filtered client-side to `merged_at != null` and capped at 15

Both are unauthenticated, public, CORS-enabled endpoints — no token, no rate-limit handling beyond a friendly failure state. If either request fails (offline, GitHub down, IP rate-limited), the page shows a "couldn't reach GitHub" message with a direct link to the GitHub releases page instead of a blank screen.

`https://api.github.com` had to be added to `connect-src` in `_headers` for this to work — see `docs/overview.md`.

---

## Rendering release bodies safely

GitHub release bodies are Markdown (with the occasional raw `<img>` tag for screenshots) coming from an external API call, so the page never uses `innerHTML` on unescaped API content. `mdToHtml()` in the page's inline script:

1. Strips any raw HTML tags outright (screenshots are dropped rather than rendered).
2. HTML-escapes everything that's left.
3. Re-introduces only `<h3>`/`<h4>` (`##`/`###`), `<strong>` (`**text**`), `<ul>`/`<li>` (`-`/`*` bullets), `<p>` (paragraphs), and `<a>` for both `[text](https://...)` links and bare `https://...` URLs — each built from the already-escaped text, so nothing from the API can inject a tag the page didn't write itself. GitHub's auto-generated "What's Changed" list uses bare PR URLs rather than markdown links, so a bare URL is linkified too; one matching `github.com/OWNER/REPO/pull/N` is shown as `#N` instead of the full URL.

This is intentionally a small subset of Markdown, not a general-purpose parser — just enough to render this repo's own release notes cleanly.

---

## Filtering to one release (`?version=`)

The footer version link doesn't hardcode a query string. `game.js` reads the version straight from the link's own visible text (`v2.0.0` → `2.0.0`) and builds `pages/release-notes.html?version=2.0.0` at load time, so the version string still lives in exactly one place per `CONTRIBUTING.md`'s release process — bumping the footer text is enough.

On `release-notes.html`, that `version` param is compared (case-insensitively, ignoring a leading `v`) against each release's `tag_name`. A match renders that row already expanded with a `.highlight` glow, and the page scrolls to it with `scrollIntoView()`; every other release stays collapsed. The "📜 Release Notes" footer link carries no `version` param, so it opens the page with every release collapsed.
