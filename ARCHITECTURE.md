# Architecture — Modern Hospital

## Table of Contents

- [High-Level System Architecture](#high-level-system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [Authentication Flow](#authentication-flow)
- [API Structure](#api-structure)
- [State Management Approach](#state-management-approach)
- [Folder Structure](#folder-structure)
- [Design Patterns](#design-patterns)
- [Third-Party Integrations](#third-party-integrations)

---

## High-Level System Architecture

The system follows a **three-tier client-server architecture** with a clear separation between presentation, application logic, and data storage. The frontend and backend are independently deployed services that communicate over HTTPS via REST API.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js 15 (App Router)                  │  │
│  │                                                       │  │
│  │  Server Components ──── SSR HTML ──── SEO optimized   │  │
│  │  Client Components ──── Interactive UI ──── SPA-like  │  │
│  │  Middleware ──────────── Route protection via Clerk    │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                     Clerk JWT in headers                    │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                          HTTPS/REST
                               │
┌──────────────────────────────┼──────────────────────────────┐
│                        APPLICATION TIER                      │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │                Express.js (TypeScript)                 │  │
│  │                                                       │  │
│  │  Helmet ──── CORS ──── ClerkMiddleware ──── Router    │  │
│  │                                                       │  │
│  │  /api/public/*   ──── No authentication               │  │
│  │  /api/patient/*  ──── Clerk JWT required              │  │
│  │  /api/admin/*    ──── Clerk JWT + admin role required │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
│                         Prisma ORM                          │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                      PostgreSQL Protocol
                               │
┌──────────────────────────────┼──────────────────────────────┐
│                         DATA TIER                           │
│                              │                              │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │            Supabase (Managed PostgreSQL)               │  │
│  │                                                       │  │
│  │  doctors ──── appointments ──── medical_tests         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### External Service Dependencies

```
                    ┌──────────────┐
                    │   Clerk      │
                    │  (Identity)  │
                    └──────┬───────┘
                           │ JWT tokens + user metadata
                           │
┌──────────┐        ┌──────▼───────┐        ┌──────────────┐
│Cloudinary│◄───────│   Backend    │───────►│  Nodemailer   │
│ (Images) │        │  (Express)   │        │  (SMTP/Gmail) │
└──────────┘        └──────────────┘        └──────────────┘
```

| Service | Role | Communication |
|---|---|---|
| Clerk | Identity provider, JWT issuer, user metadata store | Frontend SDK + Backend JWT verification |
| Supabase | Managed PostgreSQL database | Prisma ORM over PostgreSQL protocol |
| Cloudinary | Doctor image storage and transformation | Backend SDK (upload_stream, destroy) |
| Nodemailer | Transactional email to admin | Backend SMTP connection (Gmail) |

---

## Frontend Architecture

### Rendering Strategy

The frontend uses Next.js 15 App Router with a **hybrid rendering model**:

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                     │
│                                                  │
│  Server Components (default)                     │
│  ├── Root Layout (ClerkProvider)                 │
│  ├── Public Layout (Navbar + Footer)             │
│  ├── Homepage (fetches doctors server-side)       │
│  └── Metadata generation                         │
│                                                  │
│  Client Components ("use client")                │
│  ├── Navbar (useState for mobile menu, useUser)  │
│  ├── AppointmentSection (form submission)        │
│  ├── Patient Dashboard (data fetching, forms)    │
│  └── Admin Dashboard (CRUD operations, modals)   │
│                                                  │
│  Edge Middleware                                 │
│  └── Clerk route matcher (auth enforcement)      │
└─────────────────────────────────────────────────┘
```

| Page | Rendering | Reason |
|---|---|---|
| Homepage (`/`) | Server Component (SSR) | SEO — portfolio must be indexable by search engines |
| DoctorsSection | Server Component | Doctor data fetched server-side, rendered as HTML |
| AppointmentSection | Client Component | Interactive form with state, API POST on submit |
| Navbar | Client Component | Mobile menu toggle state, Clerk `useUser()` hook |
| Auth pages | Client Component | Clerk `<SignIn>` / `<SignUp>` components |
| Patient Dashboard | Client Component | Multiple fetch calls, user interaction, form state |
| Admin Dashboard | Client Component | CRUD forms, modals, file uploads, table interactions |

### Route Groups

Next.js route groups (parenthesized folders) are used to apply different layouts to different sections without affecting the URL:

```
src/app/
├── (public)/           ← Layout: Navbar + Footer
│   ├── layout.tsx      ← Wraps children with Navbar and Footer
│   └── page.tsx        ← URL: /
│
├── (auth)/             ← Layout: Centered minimal container
│   ├── layout.tsx      ← Centered card layout, no navbar
│   ├── sign-in/        ← URL: /sign-in
│   └── sign-up/        ← URL: /sign-up
│
├── dashboard/          ← Layout: Patient sidebar + header
│   ├── layout.tsx      ← Patient sidebar, dashboard header with UserButton
│   └── page.tsx        ← URL: /dashboard
│
└── admin/              ← Layout: Admin sidebar + header
    ├── layout.tsx      ← Admin sidebar (dark), dashboard header
    ├── page.tsx        ← URL: /admin
    ├── doctors/        ← URL: /admin/doctors
    ├── tests/          ← URL: /admin/tests
    └── appointments/   ← URL: /admin/appointments
```

### Component Hierarchy

```
RootLayout (ClerkProvider, fonts, globals.css)
│
├── (public)/layout.tsx
│   ├── Navbar
│   └── page.tsx
│       ├── HeroSection
│       ├── AboutSection
│       ├── ServicesSection
│       ├── DoctorsSection          ← receives doctors[] as prop
│       ├── PackagesSection
│       ├── AppointmentSection      ← "use client", receives doctors[] as prop
│       ├── WhyChooseUsSection
│       └── ContactSection
│   └── Footer
│
├── (auth)/layout.tsx
│   ├── sign-in → <SignIn />
│   └── sign-up → <SignUp />
│
├── dashboard/layout.tsx
│   ├── PatientSidebar
│   ├── DashboardHeader             ← <UserButton />
│   └── page.tsx
│       ├── TestCard[]              ← email-matched tests
│       ├── PhoneLinkForm           ← link phone to Clerk metadata
│       ├── TestCard[]              ← phone-matched tests
│       ├── TestSearchForm          ← search by test ID
│       └── AppointmentCard[]       ← matched appointments
│
└── admin/layout.tsx
    ├── AdminSidebar
    ├── DashboardHeader
    ├── page.tsx                    ← StatsCards
    ├── doctors/page.tsx
    │   ├── DoctorTable
    │   └── DoctorForm (dialog)
    ├── tests/page.tsx
    │   ├── TestTable
    │   └── TestForm (dialog)
    └── appointments/page.tsx
        └── AppointmentTable
```

### Design System

The design system is defined entirely in `globals.css` using CSS custom properties and TailwindCSS v4:

```
globals.css
│
├── @import "tailwindcss"              ← TailwindCSS v4 base
│
├── @theme inline { ... }             ← Maps CSS vars to Tailwind utilities
│   ├── --color-brand → bg-brand, text-brand
│   ├── --color-brand-dark → bg-brand-dark
│   ├── --color-accent-gold → bg-accent-gold
│   └── ... (40+ token mappings)
│
├── :root { ... }                     ← Light mode color values (oklch)
│   ├── --brand: oklch(0.42 0.13 235)
│   ├── --brand-dark: oklch(0.22 0.08 245)
│   ├── --accent-gold: oklch(0.78 0.13 75)
│   └── ...
│
├── .dark { ... }                     ← Dark mode values (defined, not active)
│
├── Custom gradients
│   ├── --gradient-brand              ← 3-stop blue gradient
│   ├── --gradient-hero               ← Hero overlay gradient
│   └── --gradient-gold               ← Gold CTA gradient
│
├── Custom shadows
│   ├── --shadow-elegant              ← Prominent card shadow
│   └── --shadow-card                 ← Subtle card shadow
│
└── Utility classes
    ├── .bg-gradient-brand
    ├── .bg-gradient-hero
    ├── .bg-gradient-gold
    ├── .shadow-elegant
    ├── .shadow-card
    ├── .section-eyebrow              ← Section label with gold bar
    ├── .bg-medical-grid              ← Dot grid pattern overlay
    └── .font-bn                      ← Bangla font family
```

Color palette:

| Token | Color | Usage |
|---|---|---|
| `--brand` | Deep blue | Primary color, buttons, links |
| `--brand-dark` | Navy | Dark sections, admin sidebar, hero overlay |
| `--brand-light` | Light blue | Accents, secondary elements |
| `--brand-muted` | Very light blue | Section backgrounds |
| `--accent-gold` | Gold | CTAs, highlights, icons, active states |
| `--accent-red` | Red | Alerts, emergency badge |

Typography:

| Font | Variable | Usage |
|---|---|---|
| Inter | `--font-inter` | All English text (default body font) |
| Hind Siliguri | `--font-bengali` | All Bangla text (applied via `.font-bn` class) |

---

## Backend Architecture

### Request Pipeline

Every incoming request passes through the following middleware chain in order:

```
Incoming Request
      │
      ▼
┌─────────────┐
│   Helmet     │──── Sets security headers (X-Frame-Options, CSP, etc.)
└──────┬──────┘
       ▼
┌─────────────┐
│    CORS      │──── Validates Origin against FRONTEND_URL whitelist
└──────┬──────┘
       ▼
┌─────────────┐
│  express     │──── Parses JSON request bodies
│  .json()     │
└──────┬──────┘
       ▼
┌─────────────┐
│   Clerk      │──── Attaches auth context to req.auth (if token present)
│  Middleware   │──── Does NOT reject unauthenticated requests
└──────┬──────┘
       ▼
┌─────────────┐
│   Router     │──── Routes request to matching handler
└──────┬──────┘
       ▼
   ┌───┴───┐
   │       │
   ▼       ▼
/public  /patient or /admin
(no      (additional auth checks)
 check)       │
              ▼
         ┌─────────────┐
         │ requireAuth  │──── Rejects if no valid Clerk JWT (401)
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │ requireRole  │──── Checks sessionClaims.metadata.role (403)
         │  (admin      │     Only applied to /api/admin/* routes
         │   routes)    │
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │   Handler    │──── Route-specific business logic
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │   Error      │──── Catches thrown errors, returns JSON
         │  Handler     │     { success: false, error: string }
         └─────────────┘
```

### Route Module Structure

Each route file exports an Express Router with its handlers:

```
src/routes/
├── public/
│   ├── doctors.ts       ← GET /api/public/doctors
│   └── serials.ts       ← POST /api/public/serials
│
├── patient/
│   └── dashboard.ts     ← GET  /api/patient/my-tests
│                           GET  /api/patient/tests-by-phone
│                           GET  /api/patient/search-test
│                           GET  /api/patient/my-appointments
│                           POST /api/patient/link-phone
│
└── admin/
    ├── doctors.ts       ← GET    /api/admin/doctors
    │                       POST   /api/admin/doctors      (multipart)
    │                       PUT    /api/admin/doctors/:id   (multipart)
    │                       DELETE /api/admin/doctors/:id
    │
    ├── tests.ts         ← GET    /api/admin/tests
    │                       POST   /api/admin/tests
    │                       PUT    /api/admin/tests/:id
    │                       DELETE /api/admin/tests/:id
    │
    └── appointments.ts  ← GET    /api/admin/appointments
                            PUT    /api/admin/appointments/:id
```

### Service Layer

Business logic that spans multiple concerns is encapsulated in service modules:

```
src/services/
├── cloudinary.ts
│   ├── uploadImage(buffer, folder) → { secure_url, public_id }
│   └── deleteImage(publicId) → void
│
└── mailer.ts
    ├── transporter (Nodemailer SMTP)
    └── sendAppointmentNotification(data) → void (fire-and-forget)
```

The mailer service fires asynchronously on appointment creation. The API response is returned to the client without waiting for email delivery to complete.

### Environment Validation

At server startup, before Express begins listening:

```
process.env
    │
    ▼
┌──────────────┐
│  Zod Schema  │──── Validates all required env vars exist and have correct types
└──────┬───────┘
       │
       ├── Valid → Exports typed `env` object for use across the app
       │
       └── Invalid → Throws immediately with list of missing/invalid vars
                     Server does NOT start
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────┐
│              doctors                │
├─────────────────────────────────────┤
│ id                  UUID       PK   │
│ name                VARCHAR(255)    │
│ name_bn             VARCHAR(255)?   │
│ specialty           VARCHAR(255)    │
│ degrees             TEXT[]          │
│ visiting_hours      VARCHAR(255)    │
│ image_url           VARCHAR(512)    │
│ cloudinary_public_id VARCHAR(255)   │
│ is_available        BOOLEAN         │
│ created_at          TIMESTAMPTZ     │
│ updated_at          TIMESTAMPTZ     │
└──────────────┬──────────────────────┘
               │
               │ 1:N (doctor_id FK)
               │ ON DELETE RESTRICT
               │
┌──────────────▼──────────────────────┐
│           appointments              │
├─────────────────────────────────────┤
│ id                  UUID       PK   │
│ patient_name        VARCHAR(255)    │
│ patient_phone       VARCHAR(20)     │
│ doctor_id           UUID       FK   │
│ appointment_date    DATE            │
│ serial_number       INT             │
│ status              VARCHAR(50)     │
│ created_at          TIMESTAMPTZ     │
└─────────────────────────────────────┘


┌─────────────────────────────────────┐
│          medical_tests              │
├─────────────────────────────────────┤
│ id                  VARCHAR(50) PK  │ ← Manually entered (e.g., LAB-100234)
│ patient_name        VARCHAR(255)    │
│ patient_phone       VARCHAR(20)?    │ ← At least one of phone/email required
│ patient_email       VARCHAR(255)?   │ ← (enforced in application logic)
│ test_names          TEXT[]          │
│ status              VARCHAR(50)     │
│ created_at          TIMESTAMPTZ     │
│ updated_at          TIMESTAMPTZ     │
└─────────────────────────────────────┘
```

### Relationships

| Relationship | Type | Constraint |
|---|---|---|
| `doctors` → `appointments` | One-to-Many | `appointments.doctor_id` FK references `doctors.id` |
| `doctors` ← `appointments` | Delete restriction | `ON DELETE RESTRICT` — cannot delete a doctor with existing appointments |
| `medical_tests` | Standalone | No FK relationships. Linked to patients via `patient_phone` and/or `patient_email` matched at query time |

### Data Matching Strategy

There is no `patients` table. Patient identity lives in Clerk. Data is matched at query time:

```
Clerk User (email: "patient@email.com", metadata.phone: "01XXXXXXXXX")
         │
         ├── Email match ──► SELECT * FROM medical_tests WHERE patient_email = 'patient@email.com'
         │
         ├── Phone match ──► SELECT * FROM medical_tests WHERE patient_phone = '01XXXXXXXXX'
         │
         └── Phone match ──► SELECT * FROM appointments WHERE patient_phone = '01XXXXXXXXX'
```

### Serial Number Calculation

Serial numbers are not stored as auto-increment sequences. They are calculated at insertion time:

```sql
-- Pseudocode executed by Prisma
SELECT MAX(serial_number) as max_serial
FROM appointments
WHERE doctor_id = $doctorId
  AND appointment_date = $appointmentDate;

-- New serial = COALESCE(max_serial, 0) + 1
INSERT INTO appointments (serial_number, ...) VALUES (max_serial + 1, ...);
```

This produces a daily-reset sequence per doctor:

```
Doctor A, June 9:  Serial 1, 2, 3, 4, ...
Doctor A, June 10: Serial 1, 2, 3, ...     ← Resets
Doctor B, June 9:  Serial 1, 2, ...         ← Independent counter
```

### Status Enumerations

Statuses are stored as VARCHAR strings, not database enums. Validation is enforced in application logic.

**Appointment statuses:**

```
PENDING ──► CONFIRMED
   │              │
   └──► CANCELLED ◄┘
```

**Medical test statuses:**

```
Processing ──► Ready for Delivery ──► Delivered
```

---

## Authentication Flow

### Clerk Email OTP Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Browser  │         │  Clerk   │         │  Backend  │
└─────┬────┘         └─────┬────┘         └─────┬────┘
      │                    │                     │
      │  1. Enter email    │                     │
      │───────────────────►│                     │
      │                    │                     │
      │  2. OTP sent       │                     │
      │◄───────────────────│                     │
      │                    │                     │
      │  3. Enter OTP      │                     │
      │───────────────────►│                     │
      │                    │                     │
      │  4. JWT issued     │                     │
      │◄───────────────────│                     │
      │                    │                     │
      │  5. API request    │                     │
      │  (Bearer JWT)      │                     │
      │────────────────────┼────────────────────►│
      │                    │                     │
      │                    │  6. Verify JWT       │
      │                    │◄────────────────────│
      │                    │                     │
      │                    │  7. Claims returned  │
      │                    │────────────────────►│
      │                    │                     │
      │  8. Response       │                     │
      │◄───────────────────┼─────────────────────│
      │                    │                     │
```

### Route Protection (Next.js Middleware)

```
Incoming request to Next.js
         │
         ▼
┌─────────────────┐
│  middleware.ts   │
│  (Edge Runtime)  │
└────────┬────────┘
         │
         ├── Matches public route? (/, /sign-in, /sign-up)
         │   └── Yes → Allow through (no auth check)
         │
         ├── Not public → auth.protect()
         │   └── No valid session → Redirect to /sign-in
         │
         └── Matches /admin/* ?
             └── Yes → Check sessionClaims.metadata.role
                 ├── role === 'admin' → Allow through
                 └── role !== 'admin' → Redirect to /dashboard
```

### Role Assignment

```
┌─────────────────────────────────────────────────┐
│                  Clerk Dashboard                 │
│                                                  │
│  User: admin@hospital.com                        │
│  publicMetadata: { "role": "admin" }             │
│  ──── Manually set by developer/owner            │
│                                                  │
│  User: patient@email.com                         │
│  publicMetadata: { }                             │
│  ──── Defaults to "patient" role in app logic    │
│  ──── May later contain: { "phone": "01XXX" }   │
│                                                  │
└─────────────────────────────────────────────────┘
```

The backend reads the role from the JWT's session claims:

```
JWT sessionClaims.metadata.role
     │
     ├── "admin" → Full admin API access
     ├── "patient" → Patient API access only
     └── undefined/missing → Treated as "patient"
```

### Phone Linking Flow

```
Patient Dashboard
      │
      │  1. Enter phone number "01XXXXXXXXX"
      │
      ▼
POST /api/patient/link-phone { phone: "01XXXXXXXXX" }
      │
      │  2. Backend calls Clerk Admin API
      │
      ▼
clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { phone: "01XXXXXXXXX" }
})
      │
      │  3. Phone persisted in Clerk user profile
      │
      ▼
Next page load: useUser().publicMetadata.phone === "01XXXXXXXXX"
      │
      │  4. Auto-fetch tests by phone
      │
      ▼
GET /api/patient/tests-by-phone?phone=01XXXXXXXXX
```

---

## API Structure

### URL Namespace Convention

```
/api
├── /public           ← No authentication
│   ├── /doctors      ← Doctor listing
│   └── /serials      ← Appointment booking
│
├── /patient          ← Clerk JWT required (any authenticated user)
│   ├── /my-tests     ← Tests by email
│   ├── /tests-by-phone  ← Tests by phone
│   ├── /search-test  ← Test by ID
│   ├── /my-appointments ← Appointments by phone
│   └── /link-phone   ← Save phone to Clerk
│
└── /admin            ← Clerk JWT + role === "admin"
    ├── /doctors      ← CRUD
    ├── /tests        ← CRUD
    └── /appointments ← Read + status update
```

### Request/Response Format

All endpoints use JSON for request and response bodies, except doctor creation/update which uses `multipart/form-data` for image uploads.

**Standard success response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Standard error response:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**HTTP status codes used:**

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 500 | Internal server error |

### Request Validation

Request bodies are validated using Zod schemas at the route handler level before any database operations:

```
Incoming JSON body
       │
       ▼
┌──────────────┐
│  Zod Schema  │──── .safeParse(req.body)
└──────┬───────┘
       │
       ├── Valid → Proceed with typed data
       │
       └── Invalid → 400 response with validation errors
```

---

## State Management Approach

### Frontend State Categories

The application does not use a global state management library (no Redux, Zustand, or Jotai). State is managed through a combination of:

```
┌─────────────────────────────────────────────────┐
│              State Management                    │
│                                                  │
│  1. Server State (Next.js)                       │
│     └── Server Components fetch data at render   │
│         time. No client-side caching.            │
│         Used for: doctor list on homepage         │
│                                                  │
│  2. Auth State (Clerk)                           │
│     └── Managed by ClerkProvider context.        │
│         Accessed via useUser(), useAuth() hooks. │
│         Includes: email, publicMetadata.phone,   │
│         publicMetadata.role                      │
│                                                  │
│  3. Component State (React useState)             │
│     └── Local to each component.                 │
│         Used for: form inputs, modal open/close, │
│         mobile menu toggle, filter selections,   │
│         loading states, fetched data arrays      │
│                                                  │
│  4. URL State (Next.js router)                   │
│     └── Query parameters for filters.            │
│         Used for: date filter, status filter,    │
│         doctor filter on admin pages             │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Data Fetching Pattern

**Server Components** (homepage):
```
page.tsx (server) ──── fetch() at render time ──── pass as props to children
```

**Client Components** (dashboards):
```
"use client"
│
├── useEffect on mount → fetch with Clerk token → setState
│
├── Form submit → fetch POST/PUT/DELETE → refetch list → setState
│
└── useAuth().getToken() → provides Bearer token for every API call
```

### No Caching Layer

There is no client-side query cache (React Query is not used in the Next.js app). Each page load or user action triggers a fresh fetch from the backend. The backend queries the database directly on every request with no application-level cache.

---

## Folder Structure

### Complete Layout

```
Modern-hospital/
│
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma                  # Prisma schema definition
│   │
│   ├── src/
│   │   ├── index.ts                       # App entry: middleware chain + route mounting + listen
│   │   │
│   │   ├── config/
│   │   │   └── env.ts                     # Zod schema validating process.env at startup
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                    # requireRole() — checks Clerk sessionClaims
│   │   │   └── errorHandler.ts            # Express error middleware (4-arg signature)
│   │   │
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   │   ├── doctors.ts             # Router: GET, POST (multer), PUT (multer), DELETE
│   │   │   │   ├── tests.ts              # Router: GET, POST, PUT, DELETE
│   │   │   │   └── appointments.ts        # Router: GET, PUT
│   │   │   │
│   │   │   ├── patient/
│   │   │   │   └── dashboard.ts           # Router: GET my-tests, tests-by-phone, search-test,
│   │   │   │                              #         my-appointments; POST link-phone
│   │   │   │
│   │   │   └── public/
│   │   │       ├── doctors.ts             # Router: GET (list available)
│   │   │       └── serials.ts             # Router: POST (book + email)
│   │   │
│   │   ├── services/
│   │   │   ├── cloudinary.ts             # uploadImage(), deleteImage()
│   │   │   └── mailer.ts                 # transporter config, sendAppointmentNotification()
│   │   │
│   │   └── types/
│   │       └── index.ts                   # Shared TypeScript interfaces
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── Frontend/
│   ├── public/
│   │   └── images/
│   │       ├── modern-hospital-logo.png
│   │       ├── hospital-hero.jpg
│   │       ├── doctor-1.jpg
│   │       ├── doctor-2.jpg
│   │       ├── doctor-3.jpg
│   │       └── doctor-4.jpg
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css                # Full design system (TW v4 + CSS vars + utilities)
│   │   │   ├── layout.tsx                 # Root: <ClerkProvider>, <html>, fonts
│   │   │   │
│   │   │   ├── (public)/                  # Route group — no URL segment
│   │   │   │   ├── layout.tsx             # Navbar + {children} + Footer
│   │   │   │   └── page.tsx               # / — Portfolio homepage (SSR)
│   │   │   │
│   │   │   ├── (auth)/                    # Route group — no URL segment
│   │   │   │   ├── layout.tsx             # Centered container, no nav
│   │   │   │   ├── sign-in/
│   │   │   │   │   └── [[...sign-in]]/
│   │   │   │   │       └── page.tsx       # /sign-in — <SignIn />
│   │   │   │   └── sign-up/
│   │   │   │       └── [[...sign-up]]/
│   │   │   │           └── page.tsx       # /sign-up — <SignUp />
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx             # PatientSidebar + DashboardHeader + {children}
│   │   │   │   └── page.tsx               # /dashboard — Patient overview
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── layout.tsx             # AdminSidebar + DashboardHeader + {children}
│   │   │       ├── page.tsx               # /admin — Stats overview
│   │   │       ├── doctors/
│   │   │       │   └── page.tsx           # /admin/doctors — Doctor CRUD
│   │   │       ├── tests/
│   │   │       │   └── page.tsx           # /admin/tests — Test CRUD
│   │   │       └── appointments/
│   │   │           └── page.tsx           # /admin/appointments — Appointment mgmt
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                        # Reusable UI primitives (Radix-based)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   └── sonner.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx             # Top navigation bar
│   │   │   │   ├── Footer.tsx             # Site footer
│   │   │   │   ├── AdminSidebar.tsx       # Admin nav sidebar
│   │   │   │   ├── PatientSidebar.tsx     # Patient nav sidebar
│   │   │   │   └── DashboardHeader.tsx    # Header with UserButton
│   │   │   │
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── AboutSection.tsx
│   │   │   │   ├── ServicesSection.tsx
│   │   │   │   ├── DoctorsSection.tsx
│   │   │   │   ├── PackagesSection.tsx
│   │   │   │   ├── AppointmentSection.tsx
│   │   │   │   ├── WhyChooseUsSection.tsx
│   │   │   │   └── ContactSection.tsx
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── DoctorForm.tsx
│   │   │   │   ├── DoctorTable.tsx
│   │   │   │   ├── TestForm.tsx
│   │   │   │   ├── TestTable.tsx
│   │   │   │   ├── AppointmentTable.tsx
│   │   │   │   └── StatsCards.tsx
│   │   │   │
│   │   │   └── patient/
│   │   │       ├── TestCard.tsx
│   │   │       ├── PhoneLinkForm.tsx
│   │   │       ├── TestSearchForm.tsx
│   │   │       └── AppointmentCard.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                     # Backend API fetch wrapper
│   │   │   └── utils.ts                   # cn(), formatDate(), etc.
│   │   │
│   │   └── middleware.ts                  # Clerk route protection (Edge)
│   │
│   ├── next.config.ts
│   ├── package.json
│   └── .env.local.example
│
├── Frontend-react/                        # Original React app (reference only)
│
├── backend_implementation_plan.md
├── frontend_implementation_plan.md
├── plan_draft.md
├── ARCHITECTURE.md
├── README.md
└── .gitignore
```

---

## Design Patterns

### 1. Route Group Pattern (Next.js)

Parenthesized folders `(public)`, `(auth)` create layout boundaries without affecting URLs. This allows different visual shells (navbar+footer vs. centered card vs. sidebar) for different sections of the app.

### 2. Middleware Chain Pattern (Express)

Security and auth middleware are applied globally in a specific order. Route-specific middleware (`requireAuth`, `requireRole`) is applied at the router level, not globally.

### 3. Service Layer Pattern (Backend)

Cross-cutting concerns (email, image upload) are extracted into service modules (`services/cloudinary.ts`, `services/mailer.ts`) rather than being embedded in route handlers. Route handlers call services; services do not call each other.

### 4. Repository Pattern via Prisma

Prisma acts as the data access layer. Route handlers call Prisma directly (no additional repository abstraction). The Prisma schema is the single source of truth for database structure.

### 5. Fire-and-Forget Pattern (Email)

Appointment email notifications are dispatched asynchronously without awaiting completion. The API response is returned to the client immediately. If the email fails, the appointment is still successfully created.

### 6. Composition Pattern (Homepage)

The homepage is composed of independent section components (`HeroSection`, `AboutSection`, etc.) that receive data as props. Each section is self-contained and can be rendered independently.

### 7. Colocation Pattern (Next.js)

Components are colocated with their consuming pages by domain: `components/home/` for homepage, `components/admin/` for admin pages, `components/patient/` for patient pages. Shared primitives live in `components/ui/`.

### 8. Environment Validation Pattern

Environment variables are validated at application startup using a Zod schema. The application crashes immediately if required variables are missing, preventing runtime failures from misconfiguration.

### 9. Token-Based Authentication Pattern

Authentication is fully stateless. The frontend includes a Clerk JWT in the `Authorization: Bearer <token>` header. The backend verifies the token on every request. No session storage exists on the backend.

### 10. Soft Enum Pattern

Status values (`PENDING`, `CONFIRMED`, `CANCELLED`, `Processing`, `Ready for Delivery`, `Delivered`) are stored as VARCHAR strings rather than PostgreSQL enums. Validation of allowed values is handled in application logic via Zod schemas.

---

## Third-Party Integrations

### Clerk

**Purpose:** Authentication and identity management.

**Integration points:**

| Location | Package | Usage |
|---|---|---|
| Frontend root layout | `@clerk/nextjs` `<ClerkProvider>` | Wraps entire app with auth context |
| Frontend middleware | `@clerk/nextjs/server` `clerkMiddleware` | Edge-level route protection |
| Frontend components | `@clerk/nextjs` `useUser()`, `useAuth()` | Access user data, get JWT token |
| Frontend auth pages | `@clerk/nextjs` `<SignIn>`, `<SignUp>` | Pre-built auth UI components |
| Frontend header | `@clerk/nextjs` `<UserButton>` | User avatar dropdown with sign-out |
| Backend middleware | `@clerk/express` `clerkMiddleware()` | Attaches auth context to every request |
| Backend routes | `@clerk/express` `getAuth()` | Extracts userId, email, role from JWT |
| Backend patient API | `@clerk/express` `clerkClient` | Updates user publicMetadata (phone linking) |

**Configuration:** Clerk application configured with email OTP as the only sign-in method. Admin role is set manually in Clerk dashboard via `publicMetadata: { "role": "admin" }`.

---

### Supabase

**Purpose:** Managed PostgreSQL database hosting.

**Integration point:** Connection string (`DATABASE_URL`) consumed by Prisma ORM. Supabase is used exclusively as a database host. Supabase Auth, Realtime, Storage, and RLS features are not used.

**Connection:** Prisma connects via PostgreSQL protocol with SSL (`?sslmode=require`).

---

### Cloudinary

**Purpose:** Doctor profile image storage, transformation, and delivery.

**Integration points:**

| Operation | Method | When |
|---|---|---|
| Upload | `cloudinary.uploader.upload_stream()` | Admin creates/updates doctor with new image |
| Delete | `cloudinary.uploader.destroy()` | Admin deletes doctor or replaces doctor image |
| Serve | Cloudinary CDN URL stored in `doctors.image_url` | Frontend renders `<Image src={imageUrl}>` |

**Upload flow:**
```
Browser (FormData with file)
    │
    ▼
Multer (memory storage, 5MB limit, image/* only)
    │
    ▼
Buffer in memory
    │
    ▼
cloudinary.uploader.upload_stream({
  folder: 'modern-hospital/doctors'
})
    │
    ▼
Returns { secure_url, public_id }
    │
    ▼
Stored in doctors table: image_url, cloudinary_public_id
```

---

### Nodemailer

**Purpose:** Send email notifications to the hospital admin when a new appointment is booked.

**Integration point:** Single service module (`services/mailer.ts`) used by the serial booking route handler.

**Configuration:**

| Setting | Value |
|---|---|
| Transport | SMTP |
| Host | Configurable (`SMTP_HOST`, defaults to `smtp.gmail.com`) |
| Port | Configurable (`SMTP_PORT`, defaults to `587`) |
| Auth | Username/password (Gmail App Passwords) |
| From | `SMTP_USER` env var |
| To | `ADMIN_EMAIL` env var |

**Email content:** HTML-formatted message containing appointment details — patient name, phone number, doctor name, appointment date, and assigned serial number.

**Trigger:** Fired asynchronously after successful appointment insertion. Not awaited — API responds before email delivery completes.

---

### Radix UI

**Purpose:** Accessible, unstyled UI primitives used as the foundation for the component library.

**Components used:**

| Radix Package | Used For |
|---|---|
| `@radix-ui/react-dialog` | Modal dialogs (doctor form, test form, confirmations) |
| `@radix-ui/react-select` | Dropdown selects (doctor picker, status filter) |
| `@radix-ui/react-dropdown-menu` | Action menus in tables |
| `@radix-ui/react-tabs` | Dashboard tab sections |
| `@radix-ui/react-label` | Form labels |
| `@radix-ui/react-slot` | Button component composition |

These are styled with TailwindCSS utilities and wrapped in custom components under `components/ui/`. The pattern follows shadcn/ui conventions — components are copied into the project (not imported from a package), giving full control over styling and behavior.
