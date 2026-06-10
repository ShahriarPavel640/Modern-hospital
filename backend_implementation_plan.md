# Backend Implementation Plan — Modern Hospital

## Project Status Assessment

### Current State: 🔴 Not Started

| Area | Status |
|------|--------|
| Project initialization | ❌ Not started — `Backend/` is an empty directory |
| Database schema | ❌ Not started — no Prisma schema |
| Authentication middleware | ❌ Not started |
| API routes | ❌ Not started |
| Services (Cloudinary, Mailer) | ❌ Not started |
| Environment config | ❌ Not started |
| Deployment config | ❌ Not started |

### Existing Reference Material

- `plan_draft.md` — Original requirements and schema draft
- `ARCHITECTURE.md` — Finalized architecture decisions
- `README.md` — Tech stack, env vars, API endpoints documented

### Implemented Features

None. The `Backend/` directory is empty.

### Missing Features (All)

- [ ] Project scaffolding (package.json, tsconfig, dependencies)
- [ ] Prisma schema and database migration
- [ ] Environment variable validation
- [ ] Express server with middleware chain
- [ ] Clerk authentication middleware
- [ ] Cloudinary image service
- [ ] Nodemailer email service
- [ ] Public API routes (doctors list, serial booking)
- [ ] Admin API routes (doctor CRUD, test CRUD, appointment management)
- [ ] Patient API routes (dashboard queries, phone linking)

### Technical Debt

None yet — greenfield project.

### Bugs

None yet — no code exists.

### Incomplete Modules

All modules are incomplete (not yet created).

---

## Prioritized Roadmap

### Current Sprint — Foundation & Core API

> Goal: Working Express server with database, auth, and all API endpoints functional locally.

#### Sprint 1.1 — Project Setup (~30 min)

- [x] Run `npm init -y` in `Backend/`
- [x] Create `tsconfig.json` with strict TypeScript, NodeNext module, ESM
- [x] Install production dependencies: `express`, `@prisma/client`, `@clerk/express`, `cloudinary`, `cors`, `helmet`, `multer`, `nodemailer`, `zod`
- [x] Install dev dependencies: `prisma`, `tsx`, `typescript`, `@types/express`, `@types/cors`, `@types/multer`, `@types/nodemailer`, `@types/node`
- [x] Add scripts to `package.json`: `dev`, `build`, `start`, `db:migrate`, `db:push`, `db:generate`, `db:studio`
- [x] Create `.gitignore` (node_modules, dist, .env)
- [x] Create `.env.example` with all required variables

#### Sprint 1.2 — Database Schema (~30 min)

- [x] Create `prisma/schema.prisma` with datasource and generator config
- [x] Define `Doctor` model (id, name, nameBn, specialty, degrees, visitingHours, imageUrl, cloudinaryPublicId, isAvailable, createdAt, updatedAt)
- [x] Define `Appointment` model (id, patientName, patientPhone, doctorId FK, appointmentDate, serialNumber, status, createdAt)
- [x] Define `MedicalTest` model (id as VARCHAR PK, patientName, patientPhone, patientEmail, testNames, status, createdAt, updatedAt)
- [ ] Create `.env` with Supabase `DATABASE_URL`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Verify tables created in Supabase dashboard

#### Sprint 1.3 — Config & Middleware (~30 min)

- [x] Create `src/config/env.ts` — Zod schema validating all env vars at startup
- [x] Create `src/middleware/errorHandler.ts` — Express error middleware returning `{ success: false, error }` JSON
- [x] Create `src/middleware/auth.ts` — `requireRole('admin')` middleware using `getAuth()` from `@clerk/express`
- [x] Create `src/types/index.ts` — Shared TypeScript interfaces for request/response types

#### Sprint 1.4 — Express Server Entry Point (~30 min)

