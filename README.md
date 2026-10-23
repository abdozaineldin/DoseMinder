# DoseMinder (دوزمايندر)

> **"دواؤك في ميعاده... وأهلك مطمئنين"**  
> *"Your medicine on time... and your family at ease"*

DoseMinder is a production-grade medication management and patient-monitoring progressive web application (PWA) designed specifically for **elderly patients**, their **caregivers** (family), and their **doctors**.

The system reminds patients to take medications, records taken and missed doses, automatically alerts caregivers if a dose is missed, escalates to emergency contacts when unconfirmed, and allows doctors to monitor adherence under strict patient consent.

---

## 1. Tech Stack

- **Frontend:**
  - Next.js 16 (App Router)
  - React 19 & TypeScript (strict mode)
  - Tailwind CSS v4 (with CSS-variable design tokens)
  - shadcn/ui & Radix UI accessible primitives
  - `next-intl` (Arabic RTL default & English LTR with 100% key parity)
  - Google Fonts: **Readex Pro** (headings) & **IBM Plex Sans Arabic** (body)
  - `lucide-react` icons (directional mirroring in RTL)
  - `motion` (Framer Motion)
  - Serwist (Service Worker & PWA) & Dexie.js (IndexedDB offline storage)
- **Backend & Database:**
  - Supabase (PostgreSQL 15+, Auth, Row Level Security, Realtime)
  - Supabase Edge Functions (Deno)
  - `pg_cron` & `pg_net` (system heartbeat and escalation cron)
  - Supabase Vault (encrypted secrets)
- **AI & Integrations:**
  - Google Gemini API (server-side only vision prescription extraction & label translation)
  - RxNorm & openFDA / DailyMed (verified drug label data)
  - Web Push (VAPID) & Resend (bilingual emergency email alerts)

---

## 2. Design System: "Warm Clinical Calm"

DoseMinder uses a soothing, high-contrast, uncluttered design system tailored for elderly accessibility:

| Token | Light Hex | Dark Hex | Purpose |
|---|---|---|---|
| `--ink` | `#0E2A2C` | `#EAF3F2` | High-contrast text |
| `--primary` | `#0F6B70` | `#4FC3C0` | Trust & main brand color |
| `--primary-dark` | `#0A4B4F` | `#2E9E9B` | Deep interactive teal |
| `--primary-tint` | `#E3F3F1` | `#12383B` | Subtle card & badge backgrounds |
| `--paper` | `#FAF7F2` | `#0A1A1C` | Warm soothing surface |
| `--card` | `#FFFFFF` | `#12292C` | Elevated content card |
| `--sand` | `#F1EBDF` | `#173337` | Secondary neutral fill |
| `--line` | `#E5DDD0` | `#1F3B3F` | Clean accessible borders |
| `--saffron` | `#F5A524` | `#F5B84A` | Attention / Due now (fill only) |
| `--taken` | `#1E8E55` | `#3DBB7A` | Dose taken (status green) |
| `--missed` | `#D9453D` | `#F0716A` | Dose missed (status coral) |
| `--emergency` | `#A3141B` | `#E04B52` | Emergency contact alert |
| `--muted` | `#5B6F71` | `#9DB4B5` | Secondary text |

### Accessibility Rules
- **Touch Targets:** Minimum 48px for general controls, 56px for patient screens, and 64px for the primary "BigTakenButton".
- **Visual Parity:** Every status is conveyed through **Color + Icon + Text** (never color alone).
- **Numerals:** Medication names, strengths, and times strictly use Latin numerals (`08:00`, `500mg`).
- **Font Scaling:** Supports 3 root font scales: Standard (1x), Large (1.2x), and Extra Large (1.4x).

---

## 3. Project Structure

