const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const evalId = "cmmu5rf1s00122yiysaq8qs8b";
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evalId },
    include: {
      evaluator: true,
      team: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  console.log("Evaluation:", JSON.stringify(evaluation, null, 2));
}

main().catch(console.error);
