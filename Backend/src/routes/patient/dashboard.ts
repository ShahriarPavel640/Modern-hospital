// 1. Node built-ins

// 2. Third-party packages
import { clerkClient } from '@clerk/express';
import { getAuth } from '../../lib/auth.js';
import { Router } from 'express';
import { z } from 'zod';

// 3. Internal absolute/relative imports
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Apply auth middleware to all patient routes
router.use(requireAuth);

// GET /api/patient/my-tests - Fetch tests matched by authenticated Clerk email
router.get('/my-tests', async (req, res, next) => {
  const auth = getAuth(req);
  let email = auth.sessionClaims?.email as string | undefined;

  if (!email && auth.userId && auth.userId !== 'mock_user_123') {
    try {
      const user = await clerkClient.users.getUser(auth.userId);
      email = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress;
    } catch (err) {
      console.error('Error fetching user from Clerk:', err);
    }
  }

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email claim not found in authentication token, and could not be retrieved from Clerk profile.',
    });
  }

  try {
    const tests = await prisma.medicalTest.findMany({
      where: {
        patientEmail: email,
      },
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

// GET /api/patient/tests-by-phone - Fetch tests matched by phone number
router.get('/tests-by-phone', async (req, res, next) => {
  const { phone } = req.query;

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Phone number parameter is required',
    });
  }

  try {
    const tests = await prisma.medicalTest.findMany({
      where: {
        patientPhone: phone,
      },
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

// GET /api/patient/search-test - Search specific test by ID
router.get('/search-test', async (req, res, next) => {
  const { testId } = req.query;

  if (!testId || typeof testId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Test ID parameter is required',
    });
  }

  try {
    const test = await prisma.medicalTest.findUnique({
      where: {
        id: testId,
      },
      select: {
        id: true,
        patientName: true,
        testNames: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test record not found',
      });
    }

    res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/patient/my-appointments - Fetch appointments matched by patient phone
router.get('/my-appointments', async (req, res, next) => {
  const { phone } = req.query;

  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Phone number parameter is required',
    });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientPhone: phone,
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'desc',
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

// POST /api/patient/link-phone - Link phone number to Clerk metadata
const linkPhoneSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
});

router.post('/link-phone', async (req, res, next) => {
  const parseResult = linkPhoneSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: parseResult.error.errors[0]?.message || 'Invalid request body',
    });
  }

  const { phone } = parseResult.data;
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No user session found',
    });
  }

  try {
    // Save phone number in Clerk profile publicMetadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        phone,
      },
    });

    res.json({
      success: true,
      data: { phone },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/patient/unlink-phone - Unlink phone number from Clerk metadata
router.post('/unlink-phone', async (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No user session found',
    });
  }

  try {
    // Set phone number to null in Clerk publicMetadata to unlink it
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        phone: null,
      },
    });

    res.json({
      success: true,
      message: 'Phone number unlinked successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