- [x] Create `src/index.ts` — Express app with middleware chain: helmet → cors → json → clerkMiddleware
- [x] Mount route placeholders for all route groups
- [x] Add `/api/health` endpoint returning `{ status: 'ok' }`
- [ ] Verify server starts with `npm run dev` (should crash on missing env vars via Zod — that's correct)
- [ ] Add real env vars to `.env` and verify server starts successfully

#### Sprint 1.5 — Services (~45 min)

- [x] Create `src/services/cloudinary.ts` — `uploadImage(buffer, folder)` returns `{ secure_url, public_id }` using `upload_stream`
- [x] Create `src/services/cloudinary.ts` — `deleteImage(publicId)` calls `cloudinary.uploader.destroy`
- [x] Create `src/services/mailer.ts` — Configure Nodemailer transporter with SMTP credentials from env
- [x] Create `src/services/mailer.ts` — `sendAppointmentNotification(data)` sends HTML email to `ADMIN_EMAIL`
- [x] Write email HTML template with patient name, phone, doctor, date, serial number

#### Sprint 1.6 — Public Routes (~45 min)

- [x] Create `src/routes/public/doctors.ts` — `GET /` returns available doctors (`isAvailable: true`), ordered by name, excludes `cloudinaryPublicId`
- [x] Create `src/routes/public/serials.ts` — `POST /` with Zod validation for body (patientName, patientPhone, doctorId, appointmentDate)
- [x] Implement serial number calculation: query max serial for doctor+date, add 1
- [x] Insert appointment record
- [x] Fire async email notification (no await)
- [x] Return `{ success: true, serialNumber, appointmentId }`
- [x] Mount routes in `index.ts` under `/api/public/doctors` and `/api/public/serials`
- [ ] Test with curl/Postman: list doctors, book appointment, verify email received

#### Sprint 1.7 — Admin Doctor Routes (~45 min)

- [x] Create `src/routes/admin/doctors.ts` — Apply `requireAuth()` + `requireRole('admin')` middleware
- [x] `GET /` — List all doctors (including unavailable)
- [x] `POST /` — Create doctor with multer (memory, 5MB, images only) + Cloudinary upload + Prisma insert
- [x] `PUT /:id` — Update doctor, optionally replace image (destroy old, upload new)
- [x] `DELETE /:id` — Delete doctor, destroy Cloudinary image, handle FK constraint (appointments exist → 400)
- [x] Mount routes in `index.ts` under `/api/admin/doctors`

#### Sprint 1.8 — Admin Test Routes (~30 min)

- [x] Create `src/routes/admin/tests.ts` — Apply `requireAuth()` + `requireRole('admin')` middleware
- [x] `GET /` — List all tests, support query params: `status` filter, `search` (searches id, patientName, patientPhone, patientEmail)
- [x] `POST /` — Create test with Zod validation (id required, patientName required, at least one of phone/email, testNames array min 1)
- [x] `PUT /:id` — Update test (any combination of fields, primarily status changes)
- [x] `DELETE /:id` — Delete test record
- [x] Mount routes in `index.ts` under `/api/admin/tests`

#### Sprint 1.9 — Admin Appointment Routes (~30 min)

- [x] Create `src/routes/admin/appointments.ts` — Apply `requireAuth()` + `requireRole('admin')` middleware
- [x] `GET /` — List appointments with optional filters: `date` (default today), `doctorId`, `status`. Join doctor details. Order by serialNumber ASC
- [x] `PUT /:id` — Update appointment status (PENDING/CONFIRMED/CANCELLED)
- [x] Mount routes in `index.ts` under `/api/admin/appointments`

#### Sprint 1.10 — Patient Dashboard Routes (~45 min)

- [x] Create `src/routes/patient/dashboard.ts` — Apply `requireAuth()` middleware (no role check — any logged-in user)
- [x] `GET /my-tests` — Extract email from `getAuth(req).sessionClaims`, query `medicalTest WHERE patientEmail = email`
- [x] `GET /tests-by-phone?phone=...` — Query `medicalTest WHERE patientPhone = phone`
- [x] `GET /search-test?testId=...` — Query `medicalTest WHERE id = testId`, return only testNames, status, updatedAt (or 404)
- [x] `GET /my-appointments?phone=...` — Query `appointments WHERE patientPhone = phone`, join doctor details
- [x] `POST /link-phone` — Validate phone in body, call `clerkClient.users.updateUserMetadata(userId, { publicMetadata: { phone } })`
- [x] Mount routes in `index.ts` under `/api/patient`

---

### Next Sprint — Verification & Hardening

> Goal: All endpoints tested, TypeScript compiles clean, ready for frontend integration.

#### Sprint 2.1 — TypeScript Verification (~30 min)

- [ ] Run `npx tsc --noEmit` — fix all type errors
- [ ] Ensure all route handlers have proper typing for req, res, next
- [ ] Verify Prisma types are generated and used correctly

#### Sprint 2.2 — Error Handling Review (~30 min)

- [x] Add try/catch to every route handler
- [x] Verify error handler catches Prisma errors (unique constraint, FK constraint, not found)
- [ ] Test 401/403 responses for unauthenticated/unauthorized requests
- [ ] Test 400 responses for invalid request bodies

#### Sprint 2.3 — Seed Data (~30 min)

- [x] Create `prisma/seed.ts` — Insert 4 sample doctors (matching the React app's hardcoded data)
- [x] Insert 3 sample test records with different statuses
- [x] Insert 5 sample appointments across 2 dates
- [x] Add seed script to `package.json`
- [ ] Run seed and verify data in Prisma Studio

#### Sprint 2.4 — Production Build (~30 min)

- [ ] Run `npm run build` — verify TypeScript compiles to `dist/`
- [ ] Run `node dist/index.js` — verify production build starts
- [ ] Test all endpoints against production build
- [x] Verify Render build command: `npm install && npx prisma generate && npm run build`
- [x] Verify Render start command: `npm start`

---

### Future Enhancements

> Not in scope for MVP. To be implemented after core features are live.

- [ ] Add `express-rate-limit` to public serial booking endpoint
- [ ] Add pagination to list endpoints (doctors, tests, appointments)
- [ ] Add request logging middleware (morgan or pino)
- [ ] Add Telegram bot notification as WhatsApp alternative
- [ ] Add test report file uploads (PDF/images via Cloudinary)
- [ ] Add bulk test status update endpoint
- [ ] Add appointment cancellation email to patient (if email provided)
- [ ] Add database connection pooling configuration for production
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add integration tests with a test database
