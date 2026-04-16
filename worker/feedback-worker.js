// Secrets required in Cloudflare Worker settings:
//   GITHUB_TOKEN — GitHub personal access token with issues:write
// Bindings required in wrangler.toml:
//   [ai] binding = "AI" — Cloudflare Workers AI for title generation

const GITHUB_REPO = 'bmschimmel/galactic-math';
const ALLOWED_ORIGINS = [
  'https://galactic-math.pages.dev',       // production
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
async function generateTitle(message, ai) {
  try {
    const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{
        role: 'user',
        content: `Write a short GitHub issue title (5–8 words, no quotes, no trailing punctuation) that summarizes this feedback from a child using an educational math game. Reply with only the title.\n\nFeedback: ${message}`,
      }],
      max_tokens: 30,
    });
    return result?.response?.trim() || null;
  } catch (e) {
    console.error('generateTitle exception:', e.message);
    return null;
  }
}

export default {
  async fetch(request, env) {
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

    // Generate title via Claude, fall back to first 50 chars of message
    const generatedTitle = await generateTitle(message, env.AI);
    const title = generatedTitle || `${message.slice(0, 50)}${message.length > 50 ? '…' : ''}`;

    const label = CATEGORY_LABELS[category] || 'feedback';
    const issueBody = `${message}\n\n--\n\n**Submitter**: ${name}`;

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'galactic-math-feedback-worker',
      },
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
    return new Response(JSON.stringify({ ok: true, url: issue.html_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  },
};
