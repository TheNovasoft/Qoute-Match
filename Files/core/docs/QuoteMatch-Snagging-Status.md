# QuoteMatch — Snagging List Status Report

**Document:** Remaining Points & Test Checklist  
**Date:** September 8, 2026  
**Project:** Olance / QuoteMatch Marketplace  
**Purpose:** Track what is done, what remains, and what needs manual QA before launch

---

## How to Read This Document

This project had **two separate lists**:

| List | Meaning | Who Does It |
|------|---------|-------------|
| **Modification List** | Code changes and UX improvements | Developer |
| **Test Snagging List** | Manual verification before go-live | Tester / You |

**Snagging** = final inspection to find bugs, broken flows, and missing items before launch.

---

# PART A — What Is Already Done

## Phase 1 (August 24, 2026)

### 1. Language & Labels
- Customer dashboard: Quotes Received, Payment on Hold, Work in Progress, Waiting for Your Approval
- Provider dashboard: Quotes Sent, Find Jobs, Quote Tokens
- Sidebar: My Jobs, Payments & Billing, Get Help, Extra Login Protection
- Public: Send Your Quote, Find Jobs (header/footer)
- Shortlist → Save to Favorites
- KYC → Verify Your Identity
- Deposit → Add Money
- Support Ticket → Get Help

### 2. Empty States
- Job List → "No jobs yet" + Post Job button
- Compare Quotes → friendly waiting card with Edit/View
- Providers browse → helpful message
- Job Details → "No quotes yet"
- Talent Profile → "No reviews yet"

### 3. Navigation
- Duplicate misleading "Compare Quotes" link removed
- Financial items grouped under **Payments & Billing**
- Trial Tasks link (when feature enabled)

### 4. Onboarding & Guidance
- Getting Started checklist on Customer + Provider dashboards
- New user welcome banner on customer dashboard
- Profile education skip button improved
- Help tooltips on dashboard widgets

### 5. Compare Quotes UX
- `window.alert/confirm` replaced with styled modals
- Recommended flow: Save → Message → Accept
- Payment Protection explanation
- Accept Quote = primary button
- Shortlist → Save to Favorites

### 6. Forms & Errors
- Job Details quote modal: validation errors show
- Estimated time placeholder: "e.g. 2 weeks"
- Policy text fix on Job Details page

### 7. New Shared Components
- `ConfirmModal.jsx`
- `HelpTooltip.jsx`
- `GettingStartedChecklist.jsx`
- Enhanced `EmptyState` with CTA button

---

## Phase 2 — 10 Bigger Features (August 24, 2026)

| # | Feature | Status |
|---|---------|--------|
| 1 | Milestone payments | Foundation — UI + MilestoneService |
| 2 | Provider gigs/packages | CRUD backend + dashboard pages |
| 3 | Dispute open/reply | Buyer + Provider thread + reply form |
| 4 | FAQ page | `/faq` + footer link |
| 5 | Simple/Advanced sidebar | Customer + Provider — localStorage toggle |
| 6 | Quote step wizard | Price → Timeline → Proposal → Review |
| 7 | Compare mobile cards | Cards on mobile, table on desktop |
| 8 | Job post preview + budget helper | Review screen + category budget suggestions |
| 9 | Re-hire button | "Hire Again" on completed projects |
| 10 | Daily email digest | `digest:send-daily` command, schedule 08:00 |

**Manual steps after Phase 2:**
- Run migration for: `dispute_messages`, `project_milestones`, `provider_services` (see also `2026_09_09_000001_add_section9_features.php`)
- Add notification template `DAILY_DIGEST` in admin (shortcodes: `name`, `summary`, `dashboard_link`) for digest emails
- Verify SMTP for digest emails if configured

---

## Part 1 Sections 1–5 (August 27, 2026)

