# JDesk Workspace

> **All-in-one HRIS platform** — Login Page, Dashboard, HR Management, Payroll, Attendance, Ticketing, and Analytics.  
> Built for deployment on **Cloudflare Pages + Workers**.

---

## 📁 Project Structure

```
JdeskWorkspace-/
├── login.html                  # Login / authentication page
├── dashboard.html              # Main dashboard (HRIS overview)
├── assets/
│   ├── css/
│   │   └── styles.css          # Complete design system & UI stylesheet
│   └── js/
│       └── dashboard.js        # Dashboard interactivity & greeting logic
├── .devcontainer/
│   └── devcontainer.json       # GitHub Codespaces dev environment config
├── .vscode/
│   └── extensions.json         # Recommended VS Code extensions
├── wrangler.toml               # Cloudflare Pages / Workers config
├── JDesk CSS, Login Page, and Dashboard Page UI design Model/
│   ├── CSS ( model ) .txt      # Original CSS design reference model
│   ├── Login Page .PNG         # Login page UI mockup
│   └── Dashboard Page UI.PNG   # Dashboard UI mockup
└── README.md                   # This file
```

---

## 🎨 Design System

### Color Palette (CSS Variables)

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#3A8F7B` | Brand green — buttons, active states |
| `--primary-dark` | `#2F7263` | Hover states |
| `--primary-soft` | `#E7F4F1` | Soft backgrounds, tags |
| `--accent` | `#F4C86A` | Highlight yellow |
| `--accent-soft` | `#FFF6DF` | Soft accent backgrounds |
| `--bg-main` | `#F5F7F6` | App background |
| `--card-bg` | `#FFFFFF` | Card surfaces |
| `--text-main` | `#1F2933` | Primary text |
| `--text-muted` | `#6B7280` | Secondary / caption text |
| `--success` | `#3CB371` | Present / success states |
| `--warning` | `#F5B041` | Late / warning states |
| `--danger` | `#E74C3C` | Absent / error states |

### Typography
- **Font**: Inter, Segoe UI, system-ui, sans-serif
- **Base size**: 16px
- **Load via**: Google Fonts CDN (Inter 400/500/600/700)

### Brand Assets (Cloudinary CDN)
- **Logo**: `https://res.cloudinary.com/durqetaph/image/upload/v1773377613/Jdesk_Logo.svg`
- **Login Cover Photo**: `https://res.cloudinary.com/durqetaph/image/upload/v1773377614/Login_page_coverphoto.svg`

---

## 🚀 Getting Started in GitHub Codespaces

### Step 1 — Open the Codespace

1. In the GitHub repository, click the green **`<> Code`** button.
2. Select the **Codespaces** tab.
3. Click **"Create codespace on main"** (or your target branch).
4. Wait for the container to build (first time takes ~2–3 min).

The `.devcontainer/devcontainer.json` automatically:
- Installs Node.js 20 via the `javascript-node:20` image
- Installs the **Wrangler CLI** (`npm install -g wrangler`)
- Installs all recommended VS Code extensions
- Forwards ports `5500` (Live Server) and `8787` (Wrangler dev)

---

### Step 2 — Preview the Pages

#### Option A: Live Server (Recommended for HTML/CSS)
1. In VS Code, right-click `login.html` → **"Open with Live Server"**
2. Browser auto-opens at `http://localhost:5500/login.html`
3. Any save triggers hot reload — changes appear instantly.

#### Option B: Wrangler dev (for Cloudflare Workers features)
```bash
wrangler pages dev . --port 8787
```
Open `http://localhost:8787` in the Codespace browser preview.

---

### Step 3 — Make Changes

| What to edit | File |
|---|---|
| Login page layout & content | `login.html` |
| Dashboard layout & content | `dashboard.html` |
| Colors, fonts, layout styles | `assets/css/styles.css` |
| Dashboard interactivity | `assets/js/dashboard.js` |
| Cloudflare Workers API | Create `functions/` directory (see below) |

---

## ☁️ Deploying to Cloudflare Pages

### First-time setup

1. **Login to Cloudflare**: https://dash.cloudflare.com
2. Go to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
3. Authorize GitHub and select the `JdeskWorkspace-` repository.
4. Configure build settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `/` *(root)*
5. Click **Save and Deploy**.

Your site will be live at: `https://jdesk-workspace.pages.dev` (or your custom domain).

### Subsequent deployments
Every `git push` to the connected branch triggers an automatic deployment.

### Custom Domain
1. In Cloudflare Pages → your project → **Custom Domains**
2. Add your domain (e.g., `workspace.jdesk.ph`)
3. Update DNS CNAME to point to `jdesk-workspace.pages.dev`

### Wrangler CLI deployment (manual)
```bash
wrangler pages deploy . --project-name jdesk-workspace
```

---

## ⚙️ Adding Cloudflare Workers (API Backend)

Create a `functions/` directory — Cloudflare Pages automatically treats files here as Workers:

```
functions/
├── api/
│   ├── auth.js         # POST /api/auth — Login endpoint
│   ├── employees.js    # GET/POST /api/employees
│   └── attendance.js   # GET/POST /api/attendance
```

**Example Worker** (`functions/api/auth.js`):
```javascript
export async function onRequestPost(context) {
  const { email, password } = await context.request.json();
  // Add your authentication logic here
  return Response.json({ success: true, token: 'your-jwt-token' });
}
```

