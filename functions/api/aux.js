/**
 * WorkDesk — /api/aux
 * Cloudflare Pages Function
 *
 * GET  /api/aux              — Retrieve AUX log for the authenticated user
 * POST /api/aux              — Record an AUX status change (with time tracking)
 * POST /api/aux/clock-in     — Clock in (sets status to online, starts work session)
 * POST /api/aux/clock-out    — Clock out (sets status to offline, ends work session)
 *
 * For production: use env.DB (D1) for persistence.
 * D1 schema:
 *   CREATE TABLE aux_log (
 *     id INTEGER PRIMARY KEY AUTOINCREMENT,
 *     employee_token TEXT NOT NULL,
 *     employee_name TEXT,
 *     status TEXT NOT NULL,
 *     start_time TEXT NOT NULL,
 *     end_time TEXT,
 *     duration_seconds INTEGER,
 *     created_at TEXT NOT NULL
 *   );
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
  const method  = request.method.toUpperCase();
  const url     = new URL(request.url);
  const path    = url.pathname;

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  // ── GET — retrieve AUX log ────────────────────────────────
  if (method === 'GET') {
    const date = url.searchParams.get('date');
    // TODO: Connect D1 — uncomment when database is ready
    // const { results } = await env.DB
    //   .prepare('SELECT * FROM aux_log WHERE employee_token = ? AND DATE(start_time) = ? ORDER BY start_time DESC')
    //   .bind(token, date || new Date().toISOString().slice(0, 10)).all();
    // return json({ ok: true, log: results });
    return json({ ok: true, log: [], message: 'Connect D1 database to enable server-side AUX tracking.' });
  }

  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }

    // ── Clock In ──────────────────────────────────────────
    if (path.endsWith('/clock-in')) {
      const { time, date, employee } = body || {};
      const now = new Date().toISOString();
      // TODO: Connect D1 — uncomment when database is ready
      // await env.DB.prepare(
      //   'INSERT INTO aux_log (employee_token, employee_name, status, start_time, created_at) VALUES (?,?,?,?,?)'
      // ).bind(token, employee || 'Unknown', 'online', now, now).run();
      return json({ ok: true, message: 'Clocked in at ' + (time || now) + '.' }, 201);
    }

    // ── Clock Out ─────────────────────────────────────────
    if (path.endsWith('/clock-out')) {
      const { time, employee } = body || {};
      const now = new Date().toISOString();
      // TODO: Connect D1 — uncomment when database is ready
      // const last = await env.DB
      //   .prepare('SELECT id, start_time FROM aux_log WHERE employee_token = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1')
      //   .bind(token).first();
      // if (last) {
      //   const dur = Math.floor((new Date(now) - new Date(last.start_time)) / 1000);
      //   await env.DB.prepare('UPDATE aux_log SET status = ?, end_time = ?, duration_seconds = ? WHERE id = ?')
      //     .bind('offline', now, dur, last.id).run();
      // }
      return json({ ok: true, message: 'Clocked out at ' + (time || now) + '.' });
    }

    // ── Record status change ──────────────────────────────
    const { status, startTime, employee } = body || {};
    if (!status) return json({ ok: false, message: 'status is required.' }, 400);
    const now = new Date().toISOString();
    // TODO: Connect D1 — uncomment when database is ready
    // Close previous open entry
    // await env.DB.prepare(
    //   'UPDATE aux_log SET end_time = ?, duration_seconds = CAST((julianday(?) - julianday(start_time)) * 86400 AS INTEGER) WHERE employee_token = ? AND end_time IS NULL'
    // ).bind(now, now, token).run();
    // Insert new entry
    // await env.DB.prepare(
    //   'INSERT INTO aux_log (employee_token, employee_name, status, start_time, created_at) VALUES (?,?,?,?,?)'
    // ).bind(token, employee || 'Unknown', status, startTime || now, now).run();
    return json({ ok: true, message: 'AUX status ' + status + ' recorded.' }, 201);
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
