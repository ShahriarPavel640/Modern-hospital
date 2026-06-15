// 1. Node built-ins

// 2. Third-party packages
import { Router } from 'express';
import { z } from 'zod';

// 3. Internal absolute/relative imports
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin'));

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
});

// GET /api/admin/appointments - List appointments with filters
router.get('/', async (req, res, next) => {
  const { date, doctorId, status } = req.query;

  try {
    const whereClause: any = {};

    if (date) {
      whereClause.appointmentDate = new Date(`${date}T00:00:00.000Z`);
    }

    if (doctorId) {
      whereClause.doctorId = doctorId as string;
    }

    if (status) {
      whereClause.status = status as string;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        serialNumber: 'asc',
      },
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/appointments/:id - Update status of an appointment
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;

  const parseResult = updateStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors[0]?.message || 'Invalid status value',
    });
  }

  const { status } = parseResult.data;

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/appointments/:id - Delete an appointment record
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
