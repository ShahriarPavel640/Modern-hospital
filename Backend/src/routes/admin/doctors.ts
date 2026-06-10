// 1. Node built-ins

// 2. Third-party packages
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

// 3. Internal absolute/relative imports
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { uploadImage, deleteImage } from '../../services/cloudinary.js';

const router = Router();

// Apply auth middleware to all admin doctor routes
router.use(requireAuth);
router.use(requireRole('admin'));

// Configure multer (5MB size limit, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any);
    }
  },
});

// Zod validation schemas
const createDoctorSchema = z.object({
  name: z.string().min(1, 'Doctor name is required'),
  nameBn: z.string().optional().nullable().transform((val) => val || null),
  specialty: z.string().min(1, 'Specialty is required'),
  degrees: z.union([z.string(), z.array(z.string())]).transform((val) => {
    if (typeof val === 'string') {
      return val.split(',').map((d) => d.trim()).filter(Boolean);
    }
    return val;
  }),
  visitingHours: z.string().min(1, 'Visiting hours are required'),
  isAvailable: z.union([z.string(), z.boolean()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val ?? true;
  }),
});

const updateDoctorSchema = z.object({
  name: z.string().min(1, 'Doctor name is required').optional(),
  nameBn: z.string().optional().nullable().transform((val) => {
    if (val === undefined) return undefined;
    return val || null;
  }),
  specialty: z.string().min(1, 'Specialty is required').optional(),
  degrees: z.union([z.string(), z.array(z.string())]).transform((val) => {
    if (typeof val === 'string') {
      return val.split(',').map((d) => d.trim()).filter(Boolean);
    }
    return val;
  }).optional(),
  visitingHours: z.string().min(1, 'Visiting hours are required').optional(),
  isAvailable: z.union([z.string(), z.boolean()]).optional().transform((val) => {
    if (val === undefined) return undefined;
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return val;
  }),
});

// GET /api/admin/doctors - List all doctors
router.get('/', async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
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

// POST /api/admin/doctors - Create a doctor (multipart/form-data)
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Doctor profile image file is required',
      });
    }

    const parseResult = createDoctorSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Invalid form data',
      });
    }

    const { name, nameBn, specialty, degrees, visitingHours, isAvailable } = parseResult.data;

    // Upload image to Cloudinary
    const cloudinaryResult = await uploadImage(req.file.buffer, 'doctors');

    // Save doctor record to DB
    const doctor = await prisma.doctor.create({
      data: {
        name,
        nameBn: nameBn || null,
        specialty,
        degrees,
        visitingHours,
        imageUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        isAvailable,
      },
    });

    res.status(201).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/doctors/:id - Update a doctor (multipart/form-data)
router.put('/:id', upload.single('image'), async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    const parseResult = updateDoctorSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0]?.message || 'Invalid form data',
      });
    }

    const updateData: any = { ...parseResult.data };

    // If new image is uploaded
    if (req.file) {
      const cloudinaryResult = await uploadImage(req.file.buffer, 'doctors');
      updateData.imageUrl = cloudinaryResult.secure_url;
      updateData.cloudinaryPublicId = cloudinaryResult.public_id;

      // Clean up the old image from Cloudinary (asynchronously)
      if (existingDoctor.cloudinaryPublicId) {
        deleteImage(existingDoctor.cloudinaryPublicId).catch((err) =>
          console.error('Error deleting old image from Cloudinary:', err)
        );
      }
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updatedDoctor,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/doctors/:id - Delete a doctor
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found',
      });
    }

    // Check if appointments exist (Restrict deletion due to FK constraint)
    const appointmentsCount = await prisma.appointment.count({
      where: { doctorId: id },
    });

    if (appointmentsCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete doctor: Active appointments are scheduled with this doctor.',
      });
    }

    // Delete doctor record from DB
    await prisma.doctor.delete({
      where: { id },
    });

    // Delete image from Cloudinary
    if (existingDoctor.cloudinaryPublicId) {
      deleteImage(existingDoctor.cloudinaryPublicId).catch((err) =>
        console.error('Error deleting doctor image from Cloudinary:', err)
      );
    }

    res.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
