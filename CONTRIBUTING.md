# Contributing Guidelines

Thank you for contributing to the **Valeria Barra · Biologist Nutritionist** platform.

To maintain a high standard of code quality, security, and medical privacy compliance, all contributors are expected to follow these guidelines.

---

## Code of Conduct

We are committed to providing a welcoming, professional, and respectful environment for all collaborators.
- Treat colleagues and contributors with courtesy and professional respect.
- Prioritize user privacy, patient confidentiality, and security above convenience.
- Offer and accept constructive feedback graciously.

---

## Development Workflow

### 1. Branching Strategy

- `main`: Reflects the production-ready codebase. Direct pushes to `main` are restricted in team environments.
- Feature branches should be branched from `main` using descriptive prefixes:
  - `feat/feature-name`: New features or enhancements
  - `fix/issue-description`: Bug fixes
  - `docs/documentation-update`: Documentation additions or revisions
  - `refactor/component-name`: Code refactoring without behavior changes
  - `test/test-suite`: Adding or updating test cases
  - `chore/task-name`: Build configuration, dependencies, or tooling updates

### 2. Commit Message Conventions

We strictly follow the [Conventional Commits specification](https://www.conventionalcommits.org/):

```text
<type>(<optional scope>): <short description in present tense>

[optional body providing technical context or rationale]

[optional footer(s), e.g., Closes #123]
```

#### Allowed Types:
- `feat`: A new user-facing or backoffice feature
- `fix`: A bug fix
- `docs`: Documentation updates only
- `style`: Formatting or whitespace changes that do not alter code logic
- `refactor`: Code reorganization that neither fixes a bug nor adds a feature
- `perf`: Performance optimizations
- `test`: Adding or correcting tests
- `chore`: Tooling, build scripts, or dependency updates

#### Examples:
- `feat(admin): add audit note field when recording image consent`
- `fix(booking): trim leading whitespace in contact phone number`
- `docs(readme): clarify S3 private bucket policy requirements`

---

## Coding Standards

### TypeScript & React
- **TypeScript Strict Mode**: No `any` types unless strictly unavoidable and commented. All interfaces, API contracts, and database models must have explicit types.
- **Server Components by Default**: In Next.js App Router, favor React Server Components (RSC) for data fetching and static rendering. Use `'use client'` strictly when client-side interactivity, state hooks, or browser APIs are required.
- **Runtime Validation with Zod**: Every public or authenticated mutation endpoint must validate request payloads through a Zod schema before processing.

### Privacy & Clinical Data Guidelines
- **Zero Medical Data in Public Forms**: Never introduce health questionnaires, medical history inputs, or symptom checklists into public inquiry forms.
- **Audited Patient Consent**: Any feature involving patient case studies must strictly verify informed consent flags (`CONTENT`, `IMAGES`) and store references to physical paper authorization.
- **Asset Access Control**: Clinical imagery must never be stored in `/public` or served via public URLs. Always route through `/api/media/[id]`.
- **EXIF Stripping**: Never bypass the Sharp image pipeline; all uploaded media must be scrubbed of metadata.

---

## Verification & Pre-Commit Checklist

Before opening a pull request, run the full verification suite locally:

```bash
# 1. Verify TypeScript types
npm run typecheck

# 2. Run ESLint checks
npm run lint

# 3. Run unit and validation test suite
npm test

# 4. Verify production build compilation
npm run build
```

All commands must exit with code `0` before submission.

---

## Submitting a Pull Request

1. Push your branch to the remote repository.
2. Open a Pull Request against `main`.
3. Complete all fields in the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
4. Ensure the GitHub Actions CI pipeline passes all automated checks.
5. Address any review feedback promptly.
