// 1. Node built-ins

// 2. Third-party packages
import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

// 3. Internal absolute/relative imports
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import adminAppointmentsRouter from './routes/admin/appointments.js';
import adminDoctorsRouter from './routes/admin/doctors.js';
import adminTestsRouter from './routes/admin/tests.js';
import patientDashboardRouter from './routes/patient/dashboard.js';
import publicDoctorsRouter from './routes/public/doctors.js';
import publicSerialsRouter from './routes/public/serials.js';

const app = express();

// 1. Optimize Helmet to allow Cross-Origin resource requests from your frontend
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

// 2. Make CORS robust by allowing both your live production site and local testing domains
app.use(
  cors({
    origin: [
      env.FRONTEND_URL, 
      'https://modern-hospital.pages.dev', 
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json());
app.use(clerkMiddleware());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route mounts
// Ensure these mounts match exactly in your src/index.ts file
app.use(['/api/public/doctors', '/api/public/doctors/'], publicDoctorsRouter);
app.use(['/api/public/serials', '/api/public/serials/'], publicSerialsRouter);
app.use(['/api/patient', '/api/patient/'], patientDashboardRouter);
app.use(['/api/admin/doctors', '/api/admin/doctors/'], adminDoctorsRouter);
app.use(['/api/admin/tests', '/api/admin/tests/'], adminTestsRouter);
app.use(['/api/admin/appointments', '/api/admin/appointments/'], adminAppointmentsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
});