- React + Blade labels updated across portals
- Compare Quotes: timeline + Share job link button
- JobProgressTimeline component
- Job post success screen with timeline
- Payments & Billing dropdown in sidebar
- Category field layman hints (HS code, CBM, etc.)
- PR #30: Forms & Wizards improvements

---

## Recent Work (September 2026)

| Item | PR / Status |
|------|-------------|
| Job post progressive flow (Freelancer.pk-style) | PR #32 — Merged |
| Header nav simplify + Join button | PR #33 — Merged |
| Extra → Explore dropdown label | PR #34 — Merged |
| Job post translation (Urdu, cache, CBM labels) | Merged in job-post flow |

---

# PART B — Modification List: Remaining Points

## Section 6 — Compare Quotes UX (Partial)

- [ ] Filter panel: help text for each filter option
- [ ] Single quote state: clearer "waiting for more quotes" message

---

## Section 7 — Notifications & Errors (Mostly Pending)

- [ ] Friendly notification copy (email + in-app)
- [ ] Error messages with "What to do next" call-to-action
- [ ] Insufficient balance: modal with **Add Money** button (not plain alert)
- [ ] Generic errors: replace "Please refresh" with actionable guidance

---

## Section 8 — Mobile Improvements (Done — PR #37)

| Item | Status |
|------|--------|
| Compare Quotes mobile cards | Done |
| Home banner: hero image on mobile | Done |
| Filter row: full-width stacked on small screens | Done |
| Sidebar: collapsible sections | Done (customer + provider) |
| Bid/quote modal: mobile-friendly stacking | Done |

---

## Section 9 — New Features (Done — PR #39)

| Feature | Status |
|---------|--------|
| Quote expiry date setting | Done — per-job validity days + bid `expires_at` |
| Provider online/offline status | Done — availability + last-seen presence |
| Job view counter for customers | Done — `view_count` on job view page |
| Export transactions CSV | Done — buyer + provider export button |
| Saved payment methods | Done — remembers last-used gateway on deposit |
| Milestones full escrow split | Done — partial escrow payout on approve |
| Service packages on public profile | Done — CRUD + public Talent Profile listing |
| Daily digest actual email delivery | Done — `digest:send-daily` scheduled 08:00 |

---

## Section 10 — Admin Improvements (Done — PR pending)

| Item | Status |
|------|--------|
| Bulk notification segments | Done — in-app/WhatsApp via validation, cooling time fix, segment counts for All Users/Buyers |
| Form builder editor UX | Done — responsive field rows, CBM/country/city types in modal, clearer save copy, allow clearing all fields |
| Notification channels hub | Done — React page at `/admin/notification/channels` |
| Remaining Blade settings → React | Optional follow-up (general, gateways, KYC, etc.) |

---

## Other Small Gaps

- [ ] **Unify terms:** Job / Request / Project — use one consistent term across entire app
- [ ] Some legacy Blade/admin pages may still show old labels (Bid, Deposit, etc.)
- [ ] Verify migrations ran: `dispute_messages`, `project_milestones`, `provider_services`

---

# PART C — Test Snagging List (Manual QA)

> **Note:** This entire section is for **manual testing**. Nothing here is auto-complete — each checkbox must be verified in the browser.

---

## Customer — Registration & Auth

- [ ] Register (individual + business)
- [ ] Register with existing email → error + login link
- [ ] Social login (Google, etc.)
- [ ] Login / logout
- [ ] Forgot password → code → reset
- [ ] Profile completion gate blocks dashboard
- [ ] Email verification flow
- [ ] SMS verification flow
- [ ] 2FA enable / disable / login with 2FA
- [ ] Guest job post → auto account create + auto login

---

## Customer — Job Posting

- [ ] Guest post job (full wizard, all steps)
- [ ] Authenticated post job (3-step wizard)
- [ ] Save as draft
- [ ] Edit draft job
- [ ] Publish job
- [ ] Dynamic category form fields load correctly
- [ ] Slug uniqueness check
- [ ] Job edit blocked after hire
- [ ] Admin approval flow (manual + auto)
- [ ] Job post success page displays
- [ ] Screening questions save correctly
- [ ] Budget / deadline validation

