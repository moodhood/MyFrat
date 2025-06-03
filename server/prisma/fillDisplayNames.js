// prisma/fillDisplayNames.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany();
  for (const r of roles) {
    // Just set displayName = name (or any human‐friendly string you want)
    await prisma.role.update({
      where: { id: r.id },
      data: { displayName: r.name },
    });
    console.log(`Set displayName for role ${r.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
