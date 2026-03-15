/**
 * WorkDesk — /api/analytics
 * Cloudflare Pages Function
 *
 * GET /api/analytics              — Return aggregated HR analytics/metrics
 * GET /api/analytics?report=headcount   — Headcount by department
 * GET /api/analytics?report=attendance  — Attendance rate trend
 * GET /api/analytics?report=turnover    — Turnover statistics
 * GET /api/analytics?report=payroll     — Payroll cost summary
 *
 * For production: use env.DB (D1) aggregate queries.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  if (method !== 'GET') return json({ ok: false, message: 'Method not allowed.' }, 405);

  const url = new URL(request.url);
  const report = url.searchParams.get('report') || 'summary';

  // ── Summary ───────────────────────────────────────────────
  if (report === 'summary') {
    // TODO:
    //   const [totalEmp, avgAttendance, openLeave, payrollCost] = await Promise.all([
    //     env.DB.prepare('SELECT COUNT(*) as count FROM employees WHERE status = ?').bind('Active').first(),
    //     env.DB.prepare('SELECT AVG(rate) as avg FROM attendance_summary WHERE month = ?').bind(currentMonth).first(),
    //     env.DB.prepare('SELECT COUNT(*) as count FROM leave_requests WHERE status = ?').bind('Pending').first(),
    //     env.DB.prepare('SELECT SUM(total_pay) as total FROM payroll_ledger WHERE period = ?').bind(currentPeriod).first(),
    //   ]);
    return json({
      ok: true,
      report: 'summary',
      data: {},
      message: 'Connect D1 database to enable server-side analytics.',
    });
  }

  // ── Headcount ─────────────────────────────────────────────
  if (report === 'headcount') {
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT dept, COUNT(*) as count FROM employees WHERE status = ? GROUP BY dept')
    //     .bind('Active').all();
    return json({ ok: true, report: 'headcount', data: [], message: 'Connect D1 database.' });
  }

  // ── Attendance trend ──────────────────────────────────────
  if (report === 'attendance') {
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT date, COUNT(*) as present FROM attendance WHERE status = ? GROUP BY date ORDER BY date DESC LIMIT 30')
    //     .bind('Present').all();
    return json({ ok: true, report: 'attendance', data: [], message: 'Connect D1 database.' });
  }

  // ── Turnover ──────────────────────────────────────────────
  if (report === 'turnover') {
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT STRFTIME("%Y-%m", end_date) as month, COUNT(*) as exits FROM employees WHERE status = ? GROUP BY month ORDER BY month DESC LIMIT 12')
    //     .bind('Resigned').all();
    return json({ ok: true, report: 'turnover', data: [], message: 'Connect D1 database.' });
  }

  // ── Payroll summary ───────────────────────────────────────
  if (report === 'payroll') {
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT period, SUM(total_pay) as total FROM payroll_ledger GROUP BY period ORDER BY period DESC LIMIT 12')
    //     .all();
    return json({ ok: true, report: 'payroll', data: [], message: 'Connect D1 database.' });
  }

  return json({ ok: false, message: 'Unknown report type.' }, 400);
}
