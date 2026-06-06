/**
 * Seed script — creates test users and vendor profiles for development.
 *
 * Usage: node prisma/seed.js
 */

require('dotenv').config();

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Seeding VendorBridge database...\n');

  // --- Hash passwords ---
  const adminHash = await bcrypt.hash('admin123', 10);
  const officerHash = await bcrypt.hash('officer123', 10);
  const approverHash = await bcrypt.hash('approver123', 10);
  const vendorHash = await bcrypt.hash('vendor123', 10);

  // --- Upsert users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: {
      email: 'admin@vendorbridge.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
    },
  });
  console.log('✅ Admin:', admin.email);

  const officer = await prisma.user.upsert({
    where: { email: 'officer@vendorbridge.com' },
    update: {},
    create: {
      email: 'officer@vendorbridge.com',
      passwordHash: officerHash,
      role: 'OFFICER',
      firstName: 'Procurement',
      lastName: 'Officer',
    },
  });
  console.log('✅ Officer:', officer.email);

  const approver = await prisma.user.upsert({
    where: { email: 'approver@vendorbridge.com' },
    update: {},
    create: {
      email: 'approver@vendorbridge.com',
      passwordHash: approverHash,
      role: 'APPROVER',
      firstName: 'Manager',
      lastName: 'Approver',
    },
  });
  console.log('✅ Approver:', approver.email);

  // --- Vendor 1 ---
  const vendor1User = await prisma.user.upsert({
    where: { email: 'vendor1@example.com' },
    update: {},
    create: {
      email: 'vendor1@example.com',
      passwordHash: vendorHash,
      role: 'VENDOR',
      firstName: 'Alpha',
      lastName: 'Vendor',
    },
  });

  await prisma.vendorProfile.upsert({
    where: { userId: vendor1User.id },
    update: {},
    create: {
      userId: vendor1User.id,
      companyName: 'Alpha Supplies Pvt. Ltd.',
      gstNumber: '27AABCA1234F1Z5',
      contactPhone: '+91-9876543210',
      category: 'IT Hardware',
      vendorStatus: 'ACTIVE',
      rating: 4.5,
    },
  });
  console.log('✅ Vendor 1:', vendor1User.email, '(Alpha Supplies)');

  // --- Vendor 2 ---
  const vendor2User = await prisma.user.upsert({
    where: { email: 'vendor2@example.com' },
    update: {},
    create: {
      email: 'vendor2@example.com',
      passwordHash: vendorHash,
      role: 'VENDOR',
      firstName: 'Beta',
      lastName: 'Vendor',
    },
  });

  await prisma.vendorProfile.upsert({
    where: { userId: vendor2User.id },
    update: {},
    create: {
      userId: vendor2User.id,
      companyName: 'Beta Technologies Ltd.',
      gstNumber: '29AABCB5678G2Z3',
      contactPhone: '+91-9123456789',
      category: 'IT Hardware',
      vendorStatus: 'ACTIVE',
      rating: 3.8,
    },
  });
  console.log('✅ Vendor 2:', vendor2User.email, '(Beta Technologies)');

  // --- Vendor 3 (different category) ---
  const vendor3User = await prisma.user.upsert({
    where: { email: 'vendor3@example.com' },
    update: {},
    create: {
      email: 'vendor3@example.com',
      passwordHash: vendorHash,
      role: 'VENDOR',
      firstName: 'Gamma',
      lastName: 'Vendor',
    },
  });

  await prisma.vendorProfile.upsert({
    where: { userId: vendor3User.id },
    update: {},
    create: {
      userId: vendor3User.id,
      companyName: 'Gamma Office Solutions',
      gstNumber: '07AABCG9012H3Z1',
      contactPhone: '+91-9988776655',
      category: 'Office Supplies',
      vendorStatus: 'ACTIVE',
      rating: 4.2,
    },
  });
  console.log('✅ Vendor 3:', vendor3User.email, '(Gamma Office Solutions)');

  console.log('\n🎉 Seeding complete!\n');
  console.log('─── Login Credentials ─────────────────────');
  console.log('Admin:    admin@vendorbridge.com    / admin123');
  console.log('Officer:  officer@vendorbridge.com  / officer123');
  console.log('Approver: approver@vendorbridge.com / approver123');
  console.log('Vendor1:  vendor1@example.com       / vendor123');
  console.log('Vendor2:  vendor2@example.com       / vendor123');
  console.log('Vendor3:  vendor3@example.com       / vendor123');
  console.log('────────────────────────────────────────────');

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
