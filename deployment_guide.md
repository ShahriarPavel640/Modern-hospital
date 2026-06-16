# Production Deployment Guide — Modern Hospital

This guide provides step-by-step instructions for deploying the **Modern Hospital** application to production.

## System Architecture Overview

- **Frontend**: Single Page Application (Vite + TanStack Router) deployed on **Cloudflare Pages**.
- **Backend**: REST API (Node.js + Express + Prisma) deployed on **Render** (Web Service).
- **Database**: Production PostgreSQL database (e.g. Render PostgreSQL, Supabase, or Neon).
- **Authentication**: **Clerk** (Production instance).
- **Image Storage**: **Cloudinary** (Production account).

---

## 1. Database Setup

The backend uses Prisma with PostgreSQL. You will need a hosted PostgreSQL database.

1. **Create a Database**: You can provision a database on **Render** (PostgreSQL), **Supabase**, or **Neon**.
2. **Retrieve URLs**: Get your connection strings:
   - **`DATABASE_URL`**: Connection string with pooling enabled (if supported, e.g. transaction pooling mode `port 6543` on Supabase).
   - **`DIRECT_URL`**: Direct connection string to bypass pooling (used for executing migrations). If your database host doesn't use a connection pooler, set both variables to the exact same connection string.

---

## 2. Backend Deployment on Render

Render will host the Node.js Express server as a **Web Service**.

### Step 1: Create a Web Service
1. Sign in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.

### Step 2: Configure Service Settings
- **Name**: `modern-hospital-backend`
- **Language**: `Node`
- **Root Directory**: `Backend` *(Crucial: This tells Render to run commands inside the `/Backend` directory)*
- **Region**: Choose the region closest to your users.
- **Branch**: `main` or your deployment branch.

### Step 3: Configure Build and Start Commands
- **Build Command**:
  ```bash
  npm install && npm run db:generate && npm run build && npx prisma migrate deploy
  ```
  *(This installs dependencies, generates the Prisma Client, compiles TypeScript, and runs database migrations on every deploy).*
- **Start Command**:
  ```bash
  npm start
  ```

### Step 4: Configure Environment Variables
In the **Environment** tab of your Render service, add the following variables:

| Variable Name | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled) | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL direct connection string | `postgresql://user:pass@host:5432/db` |
| `CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Clerk Secret Key | `sk_live_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |
| `SMTP_HOST` | SMTP server host address | `smtp.gmail.com` or `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | SMTP username / email address | `hospital-alerts@yourdomain.com` |
| `SMTP_PASSWORD` | SMTP password / app passcode | `your_smtp_app_password` |
| `ADMIN_EMAIL` | Default email for hospital admin notifications | `admin@modernhospital.com` |
| `PORT` | Render sets this automatically, but you can default to | `10000` |
| `NODE_ENV` | Environment indicator | `production` |
| `FRONTEND_URL` | The URL of your Cloudflare Pages site | `https://modern-hospital.pages.dev` (No trailing slash) |

---

## 3. Frontend Deployment on Cloudflare Pages

Cloudflare Pages will host the static SPA files compiled by Vite.

### Step 1: Create a Pages Project
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository.

### Step 2: Configure Build Settings
- **Project Name**: `modern-hospital` (This will define your `<project>.pages.dev` URL).
- **Framework Preset**: `Vite` or `None`.
- **Root Directory**: `Frontend-react` *(Crucial: This tells Cloudflare to build inside the `/Frontend-react` folder)*.
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Node.js Version**: In the Pages configuration -> Settings -> Builds & deployments, ensure the Node.js version is set to `18` or higher (you can add a `NODE_VERSION` environment variable with value `20`).

### Step 3: Configure Environment Variables
Under the **Settings** -> **Environment Variables** tab in your Pages dashboard, add:

| Variable Name | Description | Example Value |
|---|---|---|
| `VITE_API_URL` | The URL of your live Render backend service | `https://modern-hospital-backend.onrender.com` (No trailing slash) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk production publishable key | `pk_live_...` |

### Step 4: SPA Routing Redirects (Already Configured)
To prevent `404 Not Found` errors when refreshing or accessing client-side routes (like `/dashboard` or `/admin`) directly, we have created a `_redirects` file under `Frontend-react/public/_redirects` with the following content:
```text
/* /index.html 200
```
Vite automatically copies this file to the root of the output `dist` folder on build, instructing Cloudflare to route all traffic to the React SPA index page.

---

## 4. Clerk Authentication Production Setup

To ensure login and dashboard portals function correctly in production:

1. **Switch to Production Instance**: In the Clerk dashboard, configure your production instance using your production domain.
2. **Configure Redirect URLs**:
   - In your Clerk dashboard under **Paths**, set the **After Sign-In URL** to `/dashboard` and **After Sign-Up URL** to `/dashboard`.
3. **Whitelist Allowed Origins**:
   - In the Clerk dashboard -> **Settings** -> **Allowed Origins**, add:
     - `https://your-project.pages.dev`
     - `https://yourdomain.com` (if using a custom domain)

---

## 5. Deployment Verification Checklist

After deploying, verify the system is fully operational:

1. **Health Check**: Visit `https://your-backend.onrender.com/api/health` and verify it returns `{"status":"ok"}`.
2. **CORS Validation**: Try signing in on the frontend. Check the browser network console to ensure requests to the backend API do not trigger CORS blockages.
3. **Database Connectivity**: Verify that the homepage successfully fetches the list of available doctors from the database.
4. **Image Uploads**: Go to the Admin Panel (`/admin/doctors`) and add a new doctor with a profile image. Ensure the image is uploaded to Cloudinary and is rendered correctly.
5. **SMTP Mail Notifications**: Book an appointment. Verify that the booking is successfully registered and that notification emails are received.