---

## Customer — Quotes & Hiring

- [ ] Compare Quotes page loads with bids
- [ ] Sort (price, rating, availability, newest)
- [ ] Filters (KYC, insurance, price range, shortlisted)
- [ ] Shortlist / unshortlist quote
- [ ] Reject quote
- [ ] Request quote revision
- [ ] Message provider from quote page
- [ ] Hire provider (escrow ON — balance deduct)
- [ ] Hire provider (escrow OFF)
- [ ] Insufficient balance error on hire
- [ ] Other pending quotes rejected on hire
- [ ] Empty state when no quotes
- [ ] Single quote comparison message

---

## Customer — Projects

- [ ] Project list (running, reviewing, completed)
- [ ] Project detail view
- [ ] Download deliverables
- [ ] Mark complete + structured review
- [ ] Edit review after completion
- [ ] Report project → dispute created
- [ ] Trial task assign / complete / cancel (if enabled)

---

## Customer — Payments

- [ ] Deposit (each enabled gateway)
- [ ] Manual deposit → pending → admin approve
- [ ] Deposit history
- [ ] Withdraw (KYC required gate)
- [ ] Withdraw history
- [ ] Transaction log accurate
- [ ] Invoices generate (publish, hire, complete)
- [ ] Escrow hold / release amounts correct
- [ ] Wallet balance display accurate

---

## Customer — Communication

- [ ] Chat inbox loads
- [ ] Send text message
- [ ] Send file attachment
- [ ] Quote-gated chat (before/after accept)
- [ ] Contact masking until quote accepted
- [ ] Block / unblock conversation
- [ ] Delete conversation
- [ ] Real-time message (Pusher)
- [ ] Unread count badge updates
- [ ] Support ticket create / reply / close
- [ ] Notifications inbox + mark read

---

## Customer — Other

- [ ] KYC form submit → pending → approved/rejected
- [ ] Profile settings update
- [ ] Change password
- [ ] Saved searches save / load / delete
- [ ] Talent invite from provider profile
- [ ] Disputes list + detail view
- [ ] Sidebar all links correct destination
- [ ] Mobile responsive all pages

---

## Provider — Registration & Profile

- [ ] Register (business, service areas, subcategories)
- [ ] Admin approval required before quoting
- [ ] Profile Step 1: Skills
- [ ] Profile Step 2: Basic info
- [ ] Profile Step 3: Education (skip works)
- [ ] Profile Step 4: Portfolio (min 1 item)
- [ ] Work profile complete flag set
- [ ] Public profile page displays correctly
- [ ] Verification badges upload (insurance, company, licence)
- [ ] KYC submit / approve / reject
- [ ] Incomplete profile banner shows correct step

---

## Provider — Jobs & Quotes

- [ ] Browse jobs (public /jobs)
- [ ] Job detail + match score bars
- [ ] Postcode area match badge
- [ ] Submit quote (structured form)
- [ ] Quote blocked if not approved
- [ ] Quote blocked if profile incomplete
- [ ] Lead credit deducted on quote (if monetisation ON)
- [ ] Max 2 quote attempts enforced
- [ ] Edit pending quote
- [ ] Withdraw quote
- [ ] Bid list page all statuses

---

## Provider — Projects

- [ ] Project list all statuses
- [ ] Project detail
- [ ] Upload deliverable
- [ ] Download customer files
- [ ] Rate customer (buyer review)
- [ ] Report project
- [ ] Trial task accept / upload (if enabled)

---

## Provider — Finance

- [ ] Earnings credited on project complete
- [ ] Commission deducted correctly
- [ ] Withdraw (KYC gate)
- [ ] Withdraw history
- [ ] Transaction log
- [ ] Invoices
- [ ] Lead credits purchase (packages + subscription)
- [ ] Wallet balance accurate

---

