// auth.js

// Function to handle CEO login with Cloudflare secrets
async function ceoLogin() {
    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: document.getElementById('username') ? document.getElementById('username').value : '',
            password: document.getElementById('orgId') ? document.getElementById('orgId').value : '',
        })
    });
    const data = await response.json();
    if (response.ok) {
        // Storing session payload in localStorage
        localStorage.setItem('session', JSON.stringify({
            token: data.token,
            role: data.role,
            permissions: data.permissions,
            orgId: data.orgId,
            displayName: data.displayName
        }));
        window.location.href = 'dashboard.html';
    } else {
        alert(data.message);
    }
}

// Shared logout handler — clears session data and redirects to login
function logout() {
    WDConfirm.show({
        title:       'Log Out',
        message:     'Are you sure you want to log out?',
        type:        'warn',
        confirmText: 'Yes, Log Out',
        cancelText:  'No',
        onConfirm: function () {
            localStorage.removeItem('workdesk_token');
            localStorage.removeItem('workdesk_display_name');
            localStorage.removeItem('session');
            window.location.href = 'login.html';
        }
    });
}

// ── Mobile sidebar drawer ────────────────────────────────
// Initialises hamburger toggle + overlay close for all app pages.
// Called automatically on DOMContentLoaded.
(function initMobileNav() {
    document.addEventListener('DOMContentLoaded', function () {
        var sidebar  = document.getElementById('sidebar');
        var menuBtn  = document.getElementById('mobileMenuBtn');
        var overlay  = document.getElementById('sidebarOverlay');

        if (!sidebar || !menuBtn) return;

        function openSidebar() {
            sidebar.classList.add('mobile-open');
            if (overlay) overlay.classList.add('open');
            menuBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            sidebar.classList.remove('mobile-open');
            if (overlay) overlay.classList.remove('open');
            menuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }

        menuBtn.addEventListener('click', function () {
            if (sidebar.classList.contains('mobile-open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        // Close sidebar on nav item click (mobile)
        var navItems = sidebar.querySelectorAll('.sidebar-menu li[onclick]');
        navItems.forEach(function (item) {
            item.addEventListener('click', function () {
                if (window.innerWidth <= 768) closeSidebar();
            });
        });

        // Close sidebar on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeSidebar();
        });

        // Close sidebar when resizing back to desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 768) closeSidebar();
        });
    });
}());
