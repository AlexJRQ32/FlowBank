# PLAN.md — FlowBank Full-Stack Rewrite

> **Status:** Draft — awaiting user approval before execution.
> **Date:** 2026-09-11
> **Scope:** Replace .NET WebAPI + React/Vite SPA with Next.js (App Router) + Supabase (Postgres, Auth, RLS). Deploy both to production (Vercel + Supabase Cloud). Delete legacy backend/frontend ONLY after full parity verified.

---

## 1. Architecture Decision Record

### 1.1 Why Next.js + Supabase

| Concern | Current (.NET + React SPA) | Target (Next.js + Supabase) |
|---------|---------------------------|----------------------------|
| Backend hosting | Self-hosted .NET (Azure/Alwaysdata TBD) | Vercel serverless (zero ops) |
| Database | SQL Server LocalDB → production TBD | Supabase Postgres (managed, free tier) |
| Auth | Hand-rolled JWT in localStorage (XSS-vulnerable, plaintext passwords) | Supabase Auth (httpOnly cookies, bcrypt by default) |
| Data access | 3-layer C# (Controller → Repository → EF Core) | Supabase client + RLS policies (no server controllers for CRUD) |
| SSR/SEO | Client-side SPA (landing invisible to crawlers) | Next.js App Router (SSR landing, streaming) |
| Deployment | Frontend Vercel + backend ??? | Frontend Vercel + backend = Supabase (single bill) |

### 1.2 3-Layer → Supabase Mapping

| .NET Layer | Supabase Equivalent |
|------------|-------------------|
| **Core** (entities) | Postgres tables + generated TypeScript types (`supabase gen types`) |
| **Data** (EF Core repos) | Supabase JS client queries + RLS policies replace per-user filtering |
| **WebAPI** (controllers) | **Eliminated for CRUD** — RLS handles authorization. Server Actions / Route Handlers only for: OCR extraction, tipo cambio fetch, complex aggregations (debt calc with exchange rate) |

### 1.3 Gothic Failures to Avoid

| # | Trap | Prevention |
|---|------|------------|
| 1 | **RLS permissive by mistake** — `CREATE POLICY ... USING (true)` | Every policy reviewed against checklist: `TO authenticated` + `USING (auth.uid() = user_id)`. No `TO public` on data tables. |
| 2 | **UPDATE without SELECT policy** — silent 0-row returns | Every table with UPDATE policy MUST also have SELECT policy. |
| 3 | **UPDATE without WITH CHECK** — user reassigns `user_id` to another user | All UPDATE policies include `WITH CHECK` matching the USING clause (direct `auth.uid() = user_id`, or join subquery for `facturas` where ownership flows via `tarjeta_id`). |
| 4 | **service_role key in client** — bypasses all RLS | `NEXT_PUBLIC_SUPABASE_ANON_KEY` only in browser. `SUPABASE_SERVICE_ROLE_KEY` only in Server Actions / Route Handlers, never in `"use client"` code. |
| 5 | **Auth session lost on SSR** — redirect loops | Use `@supabase/ssr` `createServerClient` in middleware.ts + layout.tsx. Cookie-based sessions, NOT localStorage. |
| 6 | **Missing indices on FK columns** — slow joins | Every `user_id`, `tarjeta_id`, `banco_id` gets an index. `facturas` RLS joins rely on `idx_facturas_tarjeta_id` + `idx_tarjetas_user_id`. |
| 7 | **Views bypass RLS** (Postgres 15+) | Use `security_invoker = true` on any view. |
| 8 | **`auth.role()` deprecated** — breaks with anon sign-in | Use `TO authenticated` clause, not `auth.role()` in policy body. |
| 9 | **SECURITY DEFINER in public schema** — callable by anon | Keep privileged functions in non-exposed schema + explicit `auth.uid()` check in body. |
| 10 | **JWT in localStorage** (current XSS vulnerability) | Supabase httpOnly cookies via `@supabase/ssr`. |
| 11 | **Next.js caches Server Components / Route Handlers** — auth data leaks between users | Every Route Handler and Server Component that reads auth MUST set `export const dynamic = 'force-dynamic'`. Never rely on default caching for authenticated content. |

---

## 2. Data Model Migration

### 2.1 Entity → Table Mapping

Source: `backend/FlowBank.Core/Entities/*.cs` + `FlowBankDbContext.cs`

