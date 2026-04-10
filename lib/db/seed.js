import { db } from './index.js';
import { institutions, adminUsers, courses, students } from './schema.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create Institution
    const [inst] = await db.insert(institutions).values({
      id: crypto.randomUUID(),
      name: 'Bungoma National Polytechnic',
      address: 'P.O. Box 158-50200, Bungoma, Kenya',
      phone: '+254 700 000 000',
      email: 'info@bungomapoly.ac.ke'
    }).returning();
    console.log('✅ Institution created');

    // 2. Create Default Admin
    const hashedPassword = await bcrypt.hash('BNP@Admin2024', 10);
    await db.insert(adminUsers).values({
      id: crypto.randomUUID(),
      username: 'admin',
      password: hashedPassword,
      email: 'admin@bungomapoly.ac.ke',
      role: 'it_admin'
    });
    console.log('✅ Default admin created');

    // 3. Create Courses
    const courseData = [
      { name: 'Diploma in Computer Science', deptCode: 'COMP' },
      { name: 'Diploma in Electrical Engineering', deptCode: 'ELEC' },
      { name: 'Diploma in Business Management', deptCode: 'BUS' },
      { name: 'Certificate in Plumbing', deptCode: 'BLDG' },
      { name: 'Diploma in Hospitality Management', deptCode: 'HOSP' }
    ];

    for (const c of courseData) {
      await db.insert(courses).values({
        id: crypto.randomUUID(),
        name: c.name,
        deptCode: c.deptCode
      });
    }
    console.log('✅ 5 courses created');

    // 4. Create a test student
    await db.insert(students).values({
      id: crypto.randomUUID(),
      name: 'John Doe',
      regNumber: 'BNP/2024/001',
      email: 'student.test@example.com'
    });
    console.log('✅ Test student created');

    console.log('🚀 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();