```
/
├─ docs/                  # SPEC.md (single source of truth), DECISIONS.md
├─ messages/              # ar.json, en.json (100% synchronized i18n keys)
├─ public/                # Icons, manifests, static assets
├─ scripts/               # check-i18n.ts, seed.ts
├─ supabase/              # Migrations, Edge functions, tests, seed SQL
├─ src/
│  ├─ app/
│  │  ├─ [locale]/        # Localized App Router pages (ar/en)
│  │  │  ├─ style-guide/  # Design system showcase
│  │  │  └─ layout.tsx    # Root localized layout (lang, dir, fonts)
│  │  ├─ fonts.ts         # Readex Pro & IBM Plex Sans Arabic definitions
│  │  └─ globals.css      # CSS variables, tokens, and Tailwind v4 theme
│  ├─ components/
│  │  ├─ ui/              # Button, Card, Input, Dialog, Toast, Skeleton
│  │  ├─ shared/          # LocaleSwitcher, ThemeToggle, FontScaleControl, EmptyState
│  │  └─ style-guide/     # Interactive StyleGuide demonstration
│  ├─ i18n/               # routing.ts, request.ts
│  ├─ lib/
│  │  ├─ supabase/        # client.ts, server.ts, middleware.ts
│  │  └─ utils.ts         # cn utility helper
│  └─ proxy.ts            # Next.js 16 request proxy
```

---

## 4. Getting Started

### Prerequisites
- Node.js 20+ (developed with Node.js v24)
- npm 10+
- Supabase CLI

### Installation

```bash
# Clone the repository and install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Development Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start Next.js local development server |
| `npm run build` | Build production bundle (includes i18n check) |
| `npm run lint` | Run ESLint check |
| `npm run typecheck` | Run TypeScript strict type-check (`tsc --noEmit`) |
| `npm run test` | Run test suite |
| `npm run i18n:check` | Verify key parity between `messages/ar.json` and `en.json` |
| `npm run db:types` | Generate TypeScript types from Supabase |
| `npm run db:reset` | Reset local Supabase database |
| `npm run seed` | Seed database with demo patients and drug catalog |

---

## 5. Security & Privacy (REQ-21)

- **Storage & Transit Encryption:** All client-server traffic is encrypted over HTTPS/TLS. Supabase Postgres storage is encrypted at rest (AES-256).
- **Authentication:** Supabase Auth with bcrypt-hashed passwords. User sessions use httpOnly, secure, sameSite cookies.
- **Row Level Security (RLS):** Every database table has RLS enabled. Default privileges are revoked from `anon`.
- **Zero-Storage Prescriptions:** Prescription images processed by Gemini vision are held only in memory and never stored.
- **Hashed Emergency Tokens:** Emergency contact links use 32-byte cryptographically secure random tokens. Only SHA-256 hashes are stored in the database.

---

## 6. Known Limitations & Out of Scope (SPEC §16)

1. **No native mobile app:** DoseMinder is an installable PWA. **Time-based push notifications require an internet connection.** When offline, scheduled reminders appear only while the app is open.
2. **No SMS / Smartwatch / Snooze:** Snooze is intentionally omitted from the design to ensure elderly compliance and safety. An extensible notification interface allows adding SMS in the future.
3. **Drug Information Sources:** Label excerpts originate from US official databases (openFDA / DailyMed). Egyptian brand name normalizations are resolved via the curated `drug_catalog`.
4. **Medical Disclaimer:** DoseMinder is an organizational and monitoring aid, **not a certified medical device**, and does not substitute professional medical advice.

---

## 7. Manual Configuration Checklist (for the User)

Before deploying to production or running Phase 1+, the following manual steps are required:

1. **Supabase Project:**
   - Create a project at [supabase.com](https://supabase.com).
   - In Supabase Dashboard -> Database -> Extensions: Enable `pg_cron` and `pg_net`.
   - Copy `Project URL` and `anon public key` into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Copy `service_role secret` into `.env.local` (`SUPABASE_SERVICE_ROLE_KEY`).
2. **Web Push (VAPID) Credentials:**
   - Run `npx web-push generate-vapid-keys` in your terminal.
   - Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in `.env.local`.
   - Set `VAPID_SUBJECT=mailto:admin@yourdomain.com`.
3. **Resend (Email Alerts):**
   - Create an API key at [resend.com](https://resend.com) and set `RESEND_API_KEY`.
   - Verify your sending domain and set `EMAIL_FROM=DoseMinder <notifications@yourdomain.com>`.
4. **Google Gemini API:**
   - Generate an API key in Google AI Studio and set `GEMINI_API_KEY`.
   - Set `GEMINI_MODEL=gemini-2.5-flash`.
5. **Vercel Deployment:**
   - Link project to Vercel and copy all production environment variables into Vercel Settings -> Environment Variables.
#   D o s e M i n d e r  
 #   D o s e M i n d e r  
 