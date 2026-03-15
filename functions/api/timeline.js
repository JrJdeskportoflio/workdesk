/**
 * WorkDesk — /api/timeline
 * Cloudflare Pages Function
 *
 * GET    /api/timeline            — List timeline posts (paginated)
 * POST   /api/timeline            — Create a new post (leaders only)
 * POST   /api/timeline/react      — Add/toggle a reaction on a post
 * POST   /api/timeline/comments   — Add a comment to a post
 * DELETE /api/timeline?id=POST-X  — Delete a post (leaders only)
 *
 * For production: use env.DB (D1) for persistence.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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

  // ── GET — list posts ──────────────────────────────────────
  if (method === 'GET') {
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT * FROM timeline_posts ORDER BY created_at DESC LIMIT ? OFFSET ?')
    //     .bind(limit, offset).all();
    return json({ ok: true, posts: [], page, message: 'Connect D1 database to enable server-side timeline posts.' });
  }

  // ── POST ──────────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }

    if (path.endsWith('/react')) {
      const { postId, emoji } = body || {};
      if (!postId || !emoji) return json({ ok: false, message: 'postId and emoji are required.' }, 400);
      // TODO:
      //   const existing = await env.DB
      //     .prepare('SELECT id FROM timeline_reactions WHERE post_id = ? AND user_token = ? AND emoji = ?')
      //     .bind(postId, token, emoji).first();
      //   if (existing) {
      //     await env.DB.prepare('DELETE FROM timeline_reactions WHERE id = ?').bind(existing.id).run();
      //     return json({ ok: true, action: 'removed' });
      //   }
      //   await env.DB.prepare('INSERT INTO timeline_reactions (post_id, user_token, emoji) VALUES (?,?,?)')
      //     .bind(postId, token, emoji).run();
      return json({ ok: true, action: 'added', message: 'Reaction recorded.' });
    }

    if (path.endsWith('/comments')) {
      const { postId, text } = body || {};
      if (!postId || !text) return json({ ok: false, message: 'postId and text are required.' }, 400);
      // TODO:
      //   await env.DB.prepare(
      //     'INSERT INTO timeline_comments (post_id, user_token, text, created_at) VALUES (?,?,?,?)'
      //   ).bind(postId, token, text, new Date().toISOString()).run();
      return json({ ok: true, message: 'Comment added.' }, 201);
    }

    // Create new post (leaders only — verify role in production)
    const { text, authorName, authorRole } = body || {};
    if (!text) return json({ ok: false, message: 'Post text is required.' }, 400);
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO timeline_posts (author_token, author_name, author_role, text, created_at) VALUES (?,?,?,?,?)'
    //   ).bind(token, authorName || 'Leader', authorRole || 'Leader', text, new Date().toISOString()).run();
    return json({ ok: true, message: 'Post created.' }, 201);
  }

  // ── DELETE — remove post ──────────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Post ID required.' }, 400);
    // TODO: await env.DB.prepare('DELETE FROM timeline_posts WHERE id = ?').bind(id).run();
    return json({ ok: true, message: 'Post deleted.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
