# Modern Hospital Pvt. Limited — মডার্ন হসপিটাল (প্রা.) লিমিটেড

Full-stack web application for **Modern Hospital Pvt. Limited**, a private healthcare institution located in Maijdee, Noakhali, Bangladesh. Established in 1996.

The application serves as a **public-facing portfolio website** with integrated **appointment booking**, **admin management dashboards**, and **patient dashboards** — all within a single deployment.

---

## Table of Contents

- [Main Features](#main-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Build & Deployment](#build--deployment)
- [Authentication & Roles](#authentication--roles)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Known Limitations](#known-limitations)

---

## Main Features

### 1. Public Portfolio Website
- Bilingual content (English and Bangla)
- Hospital overview, services, doctor list, health checkup packages, contact info
- Google Maps embed for location
- Responsive design (mobile-first)
- SSR via Next.js for SEO

### 2. Appointment Booking (Public)
- Embedded form on the portfolio homepage (no separate page, no login required)
- Patient provides: **name**, **phone number**, **preferred doctor**, **date**
- Serial number is **auto-assigned** per doctor per day (resets daily)
- On successful booking, an **email notification** is sent to the hospital admin containing full patient details (name, phone, doctor, date, serial number)

### 3. Admin Dashboard (Protected — Admin Role Required)
- **Doctor Management**: Full CRUD — add, edit, delete doctors with image uploads (stored on Cloudinary)
- **Test Result Management**: Create test records with a **manually-entered test ID** (matching the hospital's paper invoice system), patient name, patient phone and/or email, test names, and status. Update test status: `Processing` → `Ready for Delivery` → `Delivered`
- **Appointment Management**: View all booked serials filtered by date and doctor. Update appointment status: `PENDING` → `CONFIRMED` → `CANCELLED`

### 4. Patient Dashboard (Protected — Login Required)
- Clerk email OTP authentication
- **Auto-matched tests**: Tests linked to the patient's verified Clerk email are displayed automatically on login
- **Phone number linking**: Patient can link their phone number (saved to Clerk profile metadata). Once linked, tests created with that phone number also appear automatically
- **Test ID search**: Search for a specific test by its ID
- **My Appointments**: View past and upcoming appointments (matched by linked phone number)

> **Note:** There is no separate public test lookup page. All test status checking requires the patient to log in to their dashboard.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org/) (App Router) | React framework with SSR |
| [TypeScript](https://www.typescriptlang.org/) (strict mode) | Type safety |
| [TailwindCSS v4](https://tailwindcss.com/) | Utility-first CSS |
| [Clerk](https://clerk.com/) (`@clerk/nextjs`) | Email OTP authentication |
| [Radix UI](https://www.radix-ui.com/) / shadcn components | Accessible UI primitives |
| [Lucide React](https://lucide.dev/) | Icon library |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form handling + validation |
| [Sonner](https://sonner.emilkowal.dev/) | Toast notifications |

### Backend

| Technology | Purpose |
|---|---|
| [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) | REST API server |
| [TypeScript](https://www.typescriptlang.org/) (strict mode) | Type safety |
| [Prisma ORM](https://www.prisma.io/) | Database client + migrations |
| [Supabase](https://supabase.com/) (PostgreSQL) | Hosted database (used as managed PostgreSQL only, not using Supabase Auth/RLS) |
| [Clerk](https://clerk.com/) (`@clerk/express`) | JWT validation + RBAC middleware |
| [Cloudinary](https://cloudinary.com/) | Doctor image upload, storage, and deletion |
| [Nodemailer](https://nodemailer.com/) | Email notifications to admin on new appointments |
| [Multer](https://github.com/expressjs/multer) | Multipart file upload parsing (memory storage) |
| [Zod](https://zod.dev/) | Environment variable + request body validation |
| [Helmet](https://helmetjs.github.io/) | Security headers |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│           Next.js Frontend (Render)          │
│                                              │
│  /              → Public portfolio (SSR)     │
│  /sign-in       → Clerk email OTP            │
│  /sign-up       → Clerk email OTP            │
│  /dashboard     → Patient dashboard          │
│  /admin/*       → Admin dashboard            │
└──────────────────────┬───────────────────────┘
                       │ REST API (fetch + Clerk JWT)
                       ▼
┌──────────────────────────────────────────────┐
│        Express.js Backend (Render)           │
│                                              │
│  /api/public/*   → No auth                  │
│  /api/patient/*  → Clerk auth (any user)     │
│  /api/admin/*    → Clerk auth (admin role)   │
│                                              │
│  Cloudinary ←── image upload/delete          │
│  Nodemailer ←── email to admin               │
└──────────────────────┬───────────────────────┘
                       │ Prisma ORM
                       ▼
┌──────────────────────────────────────────────┐
│        Supabase PostgreSQL                   │
│                                              │
│  doctors │ appointments │ medical_tests      │
└──────────────────────────────────────────────┘
```

The frontend and backend are deployed as **two separate services** on Render. They communicate via REST API with Clerk JWTs for authenticated requests.

---

## Project Structure

```
Modern-hospital/
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma              # Database schema
│   ├── src/
│   │   ├── index.ts                   # Express entry point
│   │   ├── config/
│   │   │   └── env.ts                 # Zod env validation
│   │   ├── middleware/
│   │   │   ├── auth.ts                # Clerk RBAC middleware
│   │   │   └── errorHandler.ts        # Global error handler
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   │   ├── doctors.ts         # Doctor CRUD
│   │   │   │   ├── tests.ts           # Test result CRUD
│   │   │   │   └── appointments.ts    # Appointment management
│   │   │   ├── patient/
│   │   │   │   └── dashboard.ts       # Patient queries
│   │   │   └── public/
│   │   │       ├── doctors.ts         # Public doctor list
│   │   │       └── serials.ts         # Serial booking + email
│   │   ├── services/
│   │   │   ├── cloudinary.ts          # Image upload/delete
│   │   │   └── mailer.ts             # Nodemailer setup
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── Frontend/
│   ├── public/
│   │   └── images/                    # Static assets (logo, hero, doctor placeholders)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css            # Design system (TailwindCSS v4)
│   │   │   ├── layout.tsx             # Root layout (ClerkProvider)
│   │   │   ├── (public)/
│   │   │   │   ├── layout.tsx         # Navbar + Footer
│   │   │   │   └── page.tsx           # Homepage (portfolio)
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx         # Patient dashboard shell
│   │   │   │   └── page.tsx           # Patient overview
│   │   │   └── admin/
│   │   │       ├── layout.tsx         # Admin dashboard shell
│   │   │       ├── page.tsx           # Admin overview
│   │   │       ├── doctors/page.tsx
│   │   │       ├── tests/page.tsx
│   │   │       └── appointments/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # Shared UI primitives
│   │   │   ├── layout/               # Navbar, Footer, Sidebars
│   │   │   ├── home/                 # Homepage section components
│   │   │   ├── admin/                # Admin-specific components
│   │   │   └── patient/             # Patient-specific components
│   │   ├── lib/
│   │   │   ├── api.ts               # Backend API client
│   │   │   └── utils.ts             # Utility functions
│   │   └── middleware.ts            # Clerk route protection
│   ├── next.config.ts
│   ├── package.json
│   └── .env.local.example
│
├── Frontend-react/                   # Original React/TanStack app (reference only)
├── backend_implementation_plan.md
├── frontend_implementation_plan.md
├── plan_draft.md                     # Initial requirements draft
├── README.md
└── .gitignore
```

> **Note:** `Frontend-react/` contains the original React (Vite + TanStack Router) portfolio site. It is used as a reference for the Next.js migration and is not part of the production deployment.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.com/) project (free tier is sufficient)
- A [Clerk](https://clerk.com/) application (free tier is sufficient)
- A [Cloudinary](https://cloudinary.com/) account (free tier is sufficient)
- An email account with SMTP access for Nodemailer (e.g., Gmail with [App Passwords](https://support.google.com/accounts/answer/185833))

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ShahriarPavel640/Modern-hospital.git
cd Modern-hospital
```

### 2. Backend setup

```bash
cd Backend
npm install
cp .env.example .env
# Fill in .env with your actual credentials (see Environment Variables section)
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Frontend setup

```bash
cd Frontend
npm install
cp .env.local.example .env.local
# Fill in .env.local with your actual credentials (see Environment Variables section)
```

### 4. Copy static assets

Copy image assets from the reference React app to the Next.js public directory:

```bash
# From project root
cp Frontend-react/src/assets/* Frontend/public/images/
```

---

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | `postgresql://postgres:password@host:port/db?sslmode=require` |
| `CLERK_SECRET_KEY` | Clerk secret key (from Clerk dashboard) | `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123...` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP email address | `hospital@gmail.com` |
| `SMTP_PASSWORD` | SMTP password or app password | `xxxx xxxx xxxx xxxx` |
| `ADMIN_EMAIL` | Email address to receive appointment notifications | `admin@modernhospital.com` |
| `FRONTEND_URL` | Frontend URL (for CORS whitelist) | `http://localhost:3000` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

### Frontend (`Frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (for middleware) | `sk_live_...` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk sign-in route | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk sign-up route | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Redirect after sign-in | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Redirect after sign-up | `/dashboard` |

> **Important:** Never commit `.env` or `.env.local` files. They are listed in `.gitignore`.

---

## Development Workflow

### Start both servers

**Terminal 1 — Backend:**
```bash
cd Backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
# Runs on http://localhost:3000
```

### Database management

```bash
cd Backend

# Create a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Push schema to database without creating migration files (for prototyping)
npx prisma db push

# Open Prisma Studio (visual database browser)
npx prisma studio

# Regenerate Prisma client after schema changes
npx prisma generate
```

### Clerk setup

1. Create a Clerk application at [clerk.com](https://clerk.com/)
2. Enable **Email OTP** as the authentication method
3. For admin accounts: go to Clerk Dashboard → Users → select user → Edit Metadata → set `publicMetadata` to:
   ```json
   { "role": "admin" }
   ```
4. Patient accounts default to `{ "role": "patient" }` (no manual setup needed)

---

## Build & Deployment

Both services are deployed on [Render](https://render.com/) as separate Web Services.

### Backend (Render Web Service)

| Setting | Value |
|---|---|
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Environment | Set all variables from `Backend/.env.example` |

### Frontend (Render Web Service)

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment | Set all variables from `Frontend/.env.local.example` |

> **Important:** Update `FRONTEND_URL` in the backend env to point to the deployed frontend URL (e.g., `https://modern-hospital.onrender.com`), and update `NEXT_PUBLIC_API_URL` in the frontend env to point to the deployed backend URL (e.g., `https://modern-hospital-api.onrender.com`).

---

## Authentication & Roles

| Role | How it's assigned | Access |
|---|---|---|
| **Public** (unauthenticated) | No login | Portfolio homepage, appointment booking |
| **Patient** | Default role on Clerk sign-up | Patient dashboard — view own tests, link phone, search test ID |
| **Admin** | Manually set via Clerk dashboard (`publicMetadata.role = "admin"`) | Admin dashboard — doctor CRUD, test result CRUD, appointment management |

Clerk email OTP is the only authentication method. No phone-based authentication is used.

---

## Database Schema

Three tables managed by Prisma ORM:

### `doctors`
Stores doctor information displayed on the portfolio and used for appointment booking. Images are stored on Cloudinary.

### `appointments`
Stores appointment/serial bookings. Serial number auto-increments per doctor per day (resets daily). Statuses: `PENDING`, `CONFIRMED`, `CANCELLED`.

### `medical_tests`
Stores test records created by admin. Test ID is manually entered (matches paper invoice codes). At least one of `patient_phone` or `patient_email` must be provided. Statuses: `Processing`, `Ready for Delivery`, `Delivered`.

> There is no separate `patients` table. Clerk manages patient identity (name, email). Patient data in `appointments` and `medical_tests` is matched by email and/or phone number.

---

## API Endpoints

### Public (no authentication)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/doctors` | List available doctors |
| `POST` | `/api/public/serials` | Book appointment + email admin |

### Patient (Clerk auth required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patient/my-tests` | Tests matched by authenticated email |
| `GET` | `/api/patient/tests-by-phone?phone=...` | Tests matched by phone |
| `GET` | `/api/patient/search-test?testId=...` | Search specific test by ID |
| `GET` | `/api/patient/my-appointments?phone=...` | Patient's appointments |
| `POST` | `/api/patient/link-phone` | Save phone to Clerk profile |

### Admin (Clerk auth + admin role required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/doctors` | List all doctors |
| `POST` | `/api/admin/doctors` | Create doctor (multipart/form-data) |
| `PUT` | `/api/admin/doctors/:id` | Update doctor |
| `DELETE` | `/api/admin/doctors/:id` | Delete doctor |
| `GET` | `/api/admin/tests` | List all test records |
| `POST` | `/api/admin/tests` | Create test record |
| `PUT` | `/api/admin/tests/:id` | Update test record/status |
| `DELETE` | `/api/admin/tests/:id` | Delete test record |
| `GET` | `/api/admin/appointments` | List appointments |
| `PUT` | `/api/admin/appointments/:id` | Update appointment status |

---

## Known Limitations

1. **No WhatsApp notifications.** The client originally requested WhatsApp or email notifications for appointment bookings. Only email (Nodemailer) is implemented. WhatsApp requires Facebook Business Verification and carries operational costs. A Telegram bot could be added as a free alternative in the future.

2. **No patient table.** Patient identity is managed entirely by Clerk. If the hospital needs to store additional patient-specific data (blood group, date of birth, address, medical history), a separate `patients` table would need to be added.

3. **No SMS/OTP for phone verification.** When a patient links their phone number in the dashboard, the phone is not verified via OTP. The patient self-reports their phone number. This is acceptable for the current scope since the data exposed (test names + status) is low-sensitivity.

4. **No real-time updates.** Test status changes and new appointments are not pushed to clients in real-time. The patient dashboard fetches data on page load. WebSocket or polling could be added later if live updates are needed.

5. **Serial number is informational only.** The daily serial number gives the patient a position reference but does not enforce strict time slots or capacity limits per doctor.

6. **Single admin email.** Appointment notifications are sent to a single `ADMIN_EMAIL` address. If multiple staff members need notifications, email forwarding or a distribution list must be configured at the email provider level.

7. **No file upload for test reports.** The admin can update test status but cannot upload actual test report files (PDFs, images). Only status tracking is supported. File attachments could be added via Cloudinary in the future.

8. **Render cold starts.** On Render's free tier, services spin down after inactivity. The first request after idle may take 30–50 seconds. This can be mitigated by upgrading to a paid tier or using an external uptime monitor to ping the service periodically.

9. **No rate limiting.** The public serial booking endpoint does not have rate limiting. This could be abused to flood the admin with email notifications. Rate limiting middleware (e.g., `express-rate-limit`) should be added for production.

10. **Image size limits.** Doctor image uploads are limited to 5MB via Multer configuration. Cloudinary's free tier has a total storage limit of 25GB.

---

## License

*License not yet specified.*

---

## Author

Developed for Modern Hospital Pvt. Limited, Maijdee, Noakhali, Bangladesh.
