# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint (eslint .)

# Seed the packages_cache table from the eSIM Access API (run once or to refresh)
node scripts/seed-packages.js
```

> **Note (Windows):** `dev` and `build` use `--webpack` instead of Turbopack. Turbopack has a Windows bug with bracket-named directories (`[orderId]`, `[locale]`). Remove the `--webpack` flag once the Turbopack team fixes path resolution on Windows.

## Stack Versions

- Next.js 16.1 (upgraded from 15.2) — Turbopack stable, React Compiler available, `proxy.ts` replaces `middleware.ts`
- next-intl 4.x (upgraded from 3.x)
- React 19.2

## Architecture Overview

**Gosimy** is an eSIM e-commerce storefront built on Next.js 15 App Router. Customers browse eSIM data plans, pay via Stripe, and receive QR codes by email.

### Routing

All user-facing pages live under `app/[locale]/` (i18n via `next-intl`). Supported locales: `en`, `de`, `fr`, `es`. The root `app/page.tsx` immediately redirects to `/en`. Locale is always present in the URL (`localePrefix: 'always'`).

**Pages:**
- `[locale]/` — Marketing homepage
- `[locale]/shop` — Package browser (search + region filter)
- `[locale]/shop/[countryCode]` — Country-specific packages
- `[locale]/checkout/success` and `/cancel` — Post-payment pages
- `[locale]/portal` — Authenticated user's eSIM dashboard
- `[locale]/portal/[orderId]` — Order detail
- `[locale]/auth/login` — Auth page
- `[locale]/profile` — User profile

**API Routes:**
- `POST /api/checkout/create-session` — Creates Stripe Checkout session, persists order to DB
- `POST /api/webhooks/stripe` — Stripe webhook handler; triggers fulfillment on `checkout.session.completed`
- `GET /api/esim/packages?country=XX` — Returns packages (from Supabase cache or live from provider)
- `GET /api/esim/destinations` — Country/region list
- `GET /api/esim/query/[iccid]` — Live eSIM status query
- `POST /api/webhooks/esim-access` — eSIM Access push notifications
- `GET /[locale]/auth/callback` — Supabase OAuth callback

### Provider Abstraction (`lib/providers/`)

The `IEsimProvider` interface (`lib/providers/types.ts`) decouples the app from any single eSIM supplier. Currently only `esim_access` is implemented. To add a provider: create a new folder under `lib/providers/`, implement `IEsimProvider`, and register it in the `createProvider` switch in `lib/providers/index.ts`.

Pricing markup is applied in `lib/providers/esim-access/adapter.ts` (`calcRetailPriceCents`):
- Cost < $10 USD → 2.0× multiplier
- $10–20 → 1.75×
- > $20 → 1.5×
- Charm pricing: rounds up to next dollar, then subtracts $0.01 (e.g. $7.20 → $7.99)
- Output is **USD cents**.

### Fulfillment Flow

1. Stripe webhook receives `checkout.session.completed`
2. Order status set to `paid`
3. `fulfillOrder()` (`lib/fulfillment/fulfill-order.ts`) is called asynchronously (Stripe gets 200 immediately)
4. For each `order_item`: calls `provider.placeOrder()` → gets a `providerOrderNo`
5. Polls `provider.queryEsim(providerOrderNo)` with exponential back-off until `smdpStatus = RELEASED`
6. Updates `esims` table with ICCID, QR code URL, activation code
7. Sends delivery email via Resend (`lib/email/send.ts`) using a React Email template
8. Order status → `fulfilled`

### State Management

Cart is managed with Zustand and persisted to `localStorage` under the key `gosimy-cart`. `volumeBytes` is stored as a `string` (BigInt serialization).

### Supabase Client Usage

- **Browser (Client Components):** `createSupabaseBrowserClient()` from `lib/supabase/client.ts` — singleton, uses anon key
- **Server Components / Route Handlers:** `createSupabaseServerClient()` from `lib/supabase/server.ts` — cookie-aware
- **Admin operations** (bypassing RLS, webhook handlers, fulfillment): `createSupabaseAdminClient()` from `lib/supabase/server.ts` — uses `SUPABASE_SERVICE_ROLE_KEY`

### Middleware (`middleware.ts`)

Runs on every non-static request. First refreshes Supabase auth session (`updateSession`), then applies `next-intl` locale routing.

### i18n

Translation messages are in `messages/{locale}.json`. Use `getTranslations()` / `useTranslations()` from `next-intl`. Locale params are `Promise<{ locale: string }>` in Next.js 15 (must be awaited).

### Path Alias

`@/*` resolves to the repo root (configured in `tsconfig.json`).

## Environment Variables

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ESIM_ACCESS_API_KEY` | eSIM Access API key |
| `ESIM_ACCESS_SECRET_KEY` | eSIM Access secret key |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender address (default: `orders@gosimy.io`) |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `http://localhost:3000`) |

## Database Tables (Supabase)

- `packages_cache` — eSIM packages cached from provider (24h TTL, upsert on `package_code`)
- `orders` — order records with status: `pending → paid → fulfilling → fulfilled / failed / expired / refunded / partially_fulfilled`
- `order_items` — one row per eSIM unit purchased (includes `fulfillment_status`, `fulfillment_error`, `retry_count`)
- `esims` — provisioned eSIM profiles (ICCID, QR code, activation code, status)
- `fulfillment_log` — tracks fulfillment attempts for idempotency
- `coupons` — discount codes (percentage or fixed amount)
- `order_coupons` — tracks coupon usage per order
- `refund_requests` — refund request management

## Stripe Integration Notes

- Checkout currency is **USD** (`unit_amount` in USD cents)
- `automatic_tax` and `invoice_creation` are enabled
- `orderId` (Supabase UUID) is stored in Stripe session `metadata` for webhook correlation
- The webhook route (`/api/webhooks/stripe`) must run in the `nodejs` runtime (not Edge) — `export const runtime = 'nodejs'` is set
- For local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Proxy (formerly Middleware)

Next.js 16 renamed `middleware.ts` → `proxy.ts`. The exported function is named `proxy` (not `middleware`). This file handles both Supabase session refresh and `next-intl` locale routing. The proxy runs on Node.js runtime only (no Edge).
