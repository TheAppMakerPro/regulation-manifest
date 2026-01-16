import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subMonths, addHours } from 'date-fns';
import { seedRegulations } from './seeds/regulations.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@tankertrack.com' },
    update: {},
    create: {
      email: 'demo@tankertrack.com',
      passwordHash,
      fullName: 'John Mariner',
      licenseNumber: 'MMC-123456',
      timezone: 'America/New_York',
      renewalCycleStart: subMonths(new Date(), 24), // Started 2 years ago
      targetSeaDays: 365,
      targetSeaHours: 8760,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create sample vessels
  const vessels = await Promise.all([
    prisma.vessel.upsert({
      where: { userId_name: { userId: user.id, name: 'MV Ocean Pioneer' } },
      update: {},
      create: {
        userId: user.id,
        name: 'MV Ocean Pioneer',
        imoNumber: '9123456',
        vesselType: 'Oil Tanker',
        flag: 'Marshall Islands',
        grossTonnage: 45000,
      },
    }),
    prisma.vessel.upsert({
      where: { userId_name: { userId: user.id, name: 'MT Gulf Star' } },
      update: {},
      create: {
        userId: user.id,
        name: 'MT Gulf Star',
        imoNumber: '9234567',
        vesselType: 'Chemical Tanker',
        flag: 'Panama',
        grossTonnage: 32000,
      },
    }),
    prisma.vessel.upsert({
      where: { userId_name: { userId: user.id, name: 'MV Atlantic Spirit' } },
      update: {},
      create: {
        userId: user.id,
        name: 'MV Atlantic Spirit',
        imoNumber: '9345678',
        vesselType: 'Product Tanker',
        flag: 'Liberia',
        grossTonnage: 55000,
      },
    }),
  ]);

  console.log('✅ Created sample vessels');

  // Create sample companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { userId_name: { userId: user.id, name: 'Global Maritime Inc.' } },
      update: {},
      create: {
        userId: user.id,
        name: 'Global Maritime Inc.',
        address: '123 Harbor Drive, Houston, TX 77001',
        country: 'United States',
      },
    }),
    prisma.company.upsert({
      where: { userId_name: { userId: user.id, name: 'Pacific Shipping Co.' } },
      update: {},
      create: {
        userId: user.id,
        name: 'Pacific Shipping Co.',
        address: '456 Port Road, Singapore 049908',
        country: 'Singapore',
      },
    }),
  ]);

  console.log('✅ Created sample companies');

  // Create sample seatime entries (last 2 years)
  const entries = [
    {
      vesselId: vessels[0].id,
      companyId: companies[0].id,
      rank: 'Third Officer',
      startAt: subMonths(new Date(), 23),
      durationDays: 90,
      departurePort: 'Houston, TX',
      arrivalPort: 'Rotterdam, Netherlands',
      isVerified: true,
      verifiedBy: 'Capt. Smith',
    },
    {
      vesselId: vessels[1].id,
      companyId: companies[1].id,
      rank: 'Second Officer',
      startAt: subMonths(new Date(), 18),
      durationDays: 120,
      departurePort: 'Singapore',
      arrivalPort: 'Los Angeles, CA',
      isVerified: true,
      verifiedBy: 'Capt. Johnson',
    },
    {
      vesselId: vessels[0].id,
      companyId: companies[0].id,
      rank: 'Second Officer',
      startAt: subMonths(new Date(), 12),
      durationDays: 100,
      departurePort: 'New Orleans, LA',
      arrivalPort: 'Hamburg, Germany',
      isVerified: true,
      verifiedBy: 'Capt. Smith',
    },
    {
      vesselId: vessels[2].id,
      companyId: companies[0].id,
      rank: 'Second Officer',
      startAt: subMonths(new Date(), 6),
      durationDays: 85,
      departurePort: 'Galveston, TX',
      arrivalPort: 'Antwerp, Belgium',
      isVerified: false,
    },
    {
      vesselId: vessels[0].id,
      companyId: companies[0].id,
      rank: 'Chief Officer',
      startAt: subMonths(new Date(), 2),
      durationDays: 45,
      departurePort: 'Houston, TX',
      arrivalPort: 'Le Havre, France',
      isVerified: false,
    },
  ];

  for (const entry of entries) {
    const startAt = entry.startAt;
    const endAt = addHours(startAt, entry.durationDays * 24);
    const durationHours = entry.durationDays * 24;

    await prisma.seatimeEntry.create({
      data: {
        userId: user.id,
        vesselId: entry.vesselId,
        companyId: entry.companyId,
        rank: entry.rank,
        watchSchedule: '4 on / 8 off',
        startAt,
        endAt,
        computedDurationHours: durationHours,
        computedDurationDays: entry.durationDays,
        departurePort: entry.departurePort,
        arrivalPort: entry.arrivalPort,
        route: `${entry.departurePort} → ${entry.arrivalPort}`,
        isVerified: entry.isVerified,
        verifiedBy: entry.verifiedBy,
        verifiedAt: entry.isVerified ? new Date() : null,
        notes: `Standard voyage operations. ${entry.rank} duties.`,
      },
    });
  }

  console.log('✅ Created sample seatime entries');

  // Seed maritime regulations
  console.log('');
  console.log('📚 Seeding maritime regulations...');
  await seedRegulations();

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('📧 Demo login credentials:');
  console.log('   Email: demo@tankertrack.com');
  console.log('   Password: demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