| .NET Entity | Postgres Table | Key Columns | Notes |
|-------------|---------------|-------------|-------|
| `Usuario` | **Eliminated** — Supabase Auth `auth.users` manages identity | — | Profile fields (nombre, apellido) → new `profiles` table linked by `id = auth.users.id` |
| `Banco` | `bancos` | `id uuid PK`, `nombre text UNIQUE NOT NULL`, `logo_url text`, `es_activo bool DEFAULT true` | Seed table, no user_id. Readable by all authenticated users. |
| `Tarjeta` | `tarjetas` | `id uuid PK DEFAULT gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `banco_id uuid NOT NULL REFERENCES bancos(id)`, `nombre text`, `ultimos_cuatro_digitos text`, `tipo text`, `dia_corte int`, `dia_pago int`, `limite_credito numeric(18,2)`, `saldo_actual numeric(18,2) DEFAULT 0`, `nota text`, `es_activa bool DEFAULT true`, `created_at timestamptz DEFAULT now()` | RLS: user sees only own cards. **Deliberate change (adversarial review):** `ON DELETE CASCADE` added — deleting an auth user removes their cards (and, via cascade, their facturas/registros_pago), preventing orphaned rows that would violate RLS assumptions. |
| `Factura` | `facturas` | `id uuid PK`, `tarjeta_id uuid NOT NULL REFERENCES tarjetas(id) ON DELETE CASCADE`, `monto_total numeric(18,2)`, `moneda text DEFAULT 'CRC' CHECK (moneda IN ('CRC','USD'))`, `fecha_compra date`, `comercio text`, `imagen_url text`, `created_at timestamptz DEFAULT now()` | RLS: via tarjeta ownership (join subquery). **Deliberate change (adversarial review):** `user_id` REMOVED — ownership is derived through `tarjeta_id → tarjetas.user_id` (single source of truth, no denormalization drift). `tarjeta_id` is now NOT NULL + ON DELETE CASCADE (deleting a card removes its facturas). |
| `RegistroPago` | `registros_pago` | `id uuid PK`, `tarjeta_id uuid NOT NULL REFERENCES tarjetas(id) ON DELETE CASCADE`, `fecha_pago date`, `fecha_realizada timestamptz`, `monto numeric(18,2)`, `estado text`, `nota text` | RLS: via tarjeta ownership (join or policy function). |
| *(new)* | `profiles` | `id uuid PK REFERENCES auth.users(id) ON DELETE CASCADE`, `nombre text`, `apellido text`, `created_at timestamptz DEFAULT now()` | Replaces Usuario entity. Populated on signup via trigger. |
| *(new)* | `tipo_cambio_cache` | `id uuid PK`, `compra numeric`, `venta numeric`, `fecha date UNIQUE` | Replaces in-memory cache. Populated by cron / server action. |

### 2.2 RLS Policies (per table)

```
bancos:
  SELECT → TO authenticated (any logged-in user can read banks)
  INSERT/UPDATE/DELETE → NO policy created (denies all for anon + authenticated; seed/maintenance via service_role only)
  -- Adversarial review fix: original draft had write policies TO anon.

tarjetas:
  SELECT → TO authenticated USING (auth.uid() = user_id)
  INSERT → TO authenticated WITH CHECK (auth.uid() = user_id)
  UPDATE → TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
  DELETE → TO authenticated USING (auth.uid() = user_id)

facturas:
  -- No user_id column; ownership via tarjeta_id → tarjetas.user_id join.
  SELECT → TO authenticated USING (tarjeta_id IN (SELECT id FROM tarjetas WHERE user_id = auth.uid()))
  INSERT → TO authenticated WITH CHECK (tarjeta_id IN (SELECT id FROM tarjetas WHERE user_id = auth.uid()))
  DELETE → TO authenticated USING (tarjeta_id IN (SELECT id FROM tarjetas WHERE user_id = auth.uid()))

registros_pago:
  SELECT → TO authenticated USING (tarjeta_id IN (SELECT id FROM tarjetas WHERE user_id = auth.uid()))
  INSERT → TO authenticated WITH CHECK (tarjeta_id IN (SELECT id FROM tarjetas WHERE user_id = auth.uid()))
  UPDATE → same pattern with USING + WITH CHECK
  DELETE → same USING pattern

profiles:
  SELECT → TO authenticated USING (auth.uid() = id)
  UPDATE → TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)

tipo_cambio_cache:
  SELECT → TO authenticated (any user can read exchange rates)
  INSERT/UPDATE → service_role only (server action populates)
