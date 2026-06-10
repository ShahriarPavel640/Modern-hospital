# Agent Instructions — Modern Hospital Repository

This file instructs AI coding agents on how to work inside this repository. Read this file completely before making any changes.

---

## Before Starting

Read these files in this exact order before writing any code:

1. **`README.md`** — Project overview, features, tech stack, env vars, deployment
2. **`ARCHITECTURE.md`** — System design, data flow, patterns, component hierarchy, auth flow
3. **`backend_implementation_plan.md`** — Backend status, sprint tasks, API specs, schema
4. **`frontend_implementation_plan.md`** — Frontend status, migration details, sprint tasks, component list

After reading these four files, identify which sprint task or feature you are implementing. Locate the exact checklist item in the relevant implementation plan.

### Reference Code

The directory `Frontend-react/` contains the original React portfolio site. Use it as a **read-only reference** for:

- Visual design and component structure (`src/routes/index.tsx`)
- CSS design system and tokens (`src/styles.css`)
- Radix UI component implementations (`src/components/ui/`)
- Static assets (`src/assets/`)

Do **not** modify files inside `Frontend-react/`. It exists only as a migration source.

---

## Coding Rules

### Language & Tooling

- All code is TypeScript with `strict: true`. Do not use `any` unless absolutely unavoidable and documented with a comment explaining why.
- Backend uses ES Modules (`"type": "module"` in package.json, `"module": "NodeNext"` in tsconfig).
- Frontend uses Next.js App Router conventions. No Pages Router.
- Use `import` / `export` syntax. No `require()`.

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `DoctorTable.tsx`, `HeroSection.tsx` |
| Files (utilities, config, routes) | camelCase | `env.ts`, `api.ts`, `doctors.ts` |
| Files (Next.js pages) | `page.tsx` (framework convention) | `app/admin/doctors/page.tsx` |
| React components | PascalCase | `export default function DoctorForm()` |
| Functions | camelCase | `sendAppointmentNotification()` |
| Variables | camelCase | `serialNumber`, `patientName` |
| Constants | UPPER_SNAKE_CASE | `ADMIN_EMAIL`, `MAX_FILE_SIZE` |
| CSS classes | kebab-case (Tailwind utilities) | `bg-brand-dark`, `shadow-elegant` |
| Database tables | snake_case | `medical_tests`, `doctors` |
| Database columns | snake_case | `patient_phone`, `created_at` |
| Prisma model fields | camelCase (mapped to snake_case) | `patientPhone` → `@map("patient_phone")` |
| API endpoints | kebab-case | `/api/patient/my-tests`, `/api/patient/link-phone` |
| Env variables | UPPER_SNAKE_CASE | `DATABASE_URL`, `CLERK_SECRET_KEY` |

### Code Style

- Use `const` by default. Use `let` only when reassignment is necessary. Never use `var`.
- Use arrow functions for inline callbacks. Use named `function` declarations for exported functions and React components.
- Destructure props and objects where it improves readability.
- Use early returns to reduce nesting.
- Maximum function length: ~50 lines. Extract helper functions if longer.
- All route handlers must have a try/catch wrapping the entire handler body.

### Comments

- Do not write comments that restate what the code does. Write comments that explain **why**.
- Add a comment when a decision is non-obvious or deviates from convention.
- Preserve all existing comments unless the code they describe is being deleted.

### Imports

Order imports in this sequence, separated by blank lines:

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. Third-party packages
import express from 'express';
import { z } from 'zod';

// 3. Internal absolute imports
import { env } from '@/config/env';
import { requireRole } from '@/middleware/auth';

