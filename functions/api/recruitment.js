/**
 * WorkDesk — /api/recruitment
 * Cloudflare Pages Function
 *
 * GET    /api/recruitment              — List job postings / applicants
 * POST   /api/recruitment              — Create a job posting
 * PUT    /api/recruitment              — Update posting or applicant status
 * DELETE /api/recruitment?id=JOB-X    — Archive a job posting
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

  // ── GET — list postings ───────────────────────────────────
  if (method === 'GET') {
    const type = url.searchParams.get('type') || 'postings'; // 'postings' | 'applicants'
    // TODO:
    //   if (type === 'applicants') {
    //     const { results } = await env.DB.prepare('SELECT * FROM applicants ORDER BY applied_date DESC').all();
    //     return json({ ok: true, applicants: results });
    //   }
    //   const { results } = await env.DB.prepare('SELECT * FROM job_postings ORDER BY posted_date DESC').all();
    return json({ ok: true, postings: [], applicants: [], message: 'Connect D1 database to enable server-side recruitment data.' });
  }

  // ── POST — create posting ─────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { title, dept, type, location, salary, description } = body || {};
    if (!title || !dept || !type) {
      return json({ ok: false, message: 'title, dept, and type are required.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO job_postings (title, dept, type, location, salary, description, status, posted_date) VALUES (?,?,?,?,?,?,?,?)'
    //   ).bind(title, dept, type, location || '', salary || '', description || '', 'Open', new Date().toISOString().slice(0, 10)).run();
    return json({ ok: true, message: 'Job posting created.' }, 201);
  }

  // ── PUT — update posting / applicant ─────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { id } = body || {};
    if (!id) return json({ ok: false, message: 'ID required.' }, 400);
    // TODO: await env.DB.prepare('UPDATE job_postings SET ... WHERE id = ?').bind(..., id).run();
    return json({ ok: true, message: 'Record updated.' });
  }

  // ── DELETE — archive posting ──────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Posting ID required.' }, 400);
    // TODO: await env.DB.prepare('UPDATE job_postings SET status = ? WHERE id = ?').bind('Closed', id).run();
    return json({ ok: true, message: 'Job posting archived.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
