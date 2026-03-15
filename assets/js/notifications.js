/**
 * WorkDesk — Shared Notification Manager
 * Handles cross-page notification storage, rendering, and badge updates.
 * Uses localStorage key `workdesk_notifications` for client-side persistence.
 * Attempts to sync with /api/notifications when available.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'workdesk_notifications';
  var MAX_NOTIFS  = 50;

  // ── Icon templates by notification type ──────────────────
  var ICONS = {
    message:  '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    ticket:   '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>',
    timeline: '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>',
    leave:    '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
    attendance: '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 3"/></svg>',
    payroll:  '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v1m0 6v1m3-4.5c0-1.38-1.343-2.5-3-2.5s-3 1.12-3 2.5 1.343 2.5 3 2.5 3 1.12 3 2.5-1.343 2.5-3 2.5"/></svg>',
    employee: '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zM4 20c0-3.31 3.58-6 8-6s8 2.69 8 6"/></svg>',
    info:     '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };

  // ── Seed notifications (shown when no stored notifications exist) ─
  var SEED_NOTIFICATIONS = [
    { id: 'seed-1', type: 'leave',      text: 'New leave request from <strong>Maria Santos</strong>',         href: 'leave.html',      unread: true,  ts: Date.now() - 2 * 60 * 1000 },
    { id: 'seed-2', type: 'attendance', text: '<strong>3 employees</strong> are late today',                  href: 'attendance.html', unread: true,  ts: Date.now() - 15 * 60 * 1000 },
    { id: 'seed-3', type: 'payroll',    text: 'Payroll for <strong>March 2025</strong> is ready for review',  href: 'payroll.html',    unread: false, ts: Date.now() - 60 * 60 * 1000 },
    { id: 'seed-4', type: 'employee',   text: '<strong>2 new employees</strong> added to the system',         href: 'employees.html',  unread: false, ts: Date.now() - 3 * 60 * 60 * 1000 },
    { id: 'seed-5', type: 'attendance', text: 'Daily attendance report for <strong>yesterday</strong> ready', href: 'attendance.html', unread: false, ts: Date.now() - 6 * 60 * 60 * 1000 },
    { id: 'seed-6', type: 'leave',      text: 'Leave balance updated for <strong>Q2 2025</strong>',           href: 'leave.html',      unread: false, ts: Date.now() - 24 * 60 * 60 * 1000 },
    { id: 'seed-7', type: 'payroll',    text: 'Payroll <strong>disbursement schedule</strong> confirmed',     href: 'payroll.html',    unread: false, ts: Date.now() - 2 * 24 * 60 * 60 * 1000 }
  ];

  // ── Relative time formatting ──────────────────────────────
  function relTime(ts) {
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)  return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
    if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' day' + (Math.floor(diff / 86400) > 1 ? 's' : '') + ' ago';
    var d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // ── Storage helpers ───────────────────────────────────────
  function loadNotifications() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    // First-time seed
    var seeded = SEED_NOTIFICATIONS.slice();
    saveNotifications(seeded);
    return seeded;
  }

  function saveNotifications(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  // ── Public API: push a new notification ──────────────────
  function pushNotification(type, text, href) {
    var list = loadNotifications();
    var id   = 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    // Sanitize href: only allow relative paths and http/https URLs
    var safeHref = (href && /^(https?:\/\/|\/|[a-z0-9_\-./]+\.html)/i.test(href)) ? href : '#';
    list.unshift({ id: id, type: type, text: text, href: safeHref, unread: true, ts: Date.now() });
    if (list.length > MAX_NOTIFS) list = list.slice(0, MAX_NOTIFS);
    saveNotifications(list);
    renderNotifications();
    updateBadge();

    // Fire-and-forget to backend when available
    var token = localStorage.getItem('workdesk_token') || '';
    if (token) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ type: type, text: text, href: href || '#' })
      }).catch(function () { /* offline or unavailable */ });
    }
  }

  // ── Badge counter ─────────────────────────────────────────
  function updateBadge() {
    var list   = loadNotifications();
    var unread = list.filter(function (n) { return n.unread; }).length;
    var btn    = document.getElementById('notifBtn');
    if (!btn) return;
    if (unread > 0) {
      btn.classList.add('badge');
    } else {
      btn.classList.remove('badge');
    }
  }

  // ── Render notification list from storage ─────────────────
  function renderNotifications() {
    var listEl = document.querySelector('#notifDropdown .notif-list');
    if (!listEl) return;

    var list = loadNotifications();
    if (!list.length) {
      listEl.innerHTML = '<div class="notif-item" style="justify-content:center;color:var(--text-muted);font-size:13px;">No notifications</div>';
      return;
    }

    var VISIBLE_DEFAULT = 4;
    var allVisible      = listEl.classList.contains('notif-all-visible');

    var html = '';
    list.forEach(function (n, i) {
      var extra  = i >= VISIBLE_DEFAULT ? ' notif-extra' : '';
      var unread = n.unread ? ' unread' : '';
      var icon   = ICONS[n.type] || ICONS.info;
      html += '<div class="notif-item' + unread + extra + '" role="menuitem" data-id="' + n.id + '" data-href="' + (n.href || '#') + '">' +
                '<div class="notif-icon">' + icon + '</div>' +
                '<div class="notif-content">' +
                  '<div class="notif-text">' + n.text + '</div>' +
                  '<div class="notif-time">' + relTime(n.ts) + '</div>' +
                '</div>' +
              '</div>';
    });

    listEl.innerHTML = html;

    // Restore all-visible state
    if (allVisible) {
      listEl.classList.add('notif-all-visible');
    }

    // Re-attach click handlers
    listEl.querySelectorAll('.notif-item[data-id]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        markRead(item.dataset.id);
        var href = item.dataset.href;
        if (href && href !== '#') window.location.href = href;
      });
    });
  }

  function markRead(id) {
    var list = loadNotifications();
    list.forEach(function (n) { if (n.id === id) n.unread = false; });
    saveNotifications(list);
    updateBadge();
    renderNotifications();
  }

  function markAllRead() {
    var list = loadNotifications();
    list.forEach(function (n) { n.unread = false; });
    saveNotifications(list);
    updateBadge();
    renderNotifications();
  }

  // ── Wire up dropdown controls ─────────────────────────────
  function initDropdown() {
    var notifBtn  = document.getElementById('notifBtn');
    var notifDrop = document.getElementById('notifDropdown');
    if (!notifBtn || !notifDrop) return;

    renderNotifications();
    updateBadge();

    // Toggle open/close
    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = notifDrop.classList.toggle('open');
      notifBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Close status dropdown if present
      var statusDrop = document.getElementById('statusDropdown');
      if (statusDrop) statusDrop.classList.remove('open');
      var statusBtn = document.getElementById('statusBadgeBtn');
      if (statusBtn) statusBtn.setAttribute('aria-expanded', 'false');
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (notifDrop.classList.contains('open') && !document.getElementById('notifWrap').contains(e.target)) {
        notifDrop.classList.remove('open');
        notifBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Mark all as read
    var markAllBtn = document.getElementById('notifMarkAll');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        markAllRead();
      });
    }

    // See all / Show less toggle
    var viewAllBtn = document.getElementById('notifViewAll');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var listEl   = notifDrop.querySelector('.notif-list');
        var expanded = listEl.classList.toggle('notif-all-visible');
        viewAllBtn.textContent = expanded ? 'Show less' : 'See all notifications';
        renderNotifications();
      });
    }
  }

  // ── Expose public API ─────────────────────────────────────
  window.WDNotifications = {
    push: pushNotification,
    markRead: markRead,
    markAllRead: markAllRead,
    render: renderNotifications
  };

  // ── Auto-init on DOMContentLoaded ────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdown);
  } else {
    initDropdown();
  }

}());
