import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOGINS = [
  "akheiral", "aelsafi", "fmohamed", "nateliya", "mamuzamm", "eabdelfa",
  "samamaev", "awaahmed", "fkuruthl", "iabdul-n", "ssujaude", "haiqbal",
  "moashraf", "hajmoham", "khzernou", "eihebini", "assempas", "smorlier",
  "jalsadik", "mdheen", "krajbans", "fabdul-s", "eshikur", "hsuliman",
  "sechavez", "ayasser", "moeid", "rlutucir", "inkahar", "cugwu",
  "zoisobir", "sobied", "fbaras", "maakhan", "sahamad", "emussie",
  "imqandyl", "jalosta-", "sibrahem", "mohhammo", "rarayano", "mohouhou",
  "mhouhou"
];

async function main() {
  let count = 0;
  console.log(`Starting upsert for ${LOGINS.length} members...`);

  for (const login of LOGINS) {
    try {
      await prisma.user.upsert({
        where: { login: login },
        update: {
          status: "ACTIVE",
          currentRank: "E",
          role: "STUDENT"
        },
        create: {
          login: login,
          name: login,
          status: "ACTIVE",
          currentRank: "E",
          role: "STUDENT",
          labAccessEnabled: false,
          activeTheme: "FORGE",
          unlockedThemes: ["FORGE", "FIELD"],
          hasSeenIntro: false,
          hasSeenWaitlistModal: false,
        }
      });
      count++;
    } catch (error: any) {
      console.error(`Failed to upsert ${login}: ${error.message}`);
    }
  }

  console.log(`Done. ${count} members added/updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error during member addition:");
  console.error(e);
  process.exit(1);
});
