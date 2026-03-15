/**
 * WorkDesk — /api/organizations
 * Cloudflare Pages Function
 *
 * GET    /api/organizations          — List all organisations (superadmin only)
 * POST   /api/organizations          — Create a new organisation (superadmin only)
 * PUT    /api/organizations          — Update an organisation (superadmin only)
 * DELETE /api/organizations          — Delete an organisation (superadmin only)
 */

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type':                 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// ── Token verification — mirrors the signing logic in auth.js ────────────────
// Verifies the HMAC-SHA256 signature on the token before trusting any payload
// claim (including the role).  Returns { email, role } or null on failure.
async function verifyToken(token, secret) {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex < 0) return null;
    const payloadB64 = token.slice(0, dotIndex);
    const sigB64     = token.slice(dotIndex + 1);
    const payload    = atob(payloadB64);               // "email:role:timestamp"

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const expectedBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedBuf)));

    // Constant-time comparison to prevent timing attacks
    if (sigB64.length !== expectedB64.length) return null;
    const a = new TextEncoder().encode(sigB64);
    const b = new TextEncoder().encode(expectedB64);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0) return null;

    const parts = payload.split(':');
    return { email: parts[0], role: parts[1] };
  } catch (_e) {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // ── Auth: require a valid Bearer token with superadmin role ─────────────────
  const authHeader = request.headers.get('Authorization') || '';
  const token      = authHeader.replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const secret  = (env && env.TOKEN_SECRET) || 'workdesk-demo-secret-change-in-production';
  const decoded = await verifyToken(token, secret);
  if (!decoded || decoded.role !== 'superadmin') {
    return json({ ok: false, message: 'Forbidden. Super Admin access required.' }, 403);
  }

  // ── GET — list organisations ─────────────────────────────────────────────────
  if (method === 'GET') {
    if (env && env.DB) {
      const { results } = await env.DB.prepare('SELECT * FROM organizations ORDER BY created_at DESC').all();
      return json({ ok: true, organizations: results });
    }
    // Demo fallback (no DB connected yet)
    return json({
      ok: true,
      organizations: [
        {
          id:          1,
          name:        'Acme Corporation',
          industry:    'Technology',
          size:        '51–200 employees',
          country:     'Philippines',
          timezone:    'Asia/Manila',
          admin_email: 'admin@acme.com',
          status:      'active',
          created_at:  '2024-01-15T08:00:00Z',
        },
      ],
      note: 'Demo data — connect Cloudflare D1 (see schema.sql) to persist organisations.',
    });
  }

  // ── POST — create organisation ───────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch {
      return json({ ok: false, message: 'Invalid JSON body.' }, 400);
    }

    const { name, industry, size, country, timezone, admin_email, admin_name } = body || {};
    if (!name || !admin_email) {
      return json({ ok: false, message: 'Organization name and admin email are required.' }, 400);
    }

    if (env && env.DB) {
      const stmt = env.DB.prepare(
        `INSERT INTO organizations (name, industry, size, country, timezone, admin_email, admin_name, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`
      );
      const result = await stmt.bind(
        name, industry || '', size || '', country || '', timezone || 'UTC', admin_email, admin_name || ''
      ).run();
      return json({ ok: true, message: 'Organization created.', id: result.meta.last_row_id });
    }

    // Demo fallback
    return json({
      ok:      true,
      message: 'Organization created (demo mode — no DB connected).',
      organization: { name, industry, size, country, timezone, admin_email, admin_name, status: 'active' },
      note: 'Connect Cloudflare D1 and run schema.sql to persist data.',
    });
  }

  // ── PUT — update organisation ────────────────────────────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch {
      return json({ ok: false, message: 'Invalid JSON body.' }, 400);
    }

    const { id, name, industry, size, country, timezone, admin_email, admin_name, status } = body || {};
    if (!id) return json({ ok: false, message: 'Organization id is required.' }, 400);

    if (env && env.DB) {
      await env.DB.prepare(
        `UPDATE organizations
            SET name=?, industry=?, size=?, country=?, timezone=?, admin_email=?, admin_name=?, status=?, updated_at=datetime('now')
          WHERE id=?`
      ).bind(name, industry, size, country, timezone, admin_email, admin_name, status, id).run();
      return json({ ok: true, message: 'Organization updated.' });
    }

    return json({ ok: true, message: 'Organization updated (demo mode — no DB connected).' });
  }

  // ── DELETE — remove organisation ─────────────────────────────────────────────
  if (method === 'DELETE') {
    let body;
    try { body = await request.json(); } catch {
      return json({ ok: false, message: 'Invalid JSON body.' }, 400);
    }

    const { id } = body || {};
    if (!id) return json({ ok: false, message: 'Organization id is required.' }, 400);

    if (env && env.DB) {
      await env.DB.prepare('DELETE FROM organizations WHERE id=?').bind(id).run();
      return json({ ok: true, message: 'Organization deleted.' });
    }

    return json({ ok: true, message: 'Organization deleted (demo mode — no DB connected).' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
