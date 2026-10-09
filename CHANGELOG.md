# Changelog

All notable changes to the **Valeria Barra · Biologist Nutritionist** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-09

### Added
- **Public Practice Web Portal**:
  - Home landing page with practice presentation, nutritional philosophy, and call-to-action sections.
  - Practitioner profile and bio page (`/chi-sono`).
  - Nutritional pathways and consultation programs directory (`/percorsi`).
  - Editorial and clinical nutrition news hub (`/news`) with individual article reader (`/news/[slug]`).
  - Balanced recipes library (`/ricette`) with macro/micronutrient insights and recipe reader (`/ricette/[slug]`).
  - Patient journey showcases (`/prima-e-dopo`) with deep-dive case pages (`/prima-e-dopo/[slug]`).
  - Online appointment booking intake form (`/prenota`) with date and time preference selection.
  - Interactive cookie consent banner with granular analytics opt-in.
  - Dynamic XML sitemap generator (`/sitemap.xml`) and `robots.txt` output.
  - Schema.org JSON-LD microdata for clinical practice, articles, and recipes.

- **GDPR & Clinical Privacy System**:
  - Multi-scope consent tracking engine (`CONTENT` and `IMAGES` scopes) with audit trail and physical archive notes.
  - Mandatory patient anonymization verification prior to case publication.
  - Gated private media routing endpoint (`/api/media/[id]`) serving imagery only for verified, published cases with active consent.
  - Instant unpublishing cascade upon consent withdrawal.
  - Zero health or sensitive clinical data collection on web intake forms.

- **Administrative Backoffice (`/admin`)**:
  - Secure session-based authentication using `jose` JWTs and `HttpOnly`, `SameSite=Strict` cookies.
  - Brute-force protection powered by PostgreSQL-backed `AuthThrottle` rate limiting.
  - Consultation inquiry pipeline manager (`/admin/bookings`) with status state machine (`NEW`, `CONTACTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`) and confidential clinical notes.
  - Content CMS (`/admin/content`) for managing articles, recipes, and clinical journey cases.
  - Practice configuration dashboard (`/admin/settings`) for phone numbers, WhatsApp, bio, and social links.

- **Media & Asset Processing**:
  - Server-side Sharp image pipeline converting uploads to WebP and stripping all EXIF/camera metadata.
  - Dual storage adapter supporting local filesystem storage (`.private-media`) in development and S3-compatible cloud buckets in production.
  - Automated vector and raster brand asset generator script (`scripts/generate-brand-assets.ts`).

- **Infrastructure & Testing**:
  - Docker Compose configuration for PostgreSQL 17 Alpine database.
  - Prisma schema with versioned SQL migrations and seeder (`prisma/seed.ts`).
  - End-to-End browser tests and axe-core accessibility tests using Playwright.
  - Unit and validation test suite utilizing Node.js test runner and Zod.
  - GitHub Actions automated CI workflow for linting, typechecking, testing, and production builds.
