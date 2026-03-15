/**
 * WorkDesk — /api/integrations
 * Cloudflare Pages Function
 *
 * GET  /api/integrations          — List configured integrations
 * POST /api/integrations          — Enable / configure an integration
 * PUT  /api/integrations          — Update integration settings
 * DELETE /api/integrations?id=X  — Disable an integration
 *
 * For production: use env.DB (D1) for config persistence.
 * Store any API keys / secrets via `wrangler secret put`.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: CORS });
}

// Supported integration types
const SUPPORTED = ['slack', 'google_workspace', 'zoom', 'github', 'jira', 'xero', 'quickbooks', 'zapier', 'webhook'];

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);

  // ── GET — list integrations ───────────────────────────────
  if (method === 'GET') {
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT id, type, label, status, connected_at FROM integrations ORDER BY label')
    //     .all();
    return json({ ok: true, integrations: [], supported: SUPPORTED, message: 'Connect D1 database to enable server-side integration config.' });
  }

  // ── POST — enable integration ─────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { type, label, config } = body || {};
    if (!type || !SUPPORTED.includes(type)) {
      return json({ ok: false, message: 'Integration type must be one of: ' + SUPPORTED.join(', ') + '.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO integrations (type, label, config, status, connected_at) VALUES (?,?,?,?,?)'
    //   ).bind(type, label || type, JSON.stringify(config || {}), 'active', new Date().toISOString()).run();
    return json({ ok: true, message: 'Integration enabled.' }, 201);
  }

  // ── PUT — update integration ──────────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { id } = body || {};
    if (!id) return json({ ok: false, message: 'Integration ID required.' }, 400);
    // TODO: await env.DB.prepare('UPDATE integrations SET ... WHERE id = ?').bind(..., id).run();
    return json({ ok: true, message: 'Integration updated.' });
  }

  // ── DELETE — disable integration ─────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Integration ID required.' }, 400);
    // TODO: await env.DB.prepare('DELETE FROM integrations WHERE id = ?').bind(id).run();
    return json({ ok: true, message: 'Integration disabled.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
