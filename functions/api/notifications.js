/**
 * WorkDesk — /api/notifications
 * Cloudflare Pages Function
 *
 * GET    /api/notifications           — List notifications for the authenticated user
 * POST   /api/notifications           — Create a new notification
 * PATCH  /api/notifications?id=N-X    — Mark a notification as read
 * DELETE /api/notifications?id=N-X    — Delete a notification
 *
 * For production: use env.DB (D1) for persistence.
 * D1 schema:
 *   CREATE TABLE notifications (
 *     id TEXT PRIMARY KEY,
 *     user_token TEXT NOT NULL,
 *     type TEXT NOT NULL,
 *     text TEXT NOT NULL,
 *     href TEXT DEFAULT '#',
 *     unread INTEGER DEFAULT 1,
 *     created_at TEXT NOT NULL
 *   );
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

  // ── GET — list notifications ──────────────────────────────
  if (method === 'GET') {
    // TODO: Connect D1 — uncomment when database is ready
    // const { results } = await env.DB
    //   .prepare('SELECT * FROM notifications WHERE user_token = ? ORDER BY created_at DESC LIMIT 50')
    //   .bind(token).all();
    // return json({ ok: true, notifications: results });
    return json({ ok: true, notifications: [], message: 'Connect D1 database to enable server-side notifications.' });
  }

  // ── POST — create notification ────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { type, text, href } = body || {};
    if (!type || !text) {
      return json({ ok: false, message: 'type and text are required.' }, 400);
    }
    const id = 'n-' + Date.now();
    // TODO: Connect D1 — uncomment when database is ready
    // await env.DB.prepare(
    //   'INSERT INTO notifications (id, user_token, type, text, href, unread, created_at) VALUES (?,?,?,?,?,1,?)'
    // ).bind(id, token, type, text, href || '#', new Date().toISOString()).run();
    return json({ ok: true, id, message: 'Notification created.' }, 201);
  }

  // ── PATCH — mark as read ──────────────────────────────────
  if (method === 'PATCH') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Notification ID required.' }, 400);
    // TODO: Connect D1 — uncomment when database is ready
    // await env.DB.prepare('UPDATE notifications SET unread = 0 WHERE id = ? AND user_token = ?')
    //   .bind(id, token).run();
    return json({ ok: true, message: 'Notification marked as read.' });
  }

  // ── DELETE — remove notification ──────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Notification ID required.' }, 400);
    // TODO: Connect D1 — uncomment when database is ready
    // await env.DB.prepare('DELETE FROM notifications WHERE id = ? AND user_token = ?')
    //   .bind(id, token).run();
    return json({ ok: true, message: 'Notification deleted.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
