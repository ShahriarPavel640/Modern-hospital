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

const createTestSchema = z.object({
  id: z.string().min(1, 'Test ID (Invoice ID) is required'),
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().optional().nullable().transform((val) => val || null),
  patientEmail: z.string().email('Invalid email format').optional().nullable().transform((val) => val || null),
  testNames: z.array(z.string().min(1)).min(1, 'At least one test name is required'),
  status: z.enum(['Processing', 'Ready for Delivery', 'Delivered']).default('Processing'),
}).refine((data) => {
  return data.patientPhone || data.patientEmail;
}, {
  message: 'At least one of patient phone or patient email is required',
  path: ['patientPhone'],
});

const updateTestSchema = z.object({
  patientName: z.string().min(1).optional(),
  patientPhone: z.string().optional().nullable().transform((val) => {
    if (val === undefined) return undefined;
    return val || null;
  }),
  patientEmail: z.string().email().optional().nullable().transform((val) => {
    if (val === undefined) return undefined;
    return val || null;
  }),
  testNames: z.array(z.string().min(1)).optional(),
  status: z.enum(['Processing', 'Ready for Delivery', 'Delivered']).optional(),
}).refine((data) => {
  if (data.patientPhone === null && data.patientEmail === null) {
    return false;
  }
  return true;
}, {
  message: 'Cannot remove both phone and email. At least one is required.',
  path: ['patientPhone'],
});

// GET /api/admin/tests - List all test records (with search/filter)
router.get('/', async (req, res, next) => {
  const { status, search } = req.query;

  try {
    const whereClause: any = {};

    if (status) {
      whereClause.status = status as string;
    }

    if (search) {
      const searchStr = search as string;
      whereClause.OR = [
        { id: { contains: searchStr, mode: 'insensitive' } },
        { patientName: { contains: searchStr, mode: 'insensitive' } },
        { patientPhone: { contains: searchStr, mode: 'insensitive' } },
        { patientEmail: { contains: searchStr, mode: 'insensitive' } },
      ];
    }

    const tests = await prisma.medicalTest.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/tests - Create a test record
router.post('/', async (req, res, next) => {
  const parseResult = createTestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors[0]?.message || 'Invalid request body',
    });
  }

  const { id, patientName, patientPhone, patientEmail, testNames, status } = parseResult.data;

  try {
    // Check if test ID is already in use
    const existingTest = await prisma.medicalTest.findUnique({
      where: { id },
    });

    if (existingTest) {
      return res.status(400).json({
        success: false,
        error: `A test record with ID "${id}" already exists.`,
      });
    }

    const test = await prisma.medicalTest.create({
      data: {
        id,
        patientName,
        patientPhone,
        patientEmail,
        testNames,
        status,
      },
    });

    res.status(201).json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/tests/:id - Update a test record
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;

  const parseResult = updateTestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors[0]?.message || 'Invalid request body',
    });
  }

  try {
    const existingTest = await prisma.medicalTest.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        error: 'Test record not found',
      });
    }

    // Ensure we don't end up with both email and phone as null
    const finalPhone = parseResult.data.patientPhone !== undefined ? parseResult.data.patientPhone : existingTest.patientPhone;
    const finalEmail = parseResult.data.patientEmail !== undefined ? parseResult.data.patientEmail : existingTest.patientEmail;

    if (!finalPhone && !finalEmail) {
      return res.status(400).json({
        success: false,
        error: 'At least one of patient phone or patient email must be provided.',
      });
    }

    const updatedTest = await prisma.medicalTest.update({
      where: { id },
      data: parseResult.data,
    });

    res.json({
      success: true,
      data: updatedTest,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/tests/:id - Delete a test record
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingTest = await prisma.medicalTest.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        error: 'Test record not found',
      });
    }

    await prisma.medicalTest.delete({
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
