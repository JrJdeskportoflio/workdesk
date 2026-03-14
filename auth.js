// auth.js

// Function to handle CEO login with Cloudflare secrets
async function ceoLogin() {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: document.getElementById('username').value,
            orgId: document.getElementById('orgId').value
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

// Shared logout handler
function logout() {
    localStorage.removeItem('session');
    window.location.href = 'login.html';
}
