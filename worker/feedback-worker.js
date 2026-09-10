// Secrets required in Cloudflare Worker settings:
//   GITHUB_TOKEN — GitHub personal access token with issues:write
// Bindings required in wrangler.toml:
//   [ai] binding = "AI" — Cloudflare Workers AI for title generation

const GITHUB_REPO = 'bmschimmel/galactic-math';
const ALLOWED_ORIGINS = [
  'https://galacticmath.app',               // production (custom domain)
  'https://galactic-math.pages.dev',       // Cloudflare Pages fallback
  /^https:\/\/[a-z0-9-]+\.galactic-math\.pages\.dev$/, // branch/preview deployments
];
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;

// In-memory rate limit store: IP → [timestamp, ...]
const rateLimitStore = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitStore.get(ip) || []).filter(t => t > cutoff);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  return false;
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.some(o => o instanceof RegExp ? o.test(origin) : o === origin);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ===== CATEGORY → GITHUB LABEL =====
const CATEGORY_LABELS = {
  bug:     'bug',
  feature: 'enhancement',
  other:   'feedback',
};

// ===== TITLE GENERATION =====
// Workers AI retires models on a rolling basis, and a retired model simply
// starts throwing — there is no advance warning at runtime. The model this
// worker used before (@cf/meta/llama-3.1-8b-instruct) was retired on
// 2026-05-30, after which every title silently fell back to raw message text.
//
// Two guards against a repeat, both cheap:
//   1. TITLE_MODELS is tried in order, so one retirement rolls over to the next
//      model automatically instead of dropping straight to the raw-text fallback.
//   2. When every model fails, reportModelOutage() files a GitHub issue, which
//      syncs into Linear triage. Keep the newest lightweight model at the top.
const TITLE_MODELS = [
  '@cf/meta/llama-3.2-3b-instruct', // primary — smallest and cheapest chat model
  '@cf/zai-org/glm-4.7-flash',      // fallback — Cloudflare's recommended replacement
];

function titlePrompt(message) {
  return `Write a short GitHub issue title (5\u20138 words, no quotes, no trailing punctuation) that summarizes this feedback from a child using an educational math game. Reply with only the title.\n\nFeedback: ${message}`;
}

// Returns { title, errors } — title is null when every model failed.
async function generateTitle(message, ai) {
  const errors = [];
  for (const model of TITLE_MODELS) {
    try {
      const result = await ai.run(model, {
        messages: [{ role: 'user', content: titlePrompt(message) }],
        max_tokens: 30,
      });
      const title = result?.response?.trim();
      if (title) {
        if (model !== TITLE_MODELS[0]) {
          console.warn(`Title model fallback in use: ${model}`);
        }
        return { title, errors };
      }
      errors.push({ model, error: 'empty response' });
      console.error(`Title model ${model} returned an empty response`);
    } catch (e) {
      errors.push({ model, error: e.message });
      console.error(`Title model ${model} failed: ${e.message}`);
    }
  }
  return { title: null, errors };
}

// ===== MODEL HEALTH REPORTING =====
// Files one GitHub issue when title generation is fully down. GitHub issues sync
// to Linear triage, so this is the whole notification path — no cron, no extra
// service. The open HEALTH_LABEL issue is the dedupe key: while one is open, no
// further reports are filed. Close it once TITLE_MODELS is updated.
const HEALTH_LABEL = 'worker-health';
const HEALTH_TITLE = 'Feedback worker: AI title generation is failing';

async function hasOpenHealthIssue(env) {
  const response = await githubRequest(
    `https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&labels=${HEALTH_LABEL}&per_page=1`,
    env,
  );
  if (!response.ok) return true; // can't confirm — stay quiet rather than spam
  const issues = await response.json();
  return issues.length > 0;
}

async function reportModelOutage(errors, env) {
  try {
    if (await hasOpenHealthIssue(env)) return;

    const failures = errors
      .map(e => `- \`${e.model}\` — ${String(e.error).slice(0, 200)}`)
      .join('\n');
    const body = [
      'Every model in `TITLE_MODELS` failed, so feedback issue titles are falling back',
      'to the first 50 characters of the message.',
      '',
      '**Failed models**',
      failures,
      '',
      'The usual cause is a retired model. Check the Workers AI model catalog',
      '(<https://developers.cloudflare.com/workers-ai/models/>), update `TITLE_MODELS`',
      'in `worker/feedback-worker.js`, redeploy, then close this issue — it is the',
      'dedupe key, so no further reports are filed while it stays open.',
    ].join('\n');

    const response = await githubRequest(`https://api.github.com/repos/${GITHUB_REPO}/issues`, env, {
      method: 'POST',
      body: JSON.stringify({ title: HEALTH_TITLE, body, labels: ['bug', HEALTH_LABEL] }),
    });
    if (!response.ok) {
      console.error('Failed to file model outage issue:', response.status, await response.text());
      return;
    }
    console.error('Filed model outage issue: title generation is down');
  } catch (e) {
    // Never let health reporting break a feedback submission.
    console.error('reportModelOutage exception:', e.message);
  }
}

// ===== GITHUB =====
function githubRequest(url, env, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'galactic-math-feedback-worker',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    // Rate limit by IP
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(ip)) {
      console.log(`Rate limited: ${ip}`);
      return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Honeypot check — bots fill hidden fields, humans leave them empty
    if (body.honeypot) {
      console.log(`Honeypot triggered from ${ip}`);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const { name, message, category } = body;
    if (!name || !message) {
      return new Response(JSON.stringify({ error: 'Missing name or message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return new Response(JSON.stringify({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Generate title via Workers AI, fall back to first 50 chars of message
    const { title: generatedTitle, errors: modelErrors } = await generateTitle(message, env.AI);
    const title = generatedTitle || `${message.slice(0, 50)}${message.length > 50 ? '…' : ''}`;

    const label = CATEGORY_LABELS[category] || 'feedback';
    const issueBody = `${message}\n\n--\n\n**Submitter**: ${name}`;

    const response = await githubRequest(`https://api.github.com/repos/${GITHUB_REPO}/issues`, env, {
      method: 'POST',
      body: JSON.stringify({ title, body: issueBody, labels: [label] }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('GitHub API error:', response.status, err);
      return new Response(JSON.stringify({ error: 'Failed to create issue' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const issue = await response.json();
    console.log(`Issue created: ${issue.html_url} from ${ip} (category: ${category}, title: ${title})`);

    // Title generation is fully down — file a health issue after responding.
    if (!generatedTitle) {
      ctx.waitUntil(reportModelOutage(modelErrors, env));
    }
    return new Response(JSON.stringify({ ok: true, url: issue.html_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
