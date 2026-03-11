
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, login: true, role: true }
  });
  console.log('---USERS START---');
  console.log(JSON.stringify(users, null, 2));
  console.log('---USERS END---');

  const me = users.find(u => u.login === 'sshameer');
  if (me && me.role !== 'PRESIDENT') {
    await prisma.user.update({
      where: { id: me.id },
      data: { role: 'PRESIDENT' }
    });
    console.log(`Updated sshameer to PRESIDENT`);
  } else if (!me) {
     console.log('sshameer not found in database');
  } else {
     console.log('sshameer is already PRESIDENT');
  }

  const logs = await prisma.labAccessLog.findMany({ take: 5 });
  console.log('---LOGS START---');
  console.log(JSON.stringify(logs, null, 2));
  console.log('---LOGS END---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
