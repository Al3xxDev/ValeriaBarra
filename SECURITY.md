# Security Policy

## Reporting Security Vulnerabilities

We take the security and privacy of this clinical platform and its users very seriously. If you discover a security vulnerability or potential privacy leak, please report it responsibly.

**Please DO NOT create public GitHub issues for security vulnerabilities.**

Instead, report the issue privately by emailing:
**`studio@valeriabarra.it`** (or your designated technical point of contact)

Include the following in your disclosure:
- Description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or Proof of Concept (PoC).
- Proposed remediation or patch, if available.

We will acknowledge receipt within 48 hours and coordinate a fix and release timeline before any public disclosure.

---

## Supported Versions

Only the latest release on the default branch (`main`) is actively supported for security updates:

| Version | Supported |
| :--- | :---: |
| `v1.0.x` (main) | :white_check_mark: |
| Legacy / Older | :x: |

---

## Built-In Security Architecture & Controls

### 1. Authentication & Session Integrity
- **Stateless Cryptographic JWTs**: Admin authentication uses `jose` to issue compact, cryptographically signed JWT sessions with strict expiration windows.
- **Secure Cookie Flags**: Session cookies are strictly configured with `HttpOnly`, `SameSite=Strict`, and `Secure` (in production) to prevent cross-site scripting (XSS) token exfiltration.
- **Password Protection**: Passwords are never stored in plaintext; all administrative credentials are salted and hashed using `bcryptjs`.

### 2. Abuse Prevention & Brute-Force Throttling
- **PostgreSQL-Backed Rate Limiting**: The `AuthThrottle` table tracks consecutive failed login attempts by IP and key window, automatically locking out brute-force attacks across clustered instances.
- **CSRF & Origin Verification**: All state-mutating API routes (`POST`, `PUT`, `PATCH`, `DELETE`) enforce strict Origin and Referer header verification against configured site origins.

### 3. Patient Privacy & GDPR by Design
- **Intake Data Minimization**: Public consultation booking forms deliberately collect only contact information and appointment preferences. Zero medical history, diagnostic questions, or sensitive health data are collected online.
- **Audited Informed Consent**: Case study workflows require dual consent records (`CONTENT` and `IMAGES`), timestamped and linked to physical signed documents in the clinic's physical archive.
- **Instant Revocation Cascade**: Revoking consent immediately unpublishes the case and severs media access.
- **Gated Media Delivery**: Patient case imagery is never exposed to public CDN endpoints or static directories. Requests to `/api/media/[id]` strictly verify that the associated case is currently published with active, unrevoked consent.
- **Automated EXIF Scrubbing**: All uploaded images undergo server-side decoding, resizing, and WebP re-encoding via Sharp, stripping all GPS tags, device serials, and camera metadata.

### 4. Database & Injection Defense
- **Parameterized Queries**: All database interactions use Prisma ORM, which employs parameterized SQL queries to prevent SQL injection vulnerabilities.
- **Schema Validation**: All inbound JSON payloads are sanitized and strictly validated against Zod schemas before touching business logic or storage.
