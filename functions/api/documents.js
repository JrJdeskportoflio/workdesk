/**
 * WorkDesk — /api/documents
 * Cloudflare Pages Function
 *
 * GET    /api/documents            — List documents (with optional ?category= filter)
 * POST   /api/documents            — Create a document record (upload via R2 separately)
 * PUT    /api/documents            — Update document metadata
 * DELETE /api/documents?id=DOC-X  — Delete a document
 *
 * File uploads: use env.ATTACHMENTS (R2) for binary storage.
 * For production: use env.DB (D1) for metadata persistence.
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

  // ── GET — list documents ──────────────────────────────────
  if (method === 'GET') {
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    // TODO:
    //   let query = 'SELECT * FROM documents WHERE 1=1';
    //   const binds = [];
    //   if (category) { query += ' AND category = ?'; binds.push(category); }
    //   if (search)   { query += ' AND (name LIKE ? OR description LIKE ?)'; binds.push('%'+search+'%', '%'+search+'%'); }
    //   query += ' ORDER BY uploaded_at DESC';
    //   const { results } = await env.DB.prepare(query).bind(...binds).all();
    return json({ ok: true, documents: [], message: 'Connect D1 database to enable server-side document data.' });
  }

  // ── POST — create document record ────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { name, category, description, fileUrl, fileSize, fileType, uploadedBy } = body || {};
    if (!name || !category || !uploadedBy) {
      return json({ ok: false, message: 'name, category, and uploadedBy are required.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO documents (name, category, description, file_url, file_size, file_type, uploaded_by, uploaded_at) VALUES (?,?,?,?,?,?,?,?)'
    //   ).bind(name, category, description || '', fileUrl || '', fileSize || 0, fileType || '', uploadedBy, new Date().toISOString()).run();
    return json({ ok: true, message: 'Document record created.' }, 201);
  }

  // ── PUT — update document metadata ───────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { id } = body || {};
    if (!id) return json({ ok: false, message: 'Document ID required.' }, 400);
    // TODO: await env.DB.prepare('UPDATE documents SET ... WHERE id = ?').bind(..., id).run();
    return json({ ok: true, message: 'Document updated.' });
  }

  // ── DELETE — remove document ──────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Document ID required.' }, 400);
    // TODO:
    //   const doc = await env.DB.prepare('SELECT file_url FROM documents WHERE id = ?').bind(id).first();
    //   if (doc && doc.file_url && env.ATTACHMENTS) await env.ATTACHMENTS.delete(doc.file_url);
    //   await env.DB.prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
    return json({ ok: true, message: 'Document deleted.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