// 4. Relative imports
import { uploadImage } from '../services/cloudinary';
```

---

## Architecture Rules

### Backend

1. **Route files export an Express Router.** Each route file in `src/routes/` creates a `Router()`, defines handlers, and exports it. The router is mounted in `src/index.ts`.

2. **Middleware chain order is fixed.** Do not reorder: `helmet → cors → express.json → clerkMiddleware → routes → errorHandler`. The error handler must always be last.

3. **Auth middleware is applied at the router level, not globally.** Public routes have no auth middleware. Patient routes use `requireAuth()`. Admin routes use `requireAuth()` + `requireRole('admin')`.

4. **All request bodies are validated with Zod** before any database operation. Define the Zod schema at the top of the route file. Use `.safeParse()` and return 400 with error details on failure.

5. **Services are stateless functions.** `cloudinary.ts` and `mailer.ts` export pure functions. They do not maintain state or depend on request context. Pass all needed data as function arguments.

6. **Prisma is the only database access layer.** Do not write raw SQL. Do not use `pg` or `knex` directly. All queries go through the Prisma client.

7. **Environment variables are accessed only through `env` object** exported from `src/config/env.ts`. Never read `process.env` directly anywhere else in the codebase.

8. **Error responses follow a consistent format:**
   ```json
   { "success": false, "error": "Human-readable message" }
   ```

9. **Success responses follow a consistent format:**
   ```json
   { "success": true, "data": { ... } }
   ```

### Frontend

1. **Server Components are the default.** Only add `"use client"` when the component needs: `useState`, `useEffect`, event handlers, browser APIs, or Clerk hooks (`useUser`, `useAuth`).

2. **Route groups define layout boundaries.**
   - `(public)/layout.tsx` → Navbar + Footer
   - `(auth)/layout.tsx` → Centered minimal container
   - `dashboard/layout.tsx` → Patient sidebar + header
   - `admin/layout.tsx` → Admin sidebar + header

3. **Components are organized by domain:**
   - `components/ui/` → Reusable primitives (buttons, inputs, dialogs). Framework-agnostic.
   - `components/layout/` → Navbar, Footer, Sidebars, DashboardHeader.
   - `components/home/` → Homepage sections. Used only by the public page.
   - `components/admin/` → Admin tables, forms. Used only by admin pages.
   - `components/patient/` → Patient cards, forms. Used only by dashboard pages.

4. **Data fetching pattern:**
   - Server Components: Use `fetch()` directly at render time with the backend API URL.
   - Client Components: Use `useEffect` + `useAuth().getToken()` + `lib/api.ts` functions.

5. **All API calls from client components go through `lib/api.ts`.** Do not call `fetch()` directly in page/component files. All endpoint URLs, headers, and error handling are centralized in `lib/api.ts`.

6. **Images use `next/image`** with files in `public/images/`. Do not use `<img>` tags. Do not import images with `import x from "@/assets/..."`.

7. **Navigation uses `next/link`** for internal routes. Use anchor `<a href="#section">` only for same-page section links on the homepage.

8. **Styling uses existing design tokens.** Use CSS custom properties defined in `globals.css` (e.g., `bg-brand`, `text-accent-gold`, `shadow-elegant`). Do not hardcode hex/rgb colors. Do not introduce new color values without adding them to the design system first.

9. **Bilingual text convention:** English text is the default. Bangla text uses the `.font-bn` CSS class. Both languages appear together (English as primary, Bangla as subtitle/secondary). Do not create a language switcher — both are always visible.

10. **Clerk route protection is in `middleware.ts` only.** Do not add auth checks inside page components for route-level protection. Components can use `useUser()` for conditional UI rendering (showing/hiding elements), but route access enforcement happens exclusively in the middleware.

---

## Task Workflow

Follow this workflow for every task:

### 1. Identify the Task

- Find the specific checklist item in `backend_implementation_plan.md` or `frontend_implementation_plan.md`.
- Read the full sprint section containing the task for context.
- Identify dependencies — does this task depend on other uncompleted tasks?

### 2. Check Existing Code

- Before creating a new file, check if a file at that path already exists.
- Before adding a dependency, check if it's already in `package.json`.
- Before writing a utility function, check if one exists in `lib/utils.ts` or `services/`.

### 3. Implement

- Create or modify files one at a time.
- Follow the folder structure defined in `ARCHITECTURE.md`. Do not create new directories outside the documented structure without explicit approval.
- Write TypeScript that compiles without errors. Run `npx tsc --noEmit` mentally — all types must resolve.

### 4. Verify

- For backend route changes: describe how to test with curl/Postman (method, URL, headers, body).
- For frontend changes: verify the dev server would render without errors.
- For schema changes: include the Prisma migration command.

### 5. Update Progress

- After completing a task, mark it as `[x]` in the relevant implementation plan file.
- If a task reveals new sub-tasks or issues, add them as new checklist items under the appropriate sprint.

### 6. Update Documentation

- If you add a new API endpoint, add it to the API Endpoints table in `README.md`.
- If you add a new environment variable, add it to the Environment Variables section in `README.md` and to `.env.example` / `.env.local.example`.
- If you change the folder structure, update `ARCHITECTURE.md`.
- If you discover a limitation or bug, add it to the Known Limitations section in `README.md`.

---

## Testing Requirements

### Backend

- Every route handler must work with valid input (happy path).
- Every route handler must return proper error responses for:
  - Missing required fields → 400
  - Invalid field types/formats → 400
  - Resource not found → 404
  - Unauthenticated request → 401
  - Unauthorized role → 403
- Prisma queries must handle the case where a record does not exist (return 404, do not crash).
- The serial number calculation must handle concurrent requests safely (two patients booking the same doctor+date simultaneously must get different serial numbers).

### Frontend

- All pages must render without runtime errors.
- All forms must validate before submission (required fields, format checks).
- All API calls must handle: loading state, success state, error state.
- All list views must handle: empty state (no items), loading state (skeleton), error state.
- All interactive elements (buttons, links, inputs) must have appropriate `id` attributes for testing.
- Navigation between all routes must work without full page reloads (client-side navigation).

### Build Verification

Before considering any sprint complete:

```bash
# Backend
cd Backend && npx tsc --noEmit

