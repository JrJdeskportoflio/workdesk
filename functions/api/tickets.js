/**
 * WorkDesk — /api/tickets
 * Cloudflare Pages Function
 *
 * GET    /api/tickets             — List support tickets (with optional ?status= filter)
 * POST   /api/tickets             — Create a new ticket
 * PUT    /api/tickets             — Update ticket status or assignment
 * DELETE /api/tickets?id=TKT-X   — Delete a ticket
 *
 * For production: use env.DB (D1) for persistence.
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

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);

  // ── GET — list tickets ────────────────────────────────────
  if (method === 'GET') {
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    // TODO:
    //   let query = 'SELECT * FROM tickets WHERE 1=1';
    //   const binds = [];
    //   if (status)   { query += ' AND status = ?';   binds.push(status); }
    //   if (priority) { query += ' AND priority = ?'; binds.push(priority); }
    //   query += ' ORDER BY created_at DESC';
    //   const { results } = await env.DB.prepare(query).bind(...binds).all();
    return json({ ok: true, tickets: [], message: 'Connect D1 database to enable server-side ticket data.' });
  }

  // ── POST — create ticket ──────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { subject, category, priority, description, submittedBy } = body || {};
    if (!subject || !category || !submittedBy) {
      return json({ ok: false, message: 'subject, category, and submittedBy are required.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO tickets (subject, category, priority, description, submitted_by, status, created_at) VALUES (?,?,?,?,?,?,?)'
    //   ).bind(subject, category, priority || 'Normal', description || '', submittedBy, 'Open', new Date().toISOString()).run();
    return json({ ok: true, message: 'Ticket created.' }, 201);
  }

  // ── PUT — update ticket ───────────────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { id, status, assignedTo } = body || {};
    if (!id) return json({ ok: false, message: 'Ticket ID required.' }, 400);
    // TODO:
    //   await env.DB.prepare('UPDATE tickets SET status = ?, assigned_to = ? WHERE id = ?')
    //     .bind(status || 'Open', assignedTo || null, id).run();
    return json({ ok: true, message: 'Ticket updated.' });
  }

  // ── DELETE — remove ticket ────────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Ticket ID required.' }, 400);
    // TODO: await env.DB.prepare('DELETE FROM tickets WHERE id = ?').bind(id).run();
    return json({ ok: true, message: 'Ticket deleted.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
