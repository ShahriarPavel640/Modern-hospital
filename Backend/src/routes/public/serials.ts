// 1. Node built-ins

// 2. Third-party packages
import { Router } from 'express';
import { z } from 'zod';

// 3. Internal absolute/relative imports
import { prisma } from '../../lib/prisma.js';
import { sendAppointmentNotification } from '../../services/mailer.js';

const router = Router();

const bookingSchema = z.object({
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().min(1, 'Patient phone number is required'),
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// POST /api/public/serials - Book an appointment
router.post('/', async (req, res, next) => {
  const parseResult = bookingSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors[0]?.message || 'Invalid request body',
    });
  }

  const { patientName, patientPhone, doctorId, appointmentDate } = parseResult.data;
  const parsedDate = new Date(`${appointmentDate}T00:00:00.000Z`);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the doctor row to ensure safe serialization of concurrent appointments
      const doctors = await tx.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM doctors WHERE id = ${doctorId}::uuid FOR UPDATE
      `;

      if (doctors.length === 0) {
        throw new Error('DOCTOR_NOT_FOUND');
      }

      const doctor = doctors[0];

      // 2. Create the appointment record without serial number
      const appointment = await tx.appointment.create({
        data: {
          patientName,
          patientPhone,
          doctorId,
          appointmentDate: parsedDate,
          status: 'PENDING',
        },
      });

      return {
        appointmentId: appointment.id,
        doctorName: doctor.name,
      };
    });

    // Fire email notification asynchronously (fire-and-forget, no await)
    sendAppointmentNotification({
      patientName,
      patientPhone,
      doctorName: result.doctorName,
      appointmentDate,
    });

    res.status(201).json({
      success: true,
      data: {
        appointmentId: result.appointmentId,
        serialNumber: null,
      },
    });
  } catch (error: any) {
    if (error.message === 'DOCTOR_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }
    next(error);
  }
});

export default router;
