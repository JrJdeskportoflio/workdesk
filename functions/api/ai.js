/**
 * WorkDesk — /api/ai
 * Cloudflare Pages Function
 *
 * POST /api/ai            — Send a prompt to the AI assistant and receive a response
 * GET  /api/ai/history    — Get recent AI conversation history (per user session)
 *
 * For production:
 *   - Use Cloudflare Workers AI (env.AI) for inference on-edge.
 *   - Or proxy to an external LLM API (OpenAI, Anthropic) using secrets.
 *   - Store conversation history in env.DB (D1) or env.SESSIONS (KV).
 *
 * To enable Cloudflare Workers AI, add to wrangler.toml:
 *   [ai]
 *   binding = "AI"
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const path = url.pathname;

  // ── GET /api/ai/history ───────────────────────────────────
  if (method === 'GET' && path.endsWith('/history')) {
    // TODO:
    //   const history = await env.SESSIONS.get('ai_history:' + token, { type: 'json' });
    return json({ ok: true, history: [], message: 'Connect KV / D1 to enable conversation history.' });
  }

  // ── POST /api/ai — chat prompt ────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { message, context: userContext } = body || {};
    if (!message || !message.trim()) {
      return json({ ok: false, message: 'message is required.' }, 400);
    }

    // ── Option A: Cloudflare Workers AI ───────────────────
    // if (env.AI) {
    //   const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    //     messages: [
    //       { role: 'system', content: 'You are WorkDesk AI, an HR assistant. Answer concisely.' },
    //       { role: 'user',   content: message }
    //     ]
    //   });
    //   return json({ ok: true, reply: response.response });
    // }

    // ── Option B: Proxy to external LLM ───────────────────
    // const apiKey = env.OPENAI_API_KEY;
    // if (apiKey) {
    //   const res = await fetch('https://api.openai.com/v1/chat/completions', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    //     body: JSON.stringify({ model: 'gpt-4o-mini', messages: [
    //       { role: 'system', content: 'You are WorkDesk AI, an HR assistant.' },
    //       { role: 'user', content: message }
    //     ]})
    //   });
    //   const data = await res.json();
    //   return json({ ok: true, reply: data.choices[0].message.content });
    // }

    // ── Demo fallback (no AI binding configured) ──────────
    return json({
      ok: true,
      reply: 'WorkDesk AI is ready. To enable full AI capabilities, configure Cloudflare Workers AI (env.AI) or set OPENAI_API_KEY via `wrangler secret put OPENAI_API_KEY`.',
      demo: true,
    });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