## Provider — Communication

- [ ] Chat with customer
- [ ] Real-time messages
- [ ] Notifications inbox
- [ ] Support tickets
- [ ] Disputes view

---

## Admin

- [ ] Login / logout
- [ ] Marketplace dashboard KPIs accurate
- [ ] Job list all scopes (pending, approved, published, etc.)
- [ ] Job approve / reject / delete
- [ ] Bid list + detail + delete
- [ ] Project list all statuses
- [ ] Project complete / reject / partial complete
- [ ] Project conversation view
- [ ] Remove buyer / provider review
- [ ] Dispute in-review / resolve / reject
- [ ] Provider pending approval queue
- [ ] Provider approve / ban / impersonate login
- [ ] Provider KYC approve / reject
- [ ] Provider balance adjust + lead credits grant
- [ ] Buyer list all segments
- [ ] Buyer KYC approve / reject
- [ ] Provider verification approve / reject
- [ ] Review moderation (approve, hide, verify, investigate)
- [ ] Deposit approve / reject (manual)
- [ ] Withdrawal approve / reject
- [ ] Withdraw methods CRUD
- [ ] Monetisation settings + packages + plans
- [ ] Categories / subcategories / skills CRUD
- [ ] Marketplace form builder
- [ ] Support ticket reply / close
- [ ] Transaction report + financial analytics
- [ ] Notification templates send test
- [ ] General settings save (escrow, trial task, auto approve)
- [ ] CMS pages / frontend sections
- [ ] Language manager

---

## Public Website

- [ ] Homepage loads + CTAs work
- [ ] Browse jobs + filters
- [ ] Job detail (guest view)
- [ ] Browse providers + filters
- [ ] Provider public profile
- [ ] Guest post job flow
- [ ] Location pages (/locations)
- [ ] Category + location SEO pages
- [ ] Legal pages (privacy, terms)
- [ ] Sitemap.xml + robots.txt
- [ ] Contact form
- [ ] Blog pages
- [ ] Cookie consent
- [ ] Mobile responsive all public pages
- [ ] Header nav: Home, About, Category, Blogs, Contact, Explore
- [ ] Join button → customer registration

---

## Cross-Cutting / Edge Cases

- [ ] Escrow ON vs OFF full hire-to-complete flow
- [ ] Monetisation ON vs OFF quote submission
- [ ] Trial task ON vs OFF
- [ ] Job auto-approve ON vs OFF
- [ ] Provider approval required ON vs OFF
- [ ] Review moderation ON vs OFF
- [ ] Multi-language switch (if enabled)
- [ ] Session timeout + re-login
- [ ] File upload size limits
- [ ] XSS in chat messages (sanitizer)
- [ ] Unauthorized access (buyer URL as provider, vice versa)
- [ ] Legacy URL redirects (/buyer → /customer, /freelancer → /provider)
- [ ] Payment gateway IPN callbacks
- [ ] Email notifications fire for all key events
- [ ] SMS / WhatsApp notifications (if configured)
- [ ] Balance never goes negative
- [ ] Concurrent hire attempts (same job, two tabs)
- [ ] Browser back button during wizard
- [ ] Form validation all required fields
- [ ] 404 / 500 error pages display

---

# PART D — Recommended Next Steps

## Priority 1 — Quick UX Wins
1. Section 7: Notifications & Errors (Add Money modal, friendly errors)
2. Section 8: Remaining mobile polish

## Priority 2 — Manual Testing
3. Run full Customer flow: post job → receive quote → hire → complete
4. Run Provider flow: browse → quote → deliver
5. Tick Test Snagging List section by section

## Priority 3 — New Features
6. Quote expiry date setting
7. Export transactions CSV
8. Job view counter
9. Provider online/offline status
10. Saved payment methods

## Priority 4 — Admin & Polish
11. Form builder UX simplify
12. Bulk notifications
13. Unify Job/Request/Project terminology app-wide

---

**End of Document**
