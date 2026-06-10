# Frontend Implementation Plan — Modern Hospital

## Project Status Assessment

### Current State: 🟢 All Core Features Implemented (Vite + TanStack Start)

| Area | Status |
|------|--------|
| React project initialization | ✅ Complete |
| Design system (CSS) | ✅ Complete in `src/styles.css` (TailwindCSS v4) |
| Homepage UI | ✅ Complete and interactive (dynamic booking, dynamic doctors list) |
| Static assets | ✅ Complete |
| Clerk auth integration | ✅ Complete (email OTP, metadata role checks) |
| Patient dashboard | ✅ Complete (tests matching, phone linking, matched appointments) |
| Admin dashboard | ✅ Complete (doctor CRUD with upload, test CRUD, appointment status updates) |
| API client | ✅ Complete (`lib/api.ts` fetch wrapper with auth header) |
| Route protection | ✅ Complete (Client-side wrappers and redirect enforcement) |
| Production Build | ✅ Verified passing (`npm run build`) |

---

## Completed Sprints

### Sprint 1 — Reorganization & Auth Setup
- [x] Revert to original React Vite + TanStack Start codebase (`Frontend-react/`)
- [x] Install `@clerk/clerk-react`
- [x] Remove Lovable error reporting references
- [x] Add `<ClerkProvider>` to root route (`__root.tsx`)
- [x] Create custom sign-in page (`sign-in.tsx`) with brand identity
- [x] Create custom sign-up page (`sign-up.tsx`) with brand identity
- [x] Integrate auth status buttons into homepage header & mobile menu (`index.tsx`)

### Sprint 2 — API Client & Dashboards
- [x] Implement native fetch API client (`lib/api.ts`) supporting token authorization
- [x] Create Patient Dashboard shell & Sidebar (`dashboard.tsx`)
- [x] Create Patient Reports View (`dashboard/index.tsx`) matching by verified email
- [x] Create Patient Phone Linking (`dashboard/link-phone.tsx`) loading matched test results & appointments
- [x] Create Admin Dashboard shell & Sidebar (`admin.tsx`) with role validation
- [x] Create Admin Metrics Overview (`admin/index.tsx`) with statistics cards
- [x] Create Admin Doctor CRUD Panel (`admin/doctors.tsx`) with `multipart/form-data` image uploading
- [x] Create Admin Test Reports CRUD Panel (`admin/tests.tsx`) with manual ID input and test tag selectors
- [x] Create Admin Appointment Management (`admin/appointments.tsx`) for serial confirmation or cancellation
- [x] Fix LightningCSS compilation issues with Tailwind v4 `@utility` by overriding css transformer to postcss in `vite.config.ts`
