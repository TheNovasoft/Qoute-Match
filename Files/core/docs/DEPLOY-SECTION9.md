# Section 9 — Server Deploy (pull + database)

**No seed files or manual SQL.** After code is on `main`, run migrations once.

## Steps

```bash
git pull origin main
cd Files/core
php artisan migrate --force
php artisan optimize:clear
php artisan config:clear
php artisan view:clear
```

Hard refresh the browser (Ctrl+F5).

## What migrations add (schema only — no demo data)

| Change | Purpose |
|--------|---------|
| `jobs.view_count`, `jobs.quote_validity_days` | Job views + quote validity setting |
| `bids.expires_at` | Per-quote expiry |
| `users.last_seen_at`, `users.availability_status` | Provider online/away/offline |
| Table `provider_services` | Service packages |
| Table `buyer_saved_payment_methods` | Saved deposit gateways |

Migration `2026_09_11_000001_ensure_section9_schema` is **idempotent**: safe if earlier Section 9 migrations ran partially or tables already existed.

## Optional (emails)

Add admin notification template **`DAILY_DIGEST`** (shortcodes: `name`, `summary`, `dashboard_link`) and ensure SMTP is configured. Cron should run `php artisan schedule:run` (includes `digest:send-daily` at 08:00).

## Verify

```bash
php artisan migrate:status
```

Look for `2026_09_09_000001_add_section9_features`, `2026_09_10_000001_add_sort_order_to_provider_services`, and `2026_09_11_000001_ensure_section9_schema` as **Ran**.
