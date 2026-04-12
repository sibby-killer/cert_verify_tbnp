import { db } from './index.js';
import { adminUsers, students, courses, institutions } from './schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function seedTest() {
  try {
    console.log('Promoting default admin to superadmin...');
    await db.update(adminUsers).set({ role: 'superadmin' }).where(eq(adminUsers.username, 'admin'));

    console.log('Seeding Institution...');
    const existingInst = await db.select().from(institutions);
    let instId;
    if (existingInst.length === 0) {
      const [newInst] = await db.insert(institutions).values({
        id: crypto.randomUUID(),
        name: 'Bungoma National Polytechnic'
      }).returning();
      instId = newInst.id;
    } else {
      instId = existingInst[0].id;
    }

    console.log('Seeding Alfred Nyongesa...');
    const existingAlfred = await db.select().from(students).where(eq(students.regNumber, 'BNP/2026/001'));
    if (existingAlfred.length === 0) {
      await db.insert(students).values({
        id: crypto.randomUUID(),
        name: 'Alfred Nyongesa',
        regNumber: 'BNP/2026/001',
        email: 'alfred@example.com'
      });
    }

    console.log('Seeding IT Course...');
    const existingCourse = await db.select().from(courses).where(eq(courses.deptCode, 'IT'));
    if (existingCourse.length === 0) {
      await db.insert(courses).values({
        id: crypto.randomUUID(),
        name: 'Diploma in Information Technology',
        deptCode: 'IT'
      });
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedTest();
