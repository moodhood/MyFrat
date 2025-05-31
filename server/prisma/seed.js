// seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create or update the 'Member' role
  const memberRole = await prisma.role.upsert({
    where: { name: 'Member' },
    update: {},
    create: {
      name: 'Member',
      permissions: [],
    },
  });

  // Hash passwords for seeded users
  const passwordHash = await bcrypt.hash('testpassword', 10); // use "testpassword" to log in

  // Set timestamps
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // Seed users
  await prisma.user.createMany({
    data: [
      {
        email: 'alice@example.com',
        passwordHash,
        name: 'Alice',
        roleId: memberRole.id,
        lastSeen: now,
        emailConfirmed: true,
      },
      {
        email: 'bob@example.com',
        passwordHash,
        name: 'Bob',
        roleId: memberRole.id,
        lastSeen: twoMinutesAgo,
        emailConfirmed: true,
      },
      {
        email: 'carol@example.com',
        passwordHash,
        name: 'Carol',
        roleId: memberRole.id,
        lastSeen: tenMinutesAgo,
        emailConfirmed: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete. Login with email/password: alice@example.com / testpassword');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