# Frontend
cd Frontend && npm run build
```

Both commands must pass with zero errors.

---

## Documentation Requirements

### Files That Must Be Updated

| When you... | Update these files |
|---|---|
| Add a new API endpoint | `README.md` (API Endpoints table) |
| Add a new environment variable | `README.md` (Env Vars table), `.env.example` or `.env.local.example` |
| Change folder structure | `ARCHITECTURE.md` (Folder Structure section) |
| Add a new third-party package | `README.md` (Tech Stack table) if it's a major dependency |
| Complete a sprint task | `backend_implementation_plan.md` or `frontend_implementation_plan.md` (mark `[x]`) |
| Discover a bug or limitation | `README.md` (Known Limitations section) |
| Change database schema | `ARCHITECTURE.md` (Database Architecture section) |
| Change auth flow | `ARCHITECTURE.md` (Authentication Flow section) |

### Documentation Style

- Use Markdown tables for structured data.
- Use code blocks with language identifiers for all code snippets.
- Use absolute file paths in documentation when referencing project files.
- Keep descriptions concise — one sentence per checklist item, one paragraph per section.

---

## Forbidden Actions

### Do Not Modify Reference Code

- Do not modify any file inside `Frontend-react/`. This directory is a read-only reference for the original React app. All new code goes in `Frontend/` and `Backend/`.

### Do Not Introduce New Frameworks

- Do not replace Express.js with Fastify, Hono, or any other backend framework.
- Do not replace Next.js with Remix, Nuxt, Astro, or any other frontend framework.
- Do not replace Prisma with Drizzle, TypeORM, Knex, or raw SQL.
- Do not replace Clerk with NextAuth, Auth0, Lucia, or any other auth provider.
- Do not replace TailwindCSS with CSS-in-JS, Styled Components, or any other styling approach.
- Do not add React Query, SWR, or any data fetching library. Use native `fetch` + `useEffect` for client components and server-side `fetch` for server components.
- Do not add a global state management library (Redux, Zustand, Jotai, MobX). State is managed through component state, Clerk context, and URL params.

### Do Not Bypass Validation

- Do not skip Zod validation on any API request body.
- Do not skip Zod validation on environment variables.
- Do not use `as any` or `@ts-ignore` to suppress type errors. Fix the type instead.
- Do not skip `requireAuth()` or `requireRole()` middleware on protected routes.

### Do Not Change Established Patterns

- Do not change the API response format (`{ success, data }` / `{ success, error }`).
- Do not change the URL namespace structure (`/api/public/`, `/api/patient/`, `/api/admin/`).
- Do not change the database column naming convention (snake_case with Prisma `@map`).
- Do not change the component organization pattern (domain-based folders under `components/`).
- Do not change the middleware execution order in `src/index.ts`.

### Do Not Make Unscoped Changes

- Do not modify files unrelated to your current task.
- Do not refactor existing working code unless the task explicitly requires it.
- Do not update dependency versions unless required to fix a bug.
- Do not add features not listed in the implementation plans without explicit approval.
- Do not delete or rename existing files without documenting the change.

### Do Not Hardcode Values

- Do not hardcode API URLs. Use `NEXT_PUBLIC_API_URL` env var.
- Do not hardcode email addresses. Use `ADMIN_EMAIL` env var.
- Do not hardcode colors. Use CSS custom properties from `globals.css`.
- Do not hardcode doctor data. Fetch from the API.
- Do not hardcode Clerk keys. Use env vars.

### Do Not Ignore Error Handling

- Do not use `.then()` without `.catch()`.
- Do not use `async/await` without try/catch in route handlers.
- Do not silently swallow errors. Log them and return appropriate HTTP status codes.
- Do not show raw error messages to users. Show user-friendly messages and log the raw error server-side.

---

## Quick Reference

### Key File Paths

```
Backend/src/index.ts              — Express entry point
Backend/src/config/env.ts         — Environment config
Backend/src/middleware/auth.ts     — Clerk RBAC
Backend/prisma/schema.prisma      — Database schema

Frontend/src/app/layout.tsx       — Root layout
Frontend/src/app/globals.css      — Design system
Frontend/src/middleware.ts        — Route protection
Frontend/src/lib/api.ts           — Backend API client
Frontend/src/lib/utils.ts         — Utility functions
```

### Key Commands

```bash
# Backend
cd Backend && npm run dev              # Start dev server
cd Backend && npx prisma migrate dev   # Run migration
cd Backend && npx prisma studio        # Visual DB browser
cd Backend && npx tsc --noEmit         # Type check

# Frontend
cd Frontend && npm run dev             # Start dev server
cd Frontend && npm run build           # Production build
```

### Status Values

```
Appointment: PENDING | CONFIRMED | CANCELLED
MedicalTest: Processing | Ready for Delivery | Delivered
```
