# STEP 6 — Custom Domain (Optional)

If you want the app on your own domain (e.g. `app.myworkdesk.com`) instead of the default `*.pages.dev` URL, follow these steps.

---

## 1. Add Custom Domain in Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. **Workers & Pages** → **myworkdeskapp** → **Custom domains** tab
3. Click **Set up a custom domain**
4. Type your domain, e.g. `app.myworkdesk.com`
5. Click **Continue**

---

## 2. DNS Setup

### Option A — Domain is on Cloudflare (recommended, automatic)
If your domain is already managed by Cloudflare DNS, Cloudflare will offer to **add the DNS record automatically**.  
Click **Activate domain** — done. ✅

### Option B — Domain is on another registrar (manual)
Add a **CNAME** record at your DNS provider:

| Type  | Name (subdomain) | Value (target)                    |
|-------|------------------|-----------------------------------|
| CNAME | `app`            | `myworkdeskapp.pages.dev`         |

> If you want to use a root/apex domain (e.g. `myworkdesk.com`), use a **CNAME flattening / ALIAS / ANAME** record instead (depends on your DNS provider).

---

## 3. Wait for Propagation

- DNS changes can take **a few minutes to 48 hours** to propagate globally.
- Cloudflare will automatically provision an **SSL/TLS certificate** (Let's Encrypt) for your custom domain — no action needed.
- The domain status in the Cloudflare dashboard will change from **Pending** → ✅ **Active** when ready.

---

## 4. Verify

Once active, all the URLs from Step 5 work the same way with your custom domain:

```
https://app.myworkdesk.com/app/login.html
https://app.myworkdesk.com/pages/sa-login.html
https://app.myworkdesk.com/app/dashboard.html
```

---

## Notes

- The `*.pages.dev` URL will continue to work even after you add a custom domain.
- You can add **multiple custom domains** if needed (e.g. one for staging, one for production).
- HTTPS is always enabled and enforced — there is nothing to configure.
