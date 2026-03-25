# STEP 3 — Build & Output Settings

This project is **pure static HTML/CSS/JS** — no build tool needed.

---

## Build Configuration Form

Fill in the form exactly as shown below:

| Field                     | Value              |
|---------------------------|--------------------|
| **Project name**          | `myworkdeskapp`    |
| **Production branch**     | `main`             |
| **Framework preset**      | `None`             |
| **Build command**         | *(leave blank)*    |
| **Build output directory**| `/`                |
| **Root directory**        | `/`                |

> **Why blank build command?**  
> There is no bundler, no npm install, no compile step. The HTML files are served as-is directly from the repository root.

> **Why `/` as output directory?**  
> The `index.html`, `app/`, `admin/`, `assets/`, `functions/`, `_redirects`, and `_headers` files all live at the repository root.

---

## Do NOT change these (already in the repo)

The following files are already committed and Cloudflare Pages picks them up automatically — **do not recreate them**:

- `_redirects` — handles all URL routing (login redirects, legacy /pages/ paths, admin paths)
- `_headers` — sets security headers (CSP, HSTS, X-Frame-Options, etc.)
- `functions/api/` — all API endpoints (auth, employees, payroll, etc.)
- `wrangler.jsonc` — Cloudflare project config (name, compatibility date, assets)

---

➡️ Next: [STEP-4-env-variables.md](./STEP-4-env-variables.md)
