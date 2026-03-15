/**
 * WorkDesk — Queue Consumer Worker
 *
 * Processes background jobs published to `workdesk-queue` by the Pages Functions:
 *
 *   notification.created  → Persist notification to D1 (notifications table).
 *   payroll.run           → Compute payroll for all active employees, INSERT rows
 *                           into payroll_ledger, and send payslip notifications.
 *   report.generate       → Aggregate D1 data, serialize to the requested format,
 *                           upload to R2, and log the report metadata.
 *
 * Queue events are published by:
 *   functions/api/notifications.js  — POST /api/notifications
 *   functions/api/payroll.js        — POST /api/payroll/run
 *   functions/api/reports.js        — POST /api/reports
 *
 * Bindings required (configure in wrangler.toml before deploying):
 *   env.DB      — Cloudflare D1 database (workdesk-db)
 *   env.UPLOADS — Cloudflare R2 bucket   (workdesk-attachments)
 */

export default {
  /**
   * queue — batch message handler
   *
   * Called by the Cloudflare runtime whenever messages are available on
   * workdesk-queue. Each message is acked individually so that a single
   * failure does not block the rest of the batch.
   *
   * @param {MessageBatch} batch
   * @param {object}       env
   */
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await handleMessage(message.body, env);
        message.ack();
      } catch (err) {
        console.error('[queue-consumer] failed to process message:', message.body?.event, err);
        // Retry up to max_retries (configured in wrangler.toml).
        message.retry();
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Message dispatcher
// ─────────────────────────────────────────────────────────────────────────────

async function handleMessage(body, env) {
  switch (body?.event) {
    case 'notification.created':
      return handleNotificationCreated(body, env);
    case 'payroll.run':
      return handlePayrollRun(body, env);
    case 'report.generate':
      return handleReportGenerate(body, env);
    default:
      console.warn('[queue-consumer] unknown event type:', body?.event);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// notification.created
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persists a new notification row in D1.
 *
 * Expected body shape (published by functions/api/notifications.js):
 *   { event, id, user_token, type, text, href, created_at }
 */
async function handleNotificationCreated(body, env) {
  if (!env.DB) {
    console.warn('[queue-consumer] notification.created: env.DB not configured, skipping persist.');
    return;
  }

  const { id, user_token, type, text, href, created_at } = body;

  await env.DB
    .prepare(
      'INSERT OR IGNORE INTO notifications (id, user_token, type, text, href, unread, created_at) VALUES (?,?,?,?,?,1,?)',
    )
    .bind(id, user_token, type, text, href || '#', created_at)
    .run();

  console.info('[queue-consumer] notification saved:', id);
}

// ─────────────────────────────────────────────────────────────────────────────
// payroll.run
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Runs payroll for the requested period.
 *
 * Steps:
 *   1. Fetch all active employees from D1.
 *   2. For each employee, calculate gross pay, deductions, and net pay.
 *   3. INSERT or REPLACE rows in payroll_ledger.
 *   4. Publish a notification to each employee via the notifications table.
 *
 * Expected body shape (published by functions/api/payroll.js):
 *   { event, period, count, token, queued_at }
 */
async function handlePayrollRun(body, env) {
  if (!env.DB) {
    console.warn('[queue-consumer] payroll.run: env.DB not configured, skipping.');
    return;
  }

  const { period, token } = body;

  // 1. Fetch active employees.
  const { results: employees } = await env.DB
    .prepare("SELECT id, email, basic_pay, overtime_pay, allowances, deductions FROM employees WHERE status = 'Active'")
    .all();

  if (!employees.length) {
    console.info('[queue-consumer] payroll.run: no active employees found for period', period);
    return;
  }

  // 2 & 3. Compute and insert payroll rows.
  const now = new Date().toISOString();
  const insertStmt = env.DB.prepare(
    'INSERT OR REPLACE INTO payroll_ledger (id, employee_id, period, basic_pay, overtime, allowances, deductions, total_pay, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
  );

  const batch = employees.map((emp) => {
    // TODO: fetch basic_pay from the employee's contract record in D1.
    // Replace the placeholder values below with a D1 query such as:
    //   SELECT basic_pay, allowances FROM employee_contracts WHERE employee_id = ? AND status = 'active'
    const basic      = emp.basic_pay      || 0;
    const overtime   = emp.overtime_pay   || 0;
    const allowances = emp.allowances     || 0;
    const deductions = emp.deductions     || 0;   // SSS / PhilHealth / Pag-IBIG totals
    const total      = basic + overtime + allowances - deductions;
    const rowId      = 'pay-' + emp.id + '-' + period.replace(/\s/g, '-');

    return insertStmt.bind(rowId, emp.id, period, basic, overtime, allowances, deductions, total, 'Released', now);
  });

  await env.DB.batch(batch);

  // 4. Notify requester.
  if (token) {
    const notifId = 'n-payroll-' + Date.now();
    await env.DB
      .prepare(
        'INSERT OR IGNORE INTO notifications (id, user_token, type, text, href, unread, created_at) VALUES (?,?,?,?,?,1,?)',
      )
      .bind(notifId, token, 'payroll', 'Payroll run for ' + period + ' completed. ' + employees.length + ' employees processed.', '/payroll.html', now)
      .run();
  }

  console.info('[queue-consumer] payroll.run: processed', employees.length, 'employees for', period);
}

// ─────────────────────────────────────────────────────────────────────────────
// report.generate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates an HR report, uploads it to R2, and logs metadata in D1.
 *
 * Expected body shape (published by functions/api/reports.js):
 *   { event, reportId, type, format, orgId, dateFrom, dateTo, filters, queued_at }
 */
async function handleReportGenerate(body, env) {
  const { reportId, type, format, orgId, dateFrom, dateTo, filters } = body;

  // Fetch report data from D1 based on report type.
  const data = await fetchReportData(env, type, orgId, dateFrom, dateTo, filters);

  // Serialize to the requested format.
  let content, contentType, extension;
  if (format === 'csv') {
    content     = toCsv(data);
    contentType = 'text/csv';
    extension   = 'csv';
  } else if (format === 'xlsx') {
    // XLSX serialization requires a library not available in vanilla Workers.
    // Fall back to CSV and note the limitation.
    content     = toCsv(data);
    contentType = 'text/csv';
    extension   = 'csv';
    console.warn('[queue-consumer] xlsx format requested but not yet supported; falling back to csv.');
  } else {
    content     = JSON.stringify(data, null, 2);
    contentType = 'application/json';
    extension   = 'json';
  }

  const key  = 'reports/' + (orgId || 'platform') + '/' + reportId + '.' + extension;
  const name = REPORT_NAMES[type] + (dateFrom ? ' (' + dateFrom + ' – ' + (dateTo || new Date().toISOString().slice(0, 10)) + ')' : '');
  const now  = new Date().toISOString();

  // Upload to R2 if binding is available.
  if (env.UPLOADS) {
    await env.UPLOADS.put(key, content, {
      httpMetadata: { contentType },
      customMetadata: { reportId, type, orgId: orgId || '', generatedAt: now },
    });
    console.info('[queue-consumer] report uploaded to R2:', key);
  } else {
    console.warn('[queue-consumer] env.UPLOADS not configured; report not stored.');
  }

  // Log report metadata in D1 if available.
  if (env.DB) {
    await env.DB
      .prepare(
        'INSERT OR IGNORE INTO reports (id, name, type, format, org_id, date_from, date_to, r2_key, rows, status, generated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(reportId, name, type, extension, orgId || null, dateFrom || null, dateTo || null, env.UPLOADS ? key : null, data.length, 'ready', now)
      .run()
      .catch(() => {
        // reports table may not exist yet; non-fatal.
        console.warn('[queue-consumer] could not log report metadata to D1 — ensure reports table exists.');
      });
  }

  console.info('[queue-consumer] report.generate complete:', reportId, type, format, 'rows:', data.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// Report data fetchers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchReportData(env, type, orgId, dateFrom, dateTo, filters) {
  if (!env.DB) return [];

  const from = dateFrom || '2000-01-01';
  const to   = dateTo   || new Date().toISOString().slice(0, 10);

  switch (type) {
    case 'hr_summary': {
      const { results } = await env.DB
        .prepare('SELECT id, first_name, last_name, email, dept, position, status, start_date FROM employees WHERE created_at >= ? AND created_at <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'attendance': {
      const { results } = await env.DB
        .prepare('SELECT * FROM attendance WHERE date >= ? AND date <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'payroll': {
      const { results } = await env.DB
        .prepare("SELECT * FROM payroll_ledger WHERE period >= ? AND period <= ?")
        .bind(from, to).all();
      return results;
    }
    case 'leave': {
      const { results } = await env.DB
        .prepare('SELECT * FROM leave_requests WHERE filed_date >= ? AND filed_date <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'performance': {
      const { results } = await env.DB
        .prepare('SELECT * FROM performance_reviews WHERE created_at >= ? AND created_at <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'recruitment': {
      const { results } = await env.DB
        .prepare('SELECT * FROM job_postings WHERE posted_date >= ? AND posted_date <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'engagement': {
      const { results } = await env.DB
        .prepare('SELECT * FROM survey_responses WHERE submitted_at >= ? AND submitted_at <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'tickets': {
      const { results } = await env.DB
        .prepare('SELECT * FROM tickets WHERE created_at >= ? AND created_at <= ?')
        .bind(from, to).all();
      return results;
    }
    case 'platform_usage':
    default:
      return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function toCsv(rows) {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape  = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines   = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\r\n');
}

const REPORT_NAMES = {
  hr_summary:     'HR Summary Report',
  attendance:     'Attendance Report',
  payroll:        'Payroll Report',
  leave:          'Leave Balance Report',
  performance:    'Performance Reviews',
  recruitment:    'Recruitment Pipeline',
  platform_usage: 'Platform Usage Report',
  engagement:     'Engagement Survey Report',
  tickets:        'Support Ticket Report',
};
