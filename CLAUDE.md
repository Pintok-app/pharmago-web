# CLAUDE.md — pharmago-web

Guidance for Claude Code working in this repo. This is the **web dashboard** (pharmacist + admin) of PharmaGo.

## PharmaGo — project overview (shared across all repos)

PharmaGo (Notion codename "Pintok") is an MVP medication-delivery service for the owner's own
pharmacy chain, launching in **Shimbay** (Karakalpakstan, Uzbekistan). Integrates with **F-Apteka**
(FOM Group inventory) — currently **mock data**; real API blocked on FOM Group.

**Repos** (GitHub org `github.com/Pintok-app`, local under `C:\Users\Akilbek.Urinbaev\Desktop\pharmaGo\`):
- **pharmago-api** — NestJS + Prisma + PostgreSQL + Redis backend (branch `master`)
- **pharmago-app** — React Native + Expo mobile app (branch `master`)
- **pharmago-web** — this repo: React + Vite pharmacist/admin dashboard (branch `master`)
- **pharmago-bot** — Telegram bot for pharmacist notifications (branch `main`)

**Seeded test logins:** pharmacist `shimbay1`/`pharma123` (Shimbay-1); admin `admin`/`admin123`.
SMS isn't live — the **4-digit code prints in the pharmago-api console**.

## This repo

**Stack:** Vite + React 19 + TypeScript (strict) + Tailwind CSS v4 (`@tailwindcss/vite`) + React Router v6 + Axios + `@microsoft/fetch-event-source` (SSE with auth header support) + `date-fns`.

**Commands:**
- `npm run dev` — dev server at http://localhost:5173
- `npm run build` — production build
- API base URL from `VITE_API_URL` env var (defaults to `http://localhost:3000` in `.env.local`)

**Auth:** login/logout via `localStorage` keys `pg_token`, `pg_role`, `pg_user`. The login page
tries `/auth/pharmacist-login` first, falls back to `/auth/admin-login`. After login:
- `role === 'pharmacist'` → `/pharmacist/orders`
- `role === 'admin'` → `/admin/dashboard`

**Structure (`src/`):**
- `lib/api.ts` — Axios instance (attaches Bearer token, redirects to /login on 401)
- `store/authStore.ts` — `getAuth()` / `saveAuth()` / `clearAuth()` for localStorage
- `hooks/useSound.ts` — Web Audio API beep (880Hz, 0.5s)
- `components/` — `ProtectedRoute`, `StatusBadge`, `CountdownTimer`
- `pages/LoginPage.tsx` — shared login for both roles
- `pages/pharmacist/` — `PharmacistLayout` (top nav) + 4 pages
- `pages/admin/` — `AdminLayout` (left sidebar) + 5 pages

**Pharmacist pages** (need running API at localhost:3000):
- **NewOrdersPage** — `GET /pharmacist/orders` (AWAITING_PHARMACY filter) + SSE `/pharmacist/orders/stream`; beeps on new order + every 30s while unconfirmed; 5-min countdown per order; preset reject reasons dropdown
- **CollectingPage** — PHARMACY_COLLECTING orders; item checklist; confirm via `PATCH /pharmacist/orders/:id/confirm`
- **ActiveOrdersPage** — PHARMACY_CONFIRMED through ARRIVED; manual refresh
- **HistoryPage** — COMPLETED/CANCELLED/RETURNED/PHARMACY_REJECTED/PHARMACY_TIMEOUT

**Admin pages:**
- **DashboardPage** — `GET /admin/stats` stat cards + `GET /admin/orders` table; filters: single date + date range toggle, status, order number, pagination
- **PharmaciesPage** — lists via `GET /cities` → `GET /cities/:id/pharmacies`; open/close via `PATCH /admin/pharmacies/:id/open|close`
- **DriversPage** — list by city + create + deactivate
- **PharmacistsPage** — list by pharmacy + create
- **SettingsPage** — `delivery_fee_flat` and `free_delivery_before_hour` via `PATCH /admin/settings { key, value }`

**SSE note:** uses `@microsoft/fetch-event-source` (not native `EventSource`) because the backend's
`/pharmacist/orders/stream` requires a JWT Authorization header, which native EventSource can't send.

## Gotchas
- Tailwind v4 — no `tailwind.config.js`; customization in `src/index.css` via `@theme {}`
- Brand green `#16a273`, dark variant `#13916a`, mint `#dcf8ea`
- After backend re-seed, pharmacist IDs change; log out and log back in
