import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, login: true, name: true, role: true, status: true }
  });

  const realLogins = [
    "akheiral", "aelsafi", "fmohamed", "nateliya", "mamuzamm", "eabdelfa",
    "samamaev", "awaahmed", "fkuruthl", "iabdul-n", "ssujaude", "haiqbal",
    "moashraf", "hajmoham", "khzernou", "eihebini", "assempas", "smorlier",
    "jalsadik", "mdheen", "krajbans", "sshameer"
  ];

  const suspectUsers = users.filter(u => !realLogins.includes(u.login));

  console.log("Potential fake members:");
  suspectUsers.forEach(u => {
    console.log(`- [${u.id}] @${u.login} (${u.name}) | Role: ${u.role} | Status: ${u.status}`);
  });
}

main().finally(() => prisma.$disconnect());
