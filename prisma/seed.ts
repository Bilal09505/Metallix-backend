import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create initial metals
  const metals = await prisma.metal.createMany({
    data: [
      { name: 'Gold', symbol: 'AU', currentRate: 180000, unit: 'kg' },
      { name: 'Silver', symbol: 'AG', currentRate: 2200, unit: 'kg' },
      { name: 'Copper', symbol: 'CU', currentRate: 1800, unit: 'kg' },
      { name: 'Brass', symbol: 'BR', currentRate: 1200, unit: 'kg' },
    ],
    skipDuplicates: true,
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { cnic: '1234567890123' },
    update: {},
    create: {
      name: 'Sohaib Ullah',
      cnic: '1234567890123',
      phone: '03001234567',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj89OFGVHFWC', // password: admin123
      role: 'ADMIN',
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });