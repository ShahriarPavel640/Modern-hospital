// 1. Node built-ins

// 2. Third-party packages
import { Router } from 'express';

// 3. Internal absolute/relative imports
import { prisma } from '../../lib/prisma.js';

const router = Router();

// GET /api/public/doctors - List all available doctors
router.get('/', async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        nameBn: true,
        specialty: true,
        degrees: true,
        visitingHours: true,
        imageUrl: true,
        isAvailable: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
