# Valeria Barra · Biologist Nutritionist

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](#license)

> A modern, accessible, and privacy-first web platform and custom content management system (CMS) tailored for **Dott.ssa Valeria Barra**, Biologist Nutritionist in Salerno, Italy.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Public Portal](#public-portal)
  - [GDPR & Clinical Compliance Framework](#gdpr--clinical-compliance-framework)
  - [Administrative Backoffice (`/admin`)](#administrative-backoffice-admin)
  - [Media Processing Pipeline](#media-processing-pipeline)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Default Development Credentials](#default-development-credentials)
- [Environment Variables](#environment-variables)
- [Database Operations](#database-operations)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Security & Compliance](#security--compliance)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This repository houses the full-stack web application for the professional clinical practice of **Valeria Barra**. Built using Next.js App Router, React 19, and Prisma with PostgreSQL, the solution bridges a high-performance, SEO-optimized public portal with a robust administrative backoffice designed specifically for medical and nutritional practices.

The platform is engineered around strict **privacy-by-design** principles: medical data is segregated from public booking forms, patient case studies require audited informed consent, and imagery is stripped of metadata and served exclusively through authenticated, access-controlled endpoints.

---

## Key Features

### Public Portal
- **Nutritional Pathways (`/percorsi`)**: Clear presentation of personalized dietary consulting, clinical nutrition plans, and habit re-education programs.
- **Recipe & Editorial Hub (`/ricette`, `/news`)**: Nutritional articles, balanced recipes with nutritional facts, category filters, and search tags.
- **Clinical Case Studies (`/prima-e-dopo`)**: Respectful and narrative-driven "Before & After" patient journey showcases.
- **Appointment Booking Intake (`/prenota`)**: Multi-step booking intake with date/time preferences, appointment types, and explicit GDPR consent acceptance.
- **SEO & Microdata**: Server-rendered pages with JSON-LD structured data (Schema.org `MedicalBusiness`, `Article`, `Recipe`), dynamic XML sitemaps (`/sitemap.xml`), and custom OpenGraph/Twitter social cards.
- **Cookie & Consent Management**: Granular cookie banner allowing visitors to toggle analytics scripts without tracking non-consenting users.

### GDPR & Clinical Compliance Framework
- **Dual Informed Consent**: Separate, recorded consent flags for case narrative (`CONTENT`) and clinical imagery (`IMAGES`), complete with administrative physical archive references.
- **Anonymization Assurance**: Mandatory verification that personal identifying details are stripped prior to case publication.
- **Gated Media Delivery**: Patient images are **never** stored in public directories or served via open CDN URLs. All requests pass through `/api/media/[id]`, which verifies publication status and active consent before streaming bytes.
- **Instant Consent Revocation**: Revoking patient consent immediately withdraws the story from the live website, marks the case as a draft, and unlinks associated media assets.
- **Data Minimization in Intake Forms**: The booking form explicitly omits health/medical questions, preventing unnecessary exposure of sensitive clinical data prior to in-person consultation.

### Administrative Backoffice (`/admin`)
- **Booking Pipeline Management (`/admin/bookings`)**: Real-time management of consultation inquiries with structured status workflows (`NEW` → `CONTACTED` → `CONFIRMED` → `COMPLETED` / `CANCELLED` / `ARCHIVED`) and confidential practitioner notes.
- **Content Management (`/admin/content`)**: Full authoring capabilities for editorial articles, recipes, and clinical journey cases.
- **Practice Settings (`/admin/settings`)**: Dynamic configuration of contact phone numbers, WhatsApp direct links, studio address, social profiles, and biography copy.
- **Hardened Authentication**: Stateless session management using `jose` signed JWT tokens stored in `HttpOnly`, `SameSite=Strict` secure cookies.
- **Brute-Force Throttling**: PostgreSQL-backed `AuthThrottle` rate limiter that automatically blocks abusive IP/credential combinations.
- **Origin & CSRF Protection**: Strict validation of request headers on all state-mutating API routes.

### Media Processing Pipeline
- **Sharp Image Transcoding**: Automated conversion of uploaded JPEG, PNG, and WebP images to modern WebP with optimal compression.
- **EXIF & Metadata Stripping**: Complete removal of camera metadata, device serials, and GPS location tags to guarantee patient privacy.
- **Storage Abstraction**: Seamless dual-adapter architecture supporting local private filesystem storage (`.private-media`) during development and S3-compatible cloud storage (AWS S3, Cloudflare R2, MinIO) in production.

---

## Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router architecture, Turbopack, React Server Components |
| **UI Library** | [React 19](https://react.dev/) | Concurrent rendering, Server Actions, modern hook APIs |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict type-safety across client and server layers |
| **Database** | [PostgreSQL 17](https://www.postgresql.org/) | Robust relational database engine |
| **ORM** | [Prisma 6](https://www.prisma.io/) | Type-safe schema definition and versioned SQL migrations |
| **Validation** | [Zod 4](https://zod.dev/) | Strict runtime data validation for API payloads and form submissions |
| **Authentication**| [jose](https://github.com/panva/jose) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Cryptographic JWT signing and secure salted password hashing |
| **Image Engine** | [Sharp](https://sharp.pixelplumbing.com/) | High-performance raster image transformation |
| **Cloud Storage** | [@aws-sdk/client-s3](https://aws.amazon.com/sdk-for-javascript/) | S3-compatible client for private media persistence |
| **Email Service** | [Resend](https://resend.com/) | Transactional booking confirmations and studio alert dispatches |
| **Testing** | [Playwright](https://playwright.dev/) & Node Test Runner | End-to-end browser tests, accessibility auditing (`axe-core`), and unit tests |

---

## Getting Started

### Prerequisites

Ensure you have the following installed locally:
- **Node.js**: `v20.9.0` or higher (Node 22 LTS recommended)
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose**: For running the local PostgreSQL container

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/valeria-barra-nutrizionista.git
   cd valeria-barra-nutrizionista
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   *(Review `.env` and adjust variables if needed. Default values match the Docker Compose configuration).*

4. **Start the local PostgreSQL container**:
   ```bash
   docker compose up -d db
   ```

5. **Run database migrations and seed demo data**:
   ```bash
   npm run db:deploy
   npm run db:seed
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Access the application**:
   - Public Website: [http://localhost:3000](http://localhost:3000)
   - Admin Backoffice: [http://localhost:3000/admin](http://localhost:3000/admin)

### Default Development Credentials

The local database seed script creates a default administrator account:
- **Email**: `admin@valeriabarra.local`
- **Password**: `change-this-development-password`

> [!WARNING]
> Always change default credentials before deploying to any staging or production environment.

---

## Environment Variables

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `postgresql://valeria:valeria@localhost:5432/valeria_barra?schema=public` | Connection string for PostgreSQL database. |
| `AUTH_SECRET` | **Yes** | `openssl rand -hex 32` | Cryptographic key (min 32 chars) for signing session JWTs. |
| `ADMIN_EMAIL` | **Yes** | `admin@valeriabarra.local` | Email address for the initial administrative account. |
| `ADMIN_PASSWORD` | **Yes** | `change-this-development-password` | Initial password hashed and stored during database seed. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | `http://localhost:3000` | Canonical site origin for OpenGraph, sitemaps, and robots.txt. |
| `NEXT_PUBLIC_GA_ID` | No | `G-XXXXXXXXXX` | Optional Google Analytics 4 Measurement ID. |
| `RESEND_API_KEY` | No | `re_...` | API key for transactional emails via Resend. |
| `EMAIL_FROM` | No | `Valeria Barra <studio@example.it>` | Verified sender address for notifications. |
| `EMAIL_TO` | No | `valeria@example.it` | Studio inbox for new appointment notifications. |
| `STORAGE_LOCAL` | No | `true` | When `true`, saves media to `./.private-media` (dev only). |
| `STORAGE_BUCKET` | Prod | `my-private-media-bucket` | Name of the private S3-compatible bucket. |
| `STORAGE_ENDPOINT` | Prod | `https://s3.eu-central-1.amazonaws.com` | Optional custom endpoint (e.g., Cloudflare R2 / MinIO). |
| `STORAGE_REGION` | Prod | `eu-central-1` | S3 bucket region. |
| `STORAGE_ACCESS_KEY` | Prod | `AKIA...` | IAM access key with S3 read/write permissions. |
| `STORAGE_SECRET_KEY` | Prod | `...` | IAM secret key corresponding to the access key. |

---

## Database Operations

The project uses Prisma ORM with versioned SQL migrations located in `prisma/migrations/`.

```bash
# Generate the Prisma Client after schema changes
npm run db:generate

# Apply migrations and create new migration files (Development)
npm run db:migrate

# Apply pending migrations to production/staging (CI/CD)
npm run db:deploy

# Populate database with initial content and admin account
npm run db:seed
```

---

## Testing & Quality Assurance

To ensure zero regressions, accessibility adherence, and type safety, run the verification suite:

```bash
# Run TypeScript compilation check
npm run typecheck

# Run ESLint validation
npm run lint

# Run unit and validation test suite
npm test

# Run Playwright End-to-End and accessibility tests
npm run test:e2e
```

*Note: For headless Playwright runs on custom environments, specify your browser binary via `CHROME_BIN=/usr/bin/google-chrome npm run test:e2e`.*

---

## Production Deployment

### 1. Build Verification
Before deploying, execute a local production build to verify bundle compilation:
```bash
npm run build
npm start
```

### 2. Deployment Architecture
- **Web Layer**: Can be hosted on [Vercel](https://vercel.com/), AWS ECS, Railway, Fly.io, or any Node.js container platform.
- **Database**: Managed PostgreSQL instance (AWS RDS, Supabase, Neon, Neon with Prisma connection pooling).
- **Object Storage**: Private AWS S3 bucket, Cloudflare R2, or Wasabi with strict private access policies. Ensure the bucket does **not** grant public read access.

### 3. Production Release Checklist
1. Apply database migrations: `npm run db:deploy`.
2. Seed administrative credentials once: `NODE_ENV=production npm run db:seed`.
3. Set high-entropy `AUTH_SECRET` generated with `openssl rand -hex 32`.
4. Configure production `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, and `STORAGE_SECRET_KEY` with `STORAGE_LOCAL="false"`.
5. Set `NEXT_PUBLIC_SITE_URL` to the public production domain (e.g., `https://www.valeriabarra.it`).
6. Complete legal review of the Privacy Policy and Cookie Policy texts prior to public launch.

---

## Project Structure

```text
├── .github/                  # CI/CD workflows and GitHub issue/PR templates
│   ├── workflows/ci.yml      # Automated GitHub Actions test & build pipeline
│   ├── ISSUE_TEMPLATE/       # Structured bug report & feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── prisma/                   # Database schema, seed data, and SQL migrations
│   ├── migrations/           # Versioned PostgreSQL migration scripts
│   ├── schema.prisma         # Declarative Prisma schema definition
│   └── seed.ts               # Database seeder for demo fixtures & admin user
├── public/                   # Static public assets (brand marks, favicons, placeholders)
│   ├── brand/                # Vector logos, seals, social cards, app icons
│   └── images/               # Abstract demo illustrations and placeholders
├── scripts/                  # Standalone build utilities (asset generation)
├── src/
│   ├── app/                  # Next.js App Router pages and API routes
│   │   ├── (public)/         # Public clinical pages (/percorsi, /ricette, /news, etc.)
│   │   ├── admin/            # Administrative backoffice routes and sub-pages
│   │   ├── api/              # Secure API route handlers (admin, media, bookings)
│   │   ├── layout.tsx        # Root HTML layout with SEO metadata and cookie provider
│   │   ├── robots.ts         # Dynamic robots.txt generator
│   │   └── sitemap.ts        # Dynamic XML sitemap generator
│   ├── components/           # Reusable React components (forms, navigation, UI)
│   └── lib/                  # Core backend business logic, validation, and utilities
│       ├── auth.ts           # JWT session issuance and cookie validation
│       ├── before-after*.ts  # Clinical journey validation, views, and consent logic
│       ├── booking-validation.ts # Zod schema for appointment requests
│       ├── media-storage.ts  # Sharp processing and S3/Local storage adapter
│       ├── prisma.ts         # Prisma Client singleton
│       └── rate-limit.ts     # Brute-force throttling logic
├── tests/                    # Unit, validation, and Playwright E2E test suites
│   ├── e2e/site.spec.ts      # End-to-end browser tests
│   └── validation.test.ts    # Zod schemas and business logic assertions
├── .env.example              # Documented environment variable template
├── .gitattributes            # Line ending normalization and asset rules
├── .gitignore                # Comprehensive Git ignore rules
├── docker-compose.yml        # Local PostgreSQL container definition
├── next.config.ts            # Next.js configuration
├── package.json              # Project dependencies and script declarations
└── tsconfig.json             # TypeScript compiler configuration
```

---

## Security & Compliance

For details on reporting vulnerabilities, built-in security architecture, and patient data safeguards, please review [SECURITY.md](SECURITY.md).

Key security controls implemented:
- **Zero Medical Data in Intake**: Forms collect strictly non-clinical contact details.
- **Audited Patient Consent**: Consent states are recorded with physical paperwork cross-references.
- **Cryptographic JWTs & HttpOnly Cookies**: Protection against XSS session hijacking.
- **Rate-Limited Authentication**: Brute-force protection via PostgreSQL-backed counters.
- **Metadata Scrubbing**: Automated stripping of EXIF data on all media uploads.

---

## Contributing

Contributions, bug reports, and enhancements are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, conventional commit standards, and the pull request process.

---

## License

Copyright © 2026 **Dott.ssa Valeria Barra**. All rights reserved.  
Proprietary software developed for professional practice. Unauthorized copying, modification, or distribution is strictly prohibited. See [LICENSE](LICENSE) for details.
