import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data in correct dependency order
  await prisma.appointment.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.medicalTest.deleteMany({});

  console.log('🧹 Cleaned existing tables.');

  // Seed Doctors
  const doc1 = await prisma.doctor.create({
    data: {
      name: 'Dr. Md. Rafiqul Islam',
      nameBn: 'ডাঃ মোঃ রফিকুল ইসলাম',
      specialty: 'Medicine Specialist',
      degrees: ['MBBS', 'FCPS (Medicine)'],
      visitingHours: 'Sat–Thu: 5:00 PM – 9:00 PM',
      imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop',
      cloudinaryPublicId: 'seed_doc1',
      isAvailable: true,
    },
  });

  const doc2 = await prisma.doctor.create({
    data: {
      name: 'Dr. Nasrin Akter',
      nameBn: 'ডাঃ নাসরিন আক্তার',
      specialty: 'Gynecology',
      degrees: ['MBBS', 'FCPS (Gynae & Obs)'],
      visitingHours: 'Sat–Wed: 4:00 PM – 8:00 PM',
      imageUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=400&auto=format&fit=crop',
      cloudinaryPublicId: 'seed_doc2',
      isAvailable: true,
    },
  });

  const doc3 = await prisma.doctor.create({
    data: {
      name: 'Dr. Abdul Karim',
      nameBn: 'ডাঃ আব্দুল করিম',
      specialty: 'Cardiology',
      degrees: ['MBBS', 'MD (Cardiology)'],
      visitingHours: 'Sun, Tue, Thu: 6:00 PM – 9:00 PM',
      imageUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop',
      cloudinaryPublicId: 'seed_doc3',
      isAvailable: true,
    },
  });

  const doc4 = await prisma.doctor.create({
    data: {
      name: 'Dr. Farzana Hossain',
      nameBn: 'ডাঃ ফারজানা হোসেন',
      specialty: 'Child Specialist',
      degrees: ['MBBS', 'DCH (Pediatrics)'],
      visitingHours: 'Daily: 5:00 PM – 8:00 PM',
      imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop',
      cloudinaryPublicId: 'seed_doc4',
      isAvailable: true,
    },
  });

  console.log('👨‍⚕️ Seeded 4 doctors.');

  // Seed Medical Tests
  await prisma.medicalTest.createMany({
    data: [
      {
        id: 'LAB-100201',
        patientName: 'Rahim Uddin',
        patientPhone: '01712345678',
        patientEmail: 'rahim@gmail.com',
        testNames: ['CBC', 'Lipid Profile', 'RBS'],
        status: 'Delivered',
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        updatedAt: new Date('2026-06-02T15:00:00.000Z'),
      },
      {
        id: 'LAB-100202',
        patientName: 'Karim Mia',
        patientPhone: '01812345678',
        patientEmail: 'karim@gmail.com',
        testNames: ['Ultrasonography', 'Urine RE'],
        status: 'Ready for Delivery',
        createdAt: new Date('2026-06-05T09:00:00.000Z'),
        updatedAt: new Date('2026-06-06T11:00:00.000Z'),
      },
      {
        id: 'LAB-100203',
        patientName: 'Sultana Begum',
        patientPhone: '01912345678',
        patientEmail: 'sultana@gmail.com',
        testNames: ['ECG', 'Chest X-Ray'],
        status: 'Processing',
        createdAt: new Date('2026-06-09T08:00:00.000Z'),
        updatedAt: new Date('2026-06-09T08:00:00.000Z'),
      },
    ],
  });

  console.log('🧪 Seeded 3 medical tests.');

  // Seed Appointments
  await prisma.appointment.createMany({
    data: [
      {
        patientName: 'Abul Kashem',
        patientPhone: '01799998888',
        doctorId: doc1.id,
        appointmentDate: new Date('2026-06-10T00:00:00.000Z'),
        serialNumber: 1,
        status: 'CONFIRMED',
      },
      {
        patientName: 'Babul Hossain',
        patientPhone: '01799997777',
        doctorId: doc1.id,
        appointmentDate: new Date('2026-06-10T00:00:00.000Z'),
        serialNumber: 2,
        status: 'PENDING',
      },
      {
        patientName: 'Fatema Begum',
        patientPhone: '01899998888',
        doctorId: doc2.id,
        appointmentDate: new Date('2026-06-10T00:00:00.000Z'),
        serialNumber: 1,
        status: 'CONFIRMED',
      },
      {
        patientName: 'Chinu Miah',
        patientPhone: '01799996666',
        doctorId: doc1.id,
        appointmentDate: new Date('2026-06-11T00:00:00.000Z'),
        serialNumber: 1,
        status: 'PENDING',
      },
      {
        patientName: 'Delwar Hossain',
        patientPhone: '01999998888',
        doctorId: doc3.id,
        appointmentDate: new Date('2026-06-11T00:00:00.000Z'),
        serialNumber: 1,
        status: 'CANCELLED',
      },
    ],
  });

  console.log('📅 Seeded 5 appointments.');
  console.log('✅ Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
