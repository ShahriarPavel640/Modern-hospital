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

// Middleware chain
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(clerkMiddleware());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route mounts
app.use('/api/public/doctors', publicDoctorsRouter);
app.use('/api/public/serials', publicSerialsRouter);
app.use('/api/patient', patientDashboardRouter);
app.use('/api/admin/doctors', adminDoctorsRouter);
app.use('/api/admin/tests', adminTestsRouter);
app.use('/api/admin/appointments', adminAppointmentsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
});
