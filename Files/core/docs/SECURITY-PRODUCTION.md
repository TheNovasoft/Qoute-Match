# QuoteMatch — Production security (client / go-live)

Use this **before** handing the site to the client or starting formal QA on a live URL.

---

## 1. Server `.env` (must)

| Variable | Production value | Why |
|----------|------------------|-----|
| `APP_ENV` | `production` | Enables HTTPS redirect + security headers |
| `APP_DEBUG` | **`false`** | Hides stack traces, DB queries, paths |
| `APP_KEY` | Unique (`php artisan key:generate`) | Sessions, encryption |
| `APP_URL` | `https://yourdomain.com` | Correct links, cookies |
| `SESSION_ENCRYPT` | `true` | Encrypt session payload |
| `LOG_LEVEL` | `warning` or `error` | Less noise in logs |

Run on server after editing `.env`:

```bash
cd Files/core
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Never** commit `.env` or share it in WhatsApp/email.

---

## 2. Demo / preview mode (client ko “todna” nahi)

Agar client sirf **dekhna** chahe, settings change na kare:

```env
DEMO_MODE=true
```

- Admin panel mein **save / delete / approve** wale POST block ho jate hain (login allowed).
- Customer / provider flows normal chal sakte hain (hire, post job, etc.) — full QA ke liye `DEMO_MODE=false` rakho.

---

## 3. Installer lock

Pehli successful boot par `storage/framework/installed.lock` ban jata hai.

- `/install` web installer **404 / blocked** (Apache `.htaccess` + `install/index.php`).
- Production par **`Files/install/` folder delete** ya rename kar dena best practice (extra safety).

---

## 4. What we added in code

- **HTTPS** redirect when `APP_ENV=production`
- **Security headers** (X-Frame-Options, nosniff, HSTS on HTTPS)
- **Login rate limit** — 10 attempts per minute (admin, customer, provider)
- **Block `/core/*`** from browser (Apache)
- **APP_KEY missing** → 503 instead of broken site

---

## 5. Server checklist (hosting)

- [ ] SSL certificate (Let’s Encrypt / Cloudflare “Full strict”)
- [ ] Document root = **`Files/`** (not `Files/core/public`)
- [ ] `composer install --no-dev --optimize-autoloader` on server
- [ ] `npm run build` already in repo / CI — don’t run dev server in production
- [ ] File permissions: `storage/` and `bootstrap/cache/` writable by PHP only
- [ ] MySQL user: **least privilege** (not root on public server)
- [ ] Strong **admin** password + change default demo users
- [ ] SMTP / payment keys only in `.env`, not in admin UI screenshots
- [ ] Daily DB backup + off-site copy
- [ ] Optional: Cloudflare WAF, fail2ban on SSH

---

## 6. Behind Cloudflare / reverse proxy

If HTTPS terminates at the proxy, set trusted proxies in `bootstrap/app.php` or env (see Laravel 11 docs) so `ForceHttps` and sessions work.

---

## 7. Before client QA

1. `APP_DEBUG=false` verify — trigger a 404; no Laravel debug page.
2. Open `https://domain.com/core/.env` → must **403/404**, not download.
3. Open `https://domain.com/install/` after go-live → **404/blocked**.
4. Admin → change a setting with `DEMO_MODE=true` → blocked message.
5. Run `php artisan migrate:status` — all required migrations **Ran**.

---

## 8. If something breaks after hardening

- Local dev: keep `APP_ENV=local`, `APP_DEBUG=true` — HTTPS middleware skipped on localhost.
- Re-install: temporarily remove `installed.lock` and `.htaccess` install rule (dev only).
