/**
 * WorkDesk — /api/knowledge
 * Cloudflare Pages Function
 *
 * GET    /api/knowledge           — List knowledge base articles (with optional ?category= / ?search= filter)
 * POST   /api/knowledge           — Create a new article
 * PUT    /api/knowledge           — Update an article
 * DELETE /api/knowledge?id=KB-X  — Delete an article
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

  // ── GET — list articles ───────────────────────────────────
  if (method === 'GET') {
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    // TODO:
    //   let query = 'SELECT * FROM knowledge_articles WHERE 1=1';
    //   const binds = [];
    //   if (category) { query += ' AND category = ?'; binds.push(category); }
    //   if (search)   { query += ' AND (title LIKE ? OR content LIKE ?)'; binds.push('%'+search+'%', '%'+search+'%'); }
    //   query += ' ORDER BY updated_at DESC';
    //   const { results } = await env.DB.prepare(query).bind(...binds).all();
    return json({ ok: true, articles: [], message: 'Connect D1 database to enable server-side knowledge base data.' });
  }

  // ── POST — create article ─────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { title, category, content, tags, authorName } = body || {};
    if (!title || !category || !content) {
      return json({ ok: false, message: 'title, category, and content are required.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO knowledge_articles (title, category, content, tags, author_token, author_name, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)'
    //   ).bind(title, category, content, JSON.stringify(tags || []), token, authorName || '', new Date().toISOString(), new Date().toISOString()).run();
    return json({ ok: true, message: 'Article created.' }, 201);
  }

  // ── PUT — update article ──────────────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { id } = body || {};
    if (!id) return json({ ok: false, message: 'Article ID required.' }, 400);
    // TODO: await env.DB.prepare('UPDATE knowledge_articles SET ... WHERE id = ?').bind(..., id).run();
    return json({ ok: true, message: 'Article updated.' });
  }

  // ── DELETE — remove article ───────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Article ID required.' }, 400);
    // TODO: await env.DB.prepare('DELETE FROM knowledge_articles WHERE id = ?').bind(id).run();
    return json({ ok: true, message: 'Article deleted.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
