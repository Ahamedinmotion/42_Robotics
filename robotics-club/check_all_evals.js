const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const teamId = "cmmu2vx9700032yiykqvn9b3p";
  const evals = await prisma.evaluation.findMany({
    where: { teamId },
    select: {
        id: true,
        status: true,
        project: { select: { title: true } }
    }
  });

  console.log("All Team Evaluations:", JSON.stringify(evals, null, 2));
}

main().catch(console.error);
