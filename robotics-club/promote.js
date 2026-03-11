const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.updateMany({
        where: { login: 'sshameer' },
        data: { role: 'PRESIDENT', status: 'ACTIVE' }
    });
    console.log('Successfully elevated sshameer to PRESIDENT and ACTIVE status.');
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
