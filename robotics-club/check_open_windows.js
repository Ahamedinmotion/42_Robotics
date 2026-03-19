const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const teamId = "cmmu2vx9700032yiykqvn9b3p";
  const windows = await prisma.availabilityWindow.findMany({
    where: { teamId, isOpen: true },
    include: { slots: true }
  });

  console.log("Open Windows for Team:", JSON.stringify(windows, null, 2));
}

main().catch(console.error);
