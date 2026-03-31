# Feedback System

The feedback system lets users (kids, parents, or teachers) submit bug reports and feature requests directly from the app. Submissions become GitHub issues automatically.

---

## Components

| File | Role |
|---|---|
| `pages/feedback.html` | The feedback form UI |
| `worker/feedback-worker.js` | Cloudflare Worker that processes submissions |
| `worker/wrangler.toml` | Cloudflare deployment config for the worker |

---

## Feedback Form (`pages/feedback.html`)

A standalone page (not part of `index.html`) linked from the footer. It shares the same visual design as the main game.

### Fields

- **Name** — required; included in the GitHub issue body
- **Category** — picker with three options:
  - Bug — creates a `bug` label on GitHub
  - Feature Request — creates an `enhancement` label
  - Other — creates a `feedback` label
- **Message** — required; the main feedback text

### Submission flow

On submit, the form sends a `POST` request to the Cloudflare Worker endpoint with JSON:

```json
{
  "name": "...",
  "category": "bug|feature|other",
  "message": "...",
  "honeypot": ""
}
```

The `honeypot` field is a hidden input visible only to bots. Legitimate human submissions leave it empty.

### View existing issues

A footer link on the feedback page opens the GitHub issues page so users can check if their issue has already been reported.

---

## Cloudflare Worker (`worker/feedback-worker.js`)

A lightweight edge function that sits between the feedback form and GitHub.

### Processing steps

1. **CORS preflight** — handles `OPTIONS` requests for cross-origin form submission
2. **Rate limiting** — max 3 submissions per IP per 10 minutes (in-memory store; resets on worker restart)
3. **Honeypot check** — silently returns `200 OK` if the hidden honeypot field is filled
4. **Validation** — requires both `name` and `message` fields
5. **Title generation** — calls Cloudflare Workers AI (`@cf/meta/llama-3.1-8b-instruct`) to generate a concise 5–8 word GitHub issue title from the feedback message. Falls back to the first 50 characters of the message if AI fails.
6. **GitHub issue creation** — POSTs to the GitHub REST API to create the issue with the generated title, category label, and body (`message + submitter name`)
7. **Observability** — all key events (rate limits, honeypot triggers, issue creation) are logged via Cloudflare Workers observability

### Secrets / Bindings required

| Name | Type | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | Secret | GitHub personal access token with `issues:write` scope |
| `AI` | AI binding | Cloudflare Workers AI for title generation |

---

## Workflow Page (`pages/workflow.html`)

A separate informational page (linked from the footer) that explains the development workflow — how issues flow from user feedback through Linear to a merged PR. Not part of the core game; intended for contributors and curious users.
