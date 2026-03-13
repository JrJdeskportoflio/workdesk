// JDesk Workspace — Dashboard JS
// Handles greeting, interactivity, and future API hooks.

(function () {
  'use strict';

  // ── Greeting ─────────────────────────────────────────────
  function setGreeting() {
    const el = document.getElementById('greetingText');
    if (!el) return;
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';
    el.textContent = `${greeting}, J. Dela Cruz! 👋`;
  }

  // ── Sidebar navigation ────────────────────────────────────
  function initSidebarNav() {
    const items = document.querySelectorAll('.sidebar-menu li');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        items.forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
      });
    });
  }

  // ── Quick Actions ─────────────────────────────────────────
  function initQuickActions() {
    const actions = document.querySelectorAll('.quick-action');
    actions.forEach(function (action) {
      action.addEventListener('click', function () {
        const label = action.querySelector('div:last-child');
        if (label) {
          // Placeholder — replace with real navigation or modal triggers
          console.info('[JDesk] Quick action:', label.textContent.trim());
        }
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    setGreeting();
    initSidebarNav();
    initQuickActions();
  });

}());
