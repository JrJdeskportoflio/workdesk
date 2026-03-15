/**
 * WorkDesk — /api/engagement
 * Cloudflare Pages Function
 *
 * GET  /api/engagement            — Get engagement survey results / pulse data
 * POST /api/engagement            — Submit an engagement survey response
 * POST /api/engagement/survey     — Create a new survey
 *
 * For production: use env.DB (D1) for persistence.
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
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const path = url.pathname;

  // ── GET — pulse / survey results ──────────────────────────
  if (method === 'GET') {
    const surveyId = url.searchParams.get('surveyId');
    // TODO:
    //   if (surveyId) {
    //     const { results } = await env.DB
    //       .prepare('SELECT * FROM survey_responses WHERE survey_id = ?').bind(surveyId).all();
    //     return json({ ok: true, responses: results });
    //   }
    //   const { results } = await env.DB
    //     .prepare('SELECT * FROM surveys ORDER BY created_at DESC').all();
    return json({ ok: true, surveys: [], message: 'Connect D1 database to enable server-side engagement data.' });
  }

  // ── POST ──────────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }

    if (path.endsWith('/survey')) {
      // Create a new survey
      const { title, questions, dueDate } = body || {};
      if (!title || !questions) return json({ ok: false, message: 'title and questions are required.' }, 400);
      // TODO:
      //   await env.DB.prepare(
      //     'INSERT INTO surveys (title, questions, due_date, created_by, created_at) VALUES (?,?,?,?,?)'
      //   ).bind(title, JSON.stringify(questions), dueDate || null, token, new Date().toISOString()).run();
      return json({ ok: true, message: 'Survey created.' }, 201);
    }

    // Submit a response
    const { surveyId, answers } = body || {};
    if (!surveyId || !answers) return json({ ok: false, message: 'surveyId and answers are required.' }, 400);
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO survey_responses (survey_id, respondent_token, answers, submitted_at) VALUES (?,?,?,?)'
    //   ).bind(surveyId, token, JSON.stringify(answers), new Date().toISOString()).run();
    return json({ ok: true, message: 'Survey response submitted.' }, 201);
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