```

### 2.3 Indices

```sql
CREATE INDEX idx_tarjetas_user_id ON tarjetas(user_id);
CREATE INDEX idx_tarjetas_banco_id ON tarjetas(banco_id);
CREATE INDEX idx_facturas_tarjeta_id ON facturas(tarjeta_id);
CREATE INDEX idx_registros_pago_tarjeta_id ON registros_pago(tarjeta_id);
```

> Note: `idx_facturas_user_id` removed — the `user_id` column no longer exists on `facturas`. The join-based RLS policies use `idx_facturas_tarjeta_id` + `idx_tarjetas_user_id`.

### 2.3.1 Pre-Migration Check (facturas.user_id removal)

Run before applying the facturas migration to a database that already contains data (local or cloud), to surface rows that would violate the new `tarjeta_id NOT NULL` constraint:

```sql
-- Facturas without a valid tarjeta (would fail NOT NULL FK after migration)
SELECT f.id
FROM facturas f
LEFT JOIN tarjetas t ON t.id = f.tarjeta_id
WHERE f.tarjeta_id IS NULL OR t.id IS NULL;

-- Expected: 0 rows on a fresh schema. If rows exist on an existing DB,
-- resolve them (assign or delete) BEFORE applying the migration.
```

### 2.4 Migration Files (Supabase CLI)

```
supabase/migrations/
  00000000000001_create_bancos.sql
  00000000000002_create_profiles.sql
  00000000000003_create_tarjetas.sql
  00000000000004_create_facturas.sql
  00000000000005_create_registros_pago.sql
  00000000000006_create_tipo_cambio_cache.sql
  00000000000007_enable_rls_and_policies.sql
  00000000000008_create_indices.sql
  00000000000009_seed_bancos.sql          -- CR banks (created from scratch — source repo has NO seed data; see note below)
  00000000000010_create_profile_trigger.sql -- auto-create profile on auth.users insert
