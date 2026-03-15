/**
 * WorkDesk — /api/performance
 * Cloudflare Pages Function
 *
 * GET  /api/performance           — List performance reviews
 * POST /api/performance           — Create a performance review
 * PUT  /api/performance           — Update a review
 *
 * For production: use env.DB (D1) for persistence.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

  // ── GET — list reviews ────────────────────────────────────
  if (method === 'GET') {
    const empId = url.searchParams.get('empId');
    const period = url.searchParams.get('period');
    // TODO:
    //   let query = 'SELECT * FROM performance_reviews WHERE 1=1';
    //   const binds = [];
    //   if (empId) { query += ' AND employee_id = ?'; binds.push(empId); }
    //   if (period) { query += ' AND period = ?'; binds.push(period); }
    //   query += ' ORDER BY created_at DESC';
    //   const { results } = await env.DB.prepare(query).bind(...binds).all();
    return json({ ok: true, reviews: [], message: 'Connect D1 database to enable server-side performance data.' });
  }

  // ── POST — create review ──────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { empId, period, score, comments, goals } = body || {};
    if (!empId || !period || score === undefined) {
      return json({ ok: false, message: 'empId, period, and score are required.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO performance_reviews (employee_id, period, score, comments, goals, created_at) VALUES (?,?,?,?,?,?)'
    //   ).bind(empId, period, score, comments || '', JSON.stringify(goals || []), new Date().toISOString()).run();
    return json({ ok: true, message: 'Performance review created.' }, 201);
  }

  // ── PUT — update review ───────────────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { id } = body || {};
    if (!id) return json({ ok: false, message: 'Review ID required.' }, 400);
    // TODO: await env.DB.prepare('UPDATE performance_reviews SET ... WHERE id = ?').bind(..., id).run();
    return json({ ok: true, message: 'Performance review updated.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
