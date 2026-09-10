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
5. **Title generation** — calls Cloudflare Workers AI to generate a concise 5–8 word GitHub issue title from the feedback message. Tries each model in `TITLE_MODELS` in order and uses the first one that answers. Falls back to the first 50 characters of the message if every model fails. See [Model rollover and health](#model-rollover-and-health).
6. **GitHub issue creation** — POSTs to the GitHub REST API to create the issue with the generated title, category label, and body (`message + submitter name`)
7. **Health reporting** — if every title model failed, the worker files a GitHub issue describing the outage (after the response is sent, via `ctx.waitUntil`)
8. **Observability** — all key events (rate limits, honeypot triggers, issue creation, model failures) are logged via Cloudflare Workers observability

### Model rollover and health

Workers AI retires models on a rolling basis, and a retired model gives no advance
warning at runtime — the `ai.run()` call simply starts throwing. The worker originally
used `@cf/meta/llama-3.1-8b-instruct`, which Cloudflare retired on **2026-05-30**. Because
the only failure handling was a silent fall back to raw message text, every feedback
issue filed after that date got a truncated-message title instead of a generated one,
and nobody noticed until the titles were being renamed by hand in triage.

Two mechanisms guard against a repeat. Both live in `feedback-worker.js`; there is no
cron job, no extra service, and no scheduled deprecation check.

**1. Model chain.** `TITLE_MODELS` is an ordered list. The worker tries each in turn and
uses the first that returns a title, so one model's retirement rolls over to the next
automatically instead of dropping straight to the raw-text fallback.

| Model | Role | Input / output per M tokens |
|---|---|---|
| `@cf/meta/llama-3.2-3b-instruct` | Primary — smallest and cheapest chat model, ample for an 8-word title | $0.051 / $0.34 |
| `@cf/zai-org/glm-4.7-flash` | Fallback — one of Cloudflare's named replacements for the retired Llama 3.x models | $0.06 / $0.40 |

Keep the newest lightweight model at the top of the list.

**Both models run inside the Workers AI free allocation** — 10,000 neurons per day at no
charge, on the Free and Paid plans alike. The dollar figures above are the overage rates
that apply only after that allocation is spent. A title call costs roughly 1 neuron
(~120 input, ~15 output tokens), so the allocation covers on the order of 9,000 titles a
day; feedback is rate limited to 3 per IP per 10 minutes, so this is not a constraint in
practice. The retired Llama 3.1 8B cost about 4 neurons per call, so the current primary
is roughly 4x cheaper.

**When picking a replacement, check that it does not require a paid billing method.** A
few models do — at the time of writing `@cf/moonshotai/kimi-k2.6`, `kimi-k2.7-code`,
`@cf/zai-org/glm-5.2`, `glm-5.3`, `glm-5.3-flash`, and the DeepSeek v4 models. The list
lives on the [Workers AI pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/).
Note that `kimi-k2.6` is one of the three models Cloudflare named as a replacement for
the retired Llama 3.x line, so a recommended model is not automatically a free one.

Cloudflare changed how pricing is *presented* on 2026-08-28 — per-model unit pricing in
tokens rather than neurons — but billing is still in neurons and the free allocation is
unchanged. Model pages now lead with a dollars-per-million-tokens figure, which makes
every model look billable at a glance; it is the overage rate.

**2. Outage reporting.** When *every* model in the chain fails, `reportModelOutage()`
files a GitHub issue labelled `bug` and `worker-health` naming the failed models and
their errors. Since GitHub issues sync into Linear triage, that issue becomes a Linear
ticket automatically — no separate Linear integration in the worker.

The open `worker-health` issue is also the dedupe key: while one is open, no further
outage issues are filed, so a sustained outage produces one ticket rather than one per
submission. **Close the issue once `TITLE_MODELS` has been updated and redeployed**,
otherwise the next outage will go unreported. If the dedupe lookup itself fails, the
worker stays quiet rather than risking a flood.

Reporting runs in `ctx.waitUntil()` after the response is sent and is wrapped in its own
`try`/`catch`, so a health-reporting problem can never break or slow a feedback
submission.

### Secrets / Bindings required

| Name | Type | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | Secret | GitHub personal access token with `issues:write` scope |
| `AI` | AI binding | Cloudflare Workers AI for title generation |

---

## Feedback Page Audio (IDT-134)

The "📡 TRANSMIT FEEDBACK" submit button plays a themed transmission sound on click. The sound is synthesized via a self-contained Web Audio engine inlined directly in `pages/feedback.html` (the page does not load `game.js`). The effect is an ascending radio-chirp sweep followed by two short confirmation beeps, mimicking a signal being beamed out.

---

## Workflow Page (`pages/workflow.html`)

A separate informational page (linked from the footer) that explains the development workflow — how issues flow from user feedback through Linear to a merged PR. Not part of the core game; intended for contributors and curious users.
