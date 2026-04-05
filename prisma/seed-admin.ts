import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const SEED_ADMINS = [
  { username: 'adminCjr', password: 'cianjurAdmin123' },
  { username: 'adminSmi', password: 'sukabumiAdmin123' },
] as const;


async function main() {
  console.log('🌱 Starting seed process...');

  // Clear existing data
  await prisma.admin.deleteMany();

  console.log('🔐 Creating admin accounts...');
  for (const { username, password } of SEED_ADMINS) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.admin.create({
      data: { username, password: passwordHash },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${SEED_ADMINS.length} admin accounts (created)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
