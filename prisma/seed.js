/**
 * Prisma Seeder – Environment-aware bootstrap.
 * Seeds Super Admin, optional dev data (subjects, classes), and supports safe cleanup.
 *
 * Usage:
 *   npx prisma db seed
 *   SEED_CLEANUP=true npx prisma db seed   # Clear dev tables before seeding (local only)
 *
 * Environment:
 *   SUPER_ADMIN_USER, SUPER_ADMIN_PASS – Super Admin credentials (from .env)
 *   NODE_ENV=development – Enables seedDevData (subjects, classes)
 *   SEED_CLEANUP=true – Optional cleanup before seeding (local testing)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/core/utils/hashPassword.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Environment – Super Admin credentials (never hardcode in code)
// ---------------------------------------------------------------------------

const SUPER_ADMIN_USER = process.env.SUPER_ADMIN_USER || 'superadmin';
const SUPER_ADMIN_PASS = process.env.SUPER_ADMIN_PASS || 'SuperAdmin@123'; // fallback for local dev only
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@school.local';
const RUN_CLEANUP = process.env.SEED_CLEANUP === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

// ---------------------------------------------------------------------------
// Cleanup – Safe deletion for local testing (FK-safe order)
// ---------------------------------------------------------------------------

/**
 * Optionally clears specific tables before seeding.
 * Only runs when SEED_CLEANUP=true. Use strictly for local testing.
 * Order respects foreign key constraints (children before parents).
 */
async function cleanup() {
  if (!RUN_CLEANUP) return;

  console.log('[seed] Cleanup enabled (SEED_CLEANUP=true)...');

  try {
    // Delete in FK-safe order: refresh_tokens → exams → subject_classes → role_permissions → permissions/roles → subjects / classes
    await prisma.refresh_tokens.deleteMany({});
    await prisma.exams.deleteMany({});
    await prisma.subject_classes.deleteMany({});
    await prisma.role_permissions.deleteMany({});
    await prisma.permissions.deleteMany({});
    await prisma.roles.deleteMany({});
    await prisma.subjects.deleteMany({});
    await prisma.classes.deleteMany({});

    console.log('[seed] Cleanup complete.');
  } catch (err) {
    console.error('[seed] Cleanup failed:', err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Super Admin – Idempotent upsert
// ---------------------------------------------------------------------------

async function seedSuperAdmin() {
  const password_hash = await hashPassword(SUPER_ADMIN_PASS);

  const user = await prisma.users.upsert({
    where: { username: SUPER_ADMIN_USER },
    create: {
      username: SUPER_ADMIN_USER,
      email: SUPER_ADMIN_EMAIL,
      password_hash,
      role: 'SUPER_ADMIN',
    },
    update: {
      email: SUPER_ADMIN_EMAIL,
      password_hash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('[seed] Super Admin:', user.username);
  return user;
}

// ---------------------------------------------------------------------------
// PBAC – Permissions and Role-Permission mappings
// ---------------------------------------------------------------------------

async function seedPermissionsAndRoles() {
  const roles = [
    { id: 1, name: 'SUPER_ADMIN' },
    { id: 2, name: 'ADMIN' },
    { id: 3, name: 'REGISTRAR' },
    { id: 4, name: 'TEACHER' },
    { id: 5, name: 'STUDENT' },
  ];

  const permissions = [
    { id: 1, name: 'CREATE_STUDENT' },
    { id: 2, name: 'VIEW_STUDENT' },
    { id: 3, name: 'CREATE_TEACHER' },
    { id: 4, name: 'MANAGE_FEES' },
    { id: 5, name: 'VIEW_REPORT' },
  ];

  for (const r of roles) {
    await prisma.roles.upsert({
      where: { id: r.id },
      create: r,
      update: { name: r.name },
    });
  }

  for (const p of permissions) {
    await prisma.permissions.upsert({
      where: { id: p.id },
      create: p,
      update: { name: p.name },
    });
  }

  const rolePerms = [
    { role_id: 3, permission_id: 1 }, // REGISTRAR -> CREATE_STUDENT
    { role_id: 3, permission_id: 2 }, // REGISTRAR -> VIEW_STUDENT
    { role_id: 2, permission_id: 3 }, // ADMIN -> CREATE_TEACHER
    { role_id: 2, permission_id: 4 }, // ADMIN -> MANAGE_FEES
    { role_id: 2, permission_id: 5 }, // ADMIN -> VIEW_REPORT
    // SUPER_ADMIN (1) -> All permissions
    { role_id: 1, permission_id: 1 },
    { role_id: 1, permission_id: 2 },
    { role_id: 1, permission_id: 3 },
    { role_id: 1, permission_id: 4 },
    { role_id: 1, permission_id: 5 },
  ];

  for (const rp of rolePerms) {
    await prisma.role_permissions.upsert({
      where: { role_id_permission_id: { role_id: rp.role_id, permission_id: rp.permission_id } },
      create: rp,
      update: {},
    });
  }

  console.log('[seed] Permissions and role_permissions seeded.');
}

// ---------------------------------------------------------------------------
// Dev Data – Subjects and Classes (only in development)
// ---------------------------------------------------------------------------

async function seedDevData() {
  if (!IS_DEV) {
    console.log('[seed] Skipping dev data (NODE_ENV !== development).');
    return;
  }

  console.log('[seed] Seeding dev data...');

  const subjects = [
    { name: 'Mathematics', code: 'SUB-MATH', description: 'Core math curriculum' },
    { name: 'English', code: 'SUB-ENG', description: 'English language and literature' },
    { name: 'Science', code: 'SUB-SCI', description: 'General science' },
  ];

  for (const s of subjects) {
    await prisma.subjects.upsert({
      where: { code: s.code },
      create: { ...s, status: 'active' },
      update: { name: s.name, description: s.description },
    });
  }
  console.log('[seed] Subjects: Math, English, Science.');

  const classes = [
    { grade_level: '1', section: 'A', class_name: 'Grade 1-A' },
    { grade_level: '2', section: 'B', class_name: 'Grade 2-B' },
  ];

  for (const c of classes) {
    const existing = await prisma.classes.findFirst({
      where: { grade_level: c.grade_level, section: c.section },
    });
    if (!existing) {
      await prisma.classes.create({
        data: { ...c, status: 'active' },
      });
    }
  }
  console.log('[seed] Classes: Grade 1-A, Grade 2-B.');

  // Link subjects to classes via subject_classes (dev: all subjects in all classes)
  const allSubjects = await prisma.subjects.findMany({ where: { code: { in: ['SUB-MATH', 'SUB-ENG', 'SUB-SCI'] } } });
  const allClasses = await prisma.classes.findMany();

  for (const subj of allSubjects) {
    for (const cls of allClasses) {
      const exists = await prisma.subject_classes.findFirst({
        where: { subject_id: subj.id, class_id: cls.id },
      });
      if (!exists) {
        await prisma.subject_classes.create({
          data: { subject_id: subj.id, class_id: cls.id },
        });
      }
    }
  }
  console.log('[seed] subject_classes: linked subjects to classes.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('[seed] Starting...');

  await cleanup();
  await seedSuperAdmin();
  await seedPermissionsAndRoles();
  await seedDevData();

  console.log('[seed] Done.');
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