```

> **Seed note (adversarial review):** the source repository contains no seed data for `bancos`. The seed will be created from scratch with Costa Rican banks: BAC Credomatic, Banco de Costa Rica, Banco Nacional, BCR, Promerica, Davivienda, Scotiabank, JBS. **Confirm final list with user before seeding.**

---

## 3. Auth Mapping

### 3.1 Current Auth (from `AuthController.cs` + `TokenService.cs`)

| Feature | Current Implementation | Issue |
|---------|----------------------|-------|
| Register | `POST /api/auth/register` — name + email + password (plaintext!) | Passwords stored as plaintext (code has TODO for BCrypt) |
| Login | `POST /api/auth/login` — email + password, returns JWT | JWT in localStorage (XSS risk) |
| Google OAuth | `POST /api/auth/google` — Google access token → verify → upsert user | Partially wired in backend, not confirmed in frontend |
| Session | JWT 7-day expiry in `localStorage` (`flowbank_token`) | No refresh, no server-side session |

> **Email normalization note:** Supabase Auth normalizes emails to lowercase. Always call `.toLowerCase()` on the email before `signUp` / `signInWithPassword` to avoid duplicate-looking accounts and case-mismatch failures.

### 3.2 Target Auth (Supabase Auth)

| Feature | Implementation |
|---------|---------------|
| Register | `supabase.auth.signUp({ email, password })` → auto-creates `auth.users` row → trigger creates `profiles` row |
| Login | `supabase.auth.signInWithPassword({ email, password })` → sets httpOnly cookie |
| Session | `@supabase/ssr` cookie-based sessions. `middleware.ts` refreshes session on every request. |
| Server-side auth | `createServerClient()` in Server Components / Server Actions reads cookie, gets `user`. |

### 3.3 Session Flow

```
Browser → middleware.ts (refreshes Supabase session cookie)
        → Layout (createServerClient → getUser → redirect /login if null)
        → Server Component (reads user from cookie; `export const dynamic = 'force-dynamic'` — see Gothic Failure #11)
        → Server Action (reads user from cookie, RLS enforces row-level access)
```

---

## 4. Frontend Migration

### 4.1 Route Mapping (react-router → Next App Router)

Source: `frontend/src/App.tsx`

| Current Route | Next.js App Router Path | File |
|---------------|------------------------|------|
| `/` (LandingPage) | `/` | `app/(public)/page.tsx` |
| `/login` (LoginPage) | `/login` | `app/(public)/login/page.tsx` |
| `/registro` (RegisterPage) | `/registro` (URL kept — parity with current app, Spanish) | `app/(public)/registro/page.tsx` |
| `/dashboard` (DashboardPage) | `/dashboard` | `app/(app)/dashboard/page.tsx` |
| `/dashboard/tarjetas` | `/dashboard/tarjetas` | `app/(app)/dashboard/tarjetas/page.tsx` |
| `/dashboard/facturas` | `/dashboard/facturas` | `app/(app)/dashboard/facturas/page.tsx` |
| `/dashboard/alertas` | `/dashboard/alertas` | `app/(app)/dashboard/alertas/page.tsx` |
| `/dashboard/perfil` | `/dashboard/perfil` | `app/(app)/dashboard/perfil/page.tsx` |

Route groups: `(public)` for unauthenticated pages (no sidebar), `(app)` for authenticated pages (sidebar layout).

### 4.2 Design System Preservation

| Asset | Source | Target |
|-------|--------|--------|
| SCSS tokens | `frontend/src/styles/abstracts/_variables.scss` | `src/styles/_tokens.scss` (kept as SCSS with `sass-embedded`); imported from `app/globals.scss` |
| Landing hero images | `frontend/src/features/landing/assets/hero-arches.png`, `logo-card.png` | `public/images/landing/` |
| Sidebar collapse pattern | `frontend/src/components/` (sidebar component) | `app/(app)/_components/sidebar.tsx` |
| Feature folder structure | `frontend/src/features/{landing,auth,dashboard,tarjetas,facturas,alertas,perfil,bancos}/` | `app/(public)/*` + `app/(app)/dashboard/*` + `components/features/*` |
| Design tokens | emerald `#0e9f6e`, blue `#1a56db` | Preserved exactly in CSS custom properties |
| Credit card visual | `$cc-gradient`, `$cc-chip` tokens | Preserved in card component styles |

### 4.3 Key Frontend Dependencies

| Current | Next.js Equivalent |
|---------|-------------------|
| `react-router` 8 | Next App Router (built-in) |
| `motion` (framer-motion) | Keep — works with Next.js |
| `sass-embedded` | Keep (`sass-embedded`, NOT `sass` — Next.js supports SCSS natively). Configure `sassOptions.includePaths: ['src/styles']` in `next.config.ts` so components can do `@use 'tokens'` without deep relative paths. |
| `fetch` client (`api.ts`) | Replace with `@supabase/ssr` client + Server Actions |
| `localStorage` auth | Replace with cookie-based Supabase session |

---

## 5. Rebuild Order (Phased)

### Phase 0: Scaffold & Supabase Setup
**Commit:** `chore: scaffold next.js app + supabase project`

- [ ] **Prerequisite check:** `docker --version` — Docker Desktop is REQUIRED for local Supabase (`supabase start` runs the stack in containers). Verify it's installed and running before anything else.
- [ ] Create `frontend-next/` folder at repo root (keep `backend/` and `frontend/` untouched)
- [ ] `npx create-next-app@latest frontend-next` — App Router, TypeScript, SCSS, ESLint, `src/` dir, Turbopack
- [ ] Install deps: `pnpm add @supabase/supabase-js @supabase/ssr sass-embedded` + `pnpm add -D supabase`
- [ ] `npx supabase init` inside `frontend-next/` (creates `supabase/` folder with migrations)
- [ ] Configure `next.config.ts`: `sassOptions.includePaths: ['src/styles']` so components do `@use 'tokens'` without deep relative paths
- [ ] Copy `_variables.scss` → `frontend-next/src/styles/_tokens.scss` (or `src/app/globals.scss` — convert to CSS custom properties or keep SCSS)
- [ ] Copy landing assets → `frontend-next/public/images/landing/`
- [ ] Configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Update `.gitignore` — add `frontend-next/.env.local`, `frontend-next/.next/`
- [ ] **OneDrive mitigation:** project lives in OneDrive-synced path. If Docker volume sync/slow I/O issues appear with local Supabase, move the repo to `C:\dev\FlowBank` (see §6.1 risk).
- [ ] **SPIKE (gate before Phase 5):** validate `tesseract.js` OCR on Vercel serverless — deploy a minimal handler with a sample factura image, measure cold-start time, memory usage, and extraction accuracy. Fallback if it fails: Google Vision API. **This spike must pass BEFORE Phase 5 starts.**
- [ ] Verify: `pnpm dev` runs, empty page loads

### Phase 1: Supabase Migrations + Types
**Commit:** `feat: database schema, RLS policies, seed data`

- [ ] Write migration files (Section 2.4) in `frontend-next/supabase/migrations/`
- [ ] `npx supabase start` (local Docker) → `npx supabase db reset` → verify tables + RLS
- [ ] `npx supabase gen types typescript --local > src/types/database.ts` — generated types
- [ ] Seed `bancos` table with Costa Rican banks — **created from scratch (source has no seed data); confirm final list with user before seeding**
- [ ] Verify: RLS policies block cross-user access in `psql`

### Phase 2: Auth Flow
**Commit:** `feat: supabase auth (email+password)`

- [ ] Create `src/lib/supabase/client.ts` (browser client) + `src/lib/supabase/server.ts` (server client) + `src/lib/supabase/middleware.ts`
- [ ] Create `middleware.ts` at root — refreshes session cookie on every request
- [ ] Create `src/app/(public)/login/page.tsx` — email+password form
- [ ] Create `src/app/(public)/registro/page.tsx` — email+password form
- [ ] Create `src/app/(public)/login/actions.ts` — Server Actions: `signInAction`, `signUpAction`, `signOutAction`
- [ ] Create database trigger: auto-insert `profiles` row on `auth.users` INSERT
- [ ] Verify: sign up → login → logout

### Phase 2b: Google OAuth (deferred — optional, post-MVP)
**Commit (when done):** `feat: google oauth sign-in`

- [ ] Enable Google OAuth in Supabase dashboard (user action)
- [ ] Create `signInWithGoogleAction` + Google button on login page
- [ ] Verify: full Google OAuth flow

> Deferred per adversarial review: ship email+password first; Google OAuth adds provider setup complexity with no MVP value.

### Phase 3: Data Layer (Typed Queries)
**Commit:** `feat: typed data access layer with Supabase client`

- [ ] Create `src/lib/queries/tarjetas.ts` — `getTarjetas()`, `getTarjetaById()`, `createTarjeta()`, `updateTarjeta()`, `deleteTarjeta()`
- [ ] Create `src/lib/queries/facturas.ts` — `getFacturas()`, `createFactura()` (inserts use `tarjeta_id` only — no `user_id`), `deleteFactura()`
- [ ] Create `src/lib/queries/bancos.ts` — `getBancos()`
- [ ] Create `src/lib/queries/tipo-cambio.ts` — `getTipoCambio()` (reads from cache table or fetches from BCCR API)
- [ ] Create `src/lib/queries/perfil.ts` — `getProfile()`, `updateProfile()`
- [ ] All queries use `createClient()` from `@supabase/ssr` (server-side), RLS handles authorization
- [ ] Verify: each query returns correct data for authenticated user, blocks others

### Phase 4: Port Pages (in order)
**Commit per page:**

- [ ] **4a: Landing** — `app/(public)/page.tsx` — port from `features/landing/pages/LandingPage.tsx`. Keep hero image, sticky navbar, SCSS tokens. Convert to Server Component where possible.
- [ ] **4b: Auth pages** — already done in Phase 2, but verify visual parity with current `LoginPage` / `RegisterPage` (note: register URL is `/registro`, not `/register`)
- [ ] **4c: Dashboard layout** — `app/(app)/layout.tsx` — sidebar (collapsible, Trustride-style) + topbar. Port from current shell components.
- [ ] **4d: Dashboard page** — `app/(app)/dashboard/page.tsx` — summary cards, quick actions, recent activity. Port from `features/dashboard/`.
- [ ] **4e: Tarjetas page** — `app/(app)/dashboard/tarjetas/page.tsx` — card list + create/edit form. Port from `features/tarjetas/`.
- [ ] **4f: Facturas page** — `app/(app)/dashboard/facturas/page.tsx` — factura list + create + OCR upload. Port from `features/facturas/`.
- [ ] **4g: Alertas page** — `app/(app)/dashboard/alertas/page.tsx` — port from `features/alertas/`.
- [ ] **4h: Perfil page** — `app/(app)/dashboard/perfil/page.tsx` — port from `features/perfil/`.

### Phase 5: Business Logic (Server Actions / Route Handlers)
**Commit:** `feat: server actions for OCR, tipo cambio, debt calculation`

- [ ] **OCR extraction** — `src/app/api/ocr/route.ts` (Route Handler, accepts multipart form, `export const dynamic = 'force-dynamic'`) — port Tesseract logic from `OcrService.cs`. **RESOLVED by Phase 0 SPIKE:** `tesseract.js` in Next.js Route Handler (Node runtime) if the spike passed; otherwise fallback to Google Vision API. Every auth-reading handler/component in this phase sets `force-dynamic` (Gothic Failure #11).
- [ ] **Tipo cambio** — `src/lib/actions/tipo-cambio.ts` (Server Action) — port BCCR API fetch from `TipoCambioService.cs`. **BCCR API may block Vercel serverless IPs — test from a Vercel function first; fallback to `open.er-api.com` if blocked.** Cache upsert in `tipo_cambio_cache` table: `INSERT ... ON CONFLICT (fecha) DO UPDATE SET compra = EXCLUDED.compra, venta = EXCLUDED.venta`. Optionally set up Supabase Cron to refresh daily.
- [ ] **Debt calculation** — `src/lib/queries/tarjetas.ts` — port `CalcularDeudaReal` + `ConvertirColonesAUsd` + `CalcularLimiteDisponible` logic from `TarjetasController.cs`. Runs in Server Component / Server Action, uses `tipo_cambio_cache`.

### Phase 6: Dev Data Strategy
**Commit:** `chore: seed script for development data`

- [ ] Create `supabase/seed.sql` — sample user (via Supabase Auth), sample banks, sample tarjetas + facturas
- [ ] Document: how to reset local DB (`npx supabase db reset`)
- [ ] No production seed — users create their own data

### Phase 7: Production Deploy
**Commit:** `chore: production deploy config`

- [ ] Create Supabase project (cloud) — apply all migrations
- [ ] Configure Supabase Auth: enable email+password (Google OAuth only if Phase 2b was completed)
- [ ] Set environment variables in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (for admin operations only)
- [ ] Connect Vercel to `frontend-next/` folder (or monorepo root with `rootDirectory` config)
- [ ] Configure custom domain (if any)
- [ ] Verify: full flow in production (sign up → login → create card → create factura → see dashboard)

### Phase 8: Delete Legacy (AFTER parity verified)
**Commit:** `chore: remove legacy .NET backend + React/Vite frontend`

- [ ] Run parity checklist (Section 6) — all features verified
- [ ] Delete `backend/` folder
- [ ] Delete `frontend/` folder
- [ ] Delete `FlowBank.slnx`
- [ ] Update `README.md` — new stack, new commands
- [ ] Update `.gitignore` — remove .NET-specific entries
- [ ] Verify: `pnpm dev` + `pnpm build` still work

---

## 6. Risks + Rollback

### 6.1 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OCR (Tesseract) not available / unreliable in Vercel serverless | Factura extraction feature broken | Phase 0 SPIKE validates `tesseract.js` on Vercel (cold-start, memory, accuracy) BEFORE Phase 5. Fallback: Google Vision API. |
| BCCR API blocks serverless IPs | Tipo cambio unavailable | Test BCCR from Vercel function IPs early (Phase 5 task). Cache in DB with `ON CONFLICT (fecha) DO UPDATE` upsert + fallback to `open.er-api.com`. Acceptable if rate updates daily. |
| Supabase free tier limits (500MB DB, 50K MAU) | App stops working at scale | Monitor usage. Upgrade to Pro ($25/mo) when needed. For portfolio app, free tier sufficient. |
| RLS misconfiguration | Data leak between users | Test RLS policies with multiple users in local Supabase. Run `supabase db advisors` after migrations. |
| OneDrive-synced project path + Docker | `supabase start` volume sync issues, slow I/O, file locks | If local Supabase misbehaves under OneDrive sync, move repo to `C:\dev\FlowBank` (outside OneDrive). Detected in Phase 0. |
| Google OAuth setup complexity | Login with Google broken | **Deferred to Phase 2b (post-MVP).** Ship email+password first, add Google later. |
| SCSS → CSS custom properties migration | Visual regressions | Keep SCSS with `sass-embedded` (Next.js supports it natively). Convert to CSS custom properties only if needed for theming. |

### 6.2 Rollback Path

- **During development:** `backend/` and `frontend/` folders remain untouched until Phase 8. If rewrite is abandoned, legacy app still works.
- **After deploy:** Vercel allows instant rollback to previous deployment. Supabase migrations are versioned — can roll back with `supabase db reset --version <N>`.
- **Parity checklist before deleting legacy:**

| Feature | Current Route | Verified in New App |
|---------|--------------|-------------------|
| Landing page (hero, navbar, CTA) | `/` | ☐ |
| Email+password login | `/login` | ☐ |
| Email+password register | `/registro` | ☐ |
| Dashboard (summary, quick actions) | `/dashboard` | ☐ |
| Tarjetas CRUD (list, create, edit, delete) | `/dashboard/tarjetas` | ☐ |
| Facturas CRUD (list, create, delete) | `/dashboard/facturas` | ☐ |
| Factura OCR extraction (image upload) | `/dashboard/facturas` | ☐ |
| Alertas (upcoming payment dates) | `/dashboard/alertas` | ☐ |
| Perfil (edit name) | `/dashboard/perfil` | ☐ |
| Tipo cambio display (USD/CRC) | Dashboard + Tarjetas | ☐ |
| Debt calculation (limite disponible) | Tarjetas detail | ☐ |
| Sidebar collapse/expand | All `/dashboard/*` | ☐ |
| Responsive (mobile, tablet, desktop) | All pages | ☐ |
| Session persistence (stay logged in) | All authenticated pages | ☐ |
| Logout (clears session + redirect) | Sidebar / Perfil | ☐ |
| Spanish error messages match current app | All forms / actions | ☐ |
| Loading states present (skeletons/spinners) | All async pages | ☐ |
| Toast notifications work | All mutations (create/update/delete) | ☐ |
| Keyboard/focus basics (tab order, focus rings, Enter submits) | Forms + navigation | ☐ |

> Note: "Perfil (edit email)" was dropped — email change is a NEW feature (current app doesn't support it), out of MVP scope.

---

## 7. Task List with File Paths

### Phase 0: Scaffold (est. 1-2 hours)

| Task | Files | Size |
|------|-------|------|
| Verify `docker --version` prerequisite | — | XS |
| Scaffold Next.js app | `frontend-next/` (entire folder) | L |
| Install Supabase deps + `sass-embedded` | `frontend-next/package.json` | XS |
| Configure `sassOptions.includePaths` | `frontend-next/next.config.ts` | XS |
| Copy SCSS tokens | `frontend-next/src/styles/_tokens.scss` | S |
| Copy landing assets | `frontend-next/public/images/landing/*` | XS |
| Configure env | `frontend-next/.env.local`, `.env.example` | XS |
| Update .gitignore | `.gitignore` | XS |
| OCR SPIKE: tesseract.js on Vercel (gate for Phase 5) | `frontend-next/src/app/api/ocr-spike/route.ts` (temp) | M |
| OneDrive/Docker check — move to `C:\dev\FlowBank` if needed | repo location | XS |

### Phase 1: Database (est. 2-3 hours)

| Task | Files | Size |
|------|-------|------|
| Write 10 migration files (incl. facturas without user_id + pre-migration check §2.3.1) | `frontend-next/supabase/migrations/*.sql` | L |
| Generate TypeScript types | `frontend-next/src/types/database.ts` | XS |
| Seed bancos (from scratch — confirm list with user first) | `frontend-next/supabase/seed.sql` | S |
| Test RLS policies | `psql` or Supabase Studio | M |

### Phase 2: Auth (est. 3-4 hours)

| Task | Files | Size |
|------|-------|------|
| Supabase client setup (browser + server + middleware) | `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts` | M |
| Root middleware | `src/middleware.ts` | S |
| Login page + action | `src/app/(public)/login/page.tsx`, `actions.ts` | M |
| Register page + action | `src/app/(public)/registro/page.tsx`, `actions.ts` | M |
| Profile auto-creation trigger | `supabase/migrations/00000000000010_create_profile_trigger.sql` | S |

### Phase 2b: Google OAuth — deferred (optional)

| Task | Files | Size |
|------|-------|------|
| Google OAuth config | Supabase dashboard (manual) | — |
| `signInWithGoogleAction` + button | `src/app/(public)/login/` | S |

### Phase 3: Data Layer (est. 2-3 hours)

| Task | Files | Size |
|------|-------|------|
| tarjetas queries | `src/lib/queries/tarjetas.ts` | M |
| facturas queries | `src/lib/queries/facturas.ts` | S |
| bancos queries | `src/lib/queries/bancos.ts` | S |
| Tipo cambio queries | `src/lib/queries/tipo-cambio.ts` (BCCR from Vercel IPs + `open.er-api.com` fallback + `ON CONFLICT (fecha)` upsert) | M |
| perfil queries | `src/lib/queries/perfil.ts` | S |

### Phase 4: Port Pages (est. 8-12 hours)

| Task | Files | Size |
|------|-------|------|
| Landing page | `src/app/(public)/page.tsx` + components | L |
| Dashboard layout (sidebar) | `src/app/(app)/layout.tsx`, `_components/sidebar.tsx` | L |
| Dashboard page | `src/app/(app)/dashboard/page.tsx` | M |
| Tarjetas page | `src/app/(app)/dashboard/tarjetas/page.tsx` + components | L |
| Facturas page | `src/app/(app)/dashboard/facturas/page.tsx` + components | L |
| Alertas page | `src/app/(app)/dashboard/alertas/page.tsx` | M |
| Perfil page | `src/app/(app)/dashboard/perfil/page.tsx` | M |

### Phase 5: Business Logic (est. 3-4 hours)

| Task | Files | Size |
|------|-------|------|
| OCR route handler | `src/app/api/ocr/route.ts` (requires Phase 0 SPIKE pass; `export const dynamic = 'force-dynamic'`) | M |
| Tipo cambio server action (BCCR test from Vercel IPs + fallback) | `src/lib/actions/tipo-cambio.ts` | M |
| Debt calculation logic | `src/lib/queries/tarjetas.ts` (extend) | S |

### Phase 6: Dev Data (est. 30 min)

| Task | Files | Size |
|------|-------|------|
| Seed script | `supabase/seed.sql` | S |

### Phase 7: Production Deploy (est. 1-2 hours)

| Task | Files | Size |
|------|-------|------|
| Supabase cloud project setup | Supabase dashboard (manual) | — |
| Apply migrations to cloud | `npx supabase db push` | S |
| Vercel env vars | Vercel dashboard (manual) | — |
| Connect Vercel to repo | Vercel dashboard (manual) | — |
| Production smoke test | — | M |

### Phase 8: Delete Legacy (est. 30 min)

| Task | Files | Size |
|------|-------|------|
| Run parity checklist | — | M |
| Delete `backend/` | `backend/` | S |
| Delete `frontend/` | `frontend/` | S |
| Delete `FlowBank.slnx` | `FlowBank.slnx` | XS |
| Update `README.md` | `README.md` | S |
| Update `.gitignore` | `.gitignore` | XS |

---

## 8. Open Questions (resolve before execution)

1. **OCR strategy:** Tesseract.js in Next.js API route (Node runtime) vs. Supabase Edge Function (Deno, no native Tesseract) vs. external OCR API (Google Vision, AWS Textract)? **Recommendation:** `tesseract.js` in Next.js Route Handler (Node runtime) — simplest, no external dependency, works in Vercel. **RESOLVED by adversarial review:** Phase 0 SPIKE validates tesseract.js on Vercel (cold-start, memory, accuracy) before Phase 5; fallback Google Vision.

2. **Google OAuth:** Ship in Phase 2 or defer to post-MVP? **RESOLVED by adversarial review:** Deferred to Phase 2b (optional, post-MVP). Email+password only in Phase 2; commit is `feat: supabase auth (email+password)`.

3. **Monorepo layout:** `frontend-next/` folder (keep during transition) vs. rename to `app/` or `web/`? **Recommendation:** `frontend-next/` during transition, rename to `app/` in Phase 8 when legacy deleted.

4. **SCSS vs. CSS custom properties:** Keep SCSS (Next.js supports it) or convert to CSS custom properties for runtime theming? **Recommendation:** Keep SCSS — preserves existing token structure, no visual regressions. **CONFIRMED:** keep `sass-embedded` (NOT `sass`), with `sassOptions.includePaths: ['src/styles']` in `next.config.ts`.

5. **Tipo cambio cache:** Supabase Cron (runs daily, populates `tipo_cambio_cache` table) vs. on-demand fetch with 1-hour cache (current behavior)? **Recommendation:** On-demand fetch with DB cache (matches current behavior, simpler). Upsert: `INSERT ... ON CONFLICT (fecha) DO UPDATE SET compra = EXCLUDED.compra, venta = EXCLUDED.venta`.

6. **Banco seed list:** source repo has no seed data. Proposed CR banks: BAC Credomatic, Banco de Costa Rica, Banco Nacional, BCR, Promerica, Davivienda, Scotiabank, JBS. **Confirm final list with user before seeding.**

---

## 9. Commands Reference

```bash
# Development
cd frontend-next
pnpm dev                          # Next.js dev server (Turbopack)
npx supabase start                # Start local Supabase (Docker)
npx supabase stop                 # Stop local Supabase
npx supabase db reset             # Reset local DB + re-run migrations + seed

# Database
npx supabase migration new <name> # Create new migration file
npx supabase db push              # Push migrations to linked remote project
npx supabase gen types typescript --local > src/types/database.ts

# Build & Deploy
pnpm build                        # Production build
pnpm start                        # Start production server
vercel --prod                     # Deploy to Vercel production

# Legacy (until Phase 8)
cd backend && dotnet run --project FlowBank.WebAPI   # .NET API on :5110
cd frontend && pnpm dev                              # React SPA on :5173
```

---

**END OF PLAN**
