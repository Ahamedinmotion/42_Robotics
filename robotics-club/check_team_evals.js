const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const teamId = "cmmu2vx9700032yiykqvn9b3p";
  const evals = await prisma.evaluation.findMany({
    where: { teamId },
    orderBy: { completedAt: "desc" },
    include: {
        project: true
    }
  });

  console.log("Evaluations for Team:", JSON.stringify(evals, null, 2));
}

main().catch(console.error);