---

## 🧩 Recommended VS Code Extensions

The `.devcontainer/devcontainer.json` and `.vscode/extensions.json` automatically install:

| Extension | Purpose |
|---|---|
| **Live Server** (`ritwickdey.LiveServer`) | Real-time HTML/CSS preview with auto-reload |
| **Prettier** (`esbenp.prettier-vscode`) | Auto-format HTML, CSS, JS on save |
| **ESLint** (`dbaeumer.vscode-eslint`) | JavaScript linting |
| **HTML CSS Support** (`ecmel.vscode-html-css`) | CSS class autocomplete in HTML |
| **CSS Class IntelliSense** (`zignd.html-css-class-completion`) | Autocomplete CSS class names |
| **Auto Rename Tag** (`formulahendry.auto-rename-tag`) | Rename both open/close HTML tags simultaneously |
| **Auto Close Tag** (`formulahendry.auto-close-tag`) | Automatically close HTML tags |
| **Color Highlight** (`naumovs.color-highlight`) | Visualize hex/rgb colors inline |
| **Material Icon Theme** (`pkief.material-icon-theme`) | File type icons in the explorer |
| **Material Theme** (`zhuangtongfa.material-theme`) | Dark/light IDE theme |
| **GitHub Copilot** (`GitHub.copilot`) | AI code completions |
| **GitHub Copilot Chat** (`GitHub.copilot-chat`) | AI chat assistant |
| **Cloudflare Workers** (`cloudflare.cloudflare-workers-bindings`) | Workers bindings autocomplete |
| **REST Client** (`humao.rest-client`) | Test API endpoints from `.http` files |

---

## 🤖 AI Prompt Guidelines for Codespace Development

Follow these best practices when using GitHub Copilot or other AI tools in this project.

### ✅ DO — Tell the AI exactly what file and component you're working on

**Good prompt:**
```
In dashboard.html, add a new stat card below the existing grid-4 row
that shows "Pending Payroll" with a purple icon and a count of 3.
Match the existing .stat-card and .stat-icon style.
```

**Bad prompt:**
```
Add a stat card
```

---

### ✅ DO — Reference the design tokens

```
Create a new CSS class .alert-banner that uses --accent as border-left color,
--accent-soft as background, and --text-main for text. Follow the .notice style.
```

---

### ✅ DO — Ask for responsive + accessible markup

```
Create a new employee table in dashboard.html with columns: Name, Department,
Position, Status, Actions. Use semantic <table>, <th scope="col">,
and responsive styles consistent with the existing .card component.
Add role="table" and aria-labels.
```

---

### ✅ DO — Specify Cloudflare Workers for backend tasks

```
Create a Cloudflare Pages function at functions/api/employees.js
that handles GET requests and returns a JSON array of 3 sample employees.
Use context.request and Response.json().
```

---

### ❌ AVOID — Vague or scope-less prompts

```
Make the page look better
Fix the CSS
Add authentication
```

---

### 📌 Prompt Template for New Features

Use this template when asking AI to add a new feature:

```
Context: JDesk Workspace HRIS - [page: login.html / dashboard.html]
Component: [name of the component you want]
Design: Use the existing CSS variables (--primary, --card-bg, etc.) and
        component classes (.card, .btn, .stat-card, etc.) from assets/css/styles.css
Behavior: [describe interactivity, if any]
Accessibility: Include appropriate ARIA roles and labels
Responsive: Must work on mobile (< 768px) — follow existing media queries
Output: HTML + CSS (inline in <style> if page-specific) + JS (in assets/js/ if needed)
```

---

## 📄 Pages Overview

### `login.html` — Login / Authentication Page

- **Left panel**: Cloudinary cover photo + product tagline
- **Right panel**: JDesk logo + email/password form + social login (Google, Microsoft)
- **On submit**: Redirects to `dashboard.html` (replace with real Worker auth call)
- **Responsive**: Right panel becomes full-width on mobile; left panel hidden

### `dashboard.html` — Main HRIS Dashboard

| Section | Description |
|---|---|
| Greeting Banner | Dynamic time-based greeting (Good Morning/Afternoon/Evening) |
| Stat Cards (×4) | Total Employees, Present Today, On Leave, Open Tickets |
| Attendance Chart | Bar chart (monthly) + Donut chart (today's breakdown) |
| New Employees | List of recent hires with status tags |
| Support Tickets | Open/Pending/Resolved ticket list |
| Activity Feed | Timeline of recent HR events |
| Announcements | Notices with accent-bordered styling |
| Quick Actions | Grid of 8 shortcut buttons |
| Calendar | March 2025 calendar with highlighted event days |

---

## 🔒 Security Notes

- Do **not** commit secrets or API keys to this repository.
- Use **Cloudflare Workers environment variables** for sensitive config:
  ```bash
  wrangler secret put JWT_SECRET
  wrangler secret put DB_CONNECTION_STRING
  ```
- Authentication tokens should be stored in **HttpOnly cookies**, not localStorage.
- Enable **HTTPS-only** and **HSTS** in Cloudflare dashboard settings.

---

## 📚 References

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Inter Font — Google Fonts](https://fonts.google.com/specimen/Inter)
- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)

---

*JDesk Workspace — Built with ❤️ for Filipino HR teams.*
