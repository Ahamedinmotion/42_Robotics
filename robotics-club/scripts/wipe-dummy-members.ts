import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DUMMY_LOGINS = [
  "president_user",
  "vp_user",
  "projmanager_user",
  "secretary_user",
  "social_user",
  "student_a",
  "student_b",
  "student_c",
  "student_d",
  "student_e",
  "waitlist_user",
  "blackholed_user"
];

const PROTECTED_LOGIN = "sshameer";

async function main() {
  console.log("Starting dummy user wipe...");

  for (const login of DUMMY_LOGINS) {
    if (login === PROTECTED_LOGIN) {
      console.log(`Skipped (protected): ${login}`);
      continue;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { login },
        select: { id: true }
      });

      if (!user) {
        console.log(`Skipped (not found): ${login}`);
        continue;
      }

      const userId = user.id;

      // 1. Handle deep dependencies that prevent Team/Project/User deletion
      // These are relations without ON DELETE CASCADE or that block parent deletion
      
      // Cleanup all things that reference Teams that will be deleted
      const teamFilter = { OR: [{ leaderId: userId }, { project: { createdById: userId } }] };
      
      await prisma.evaluation.deleteMany({ where: { OR: [{ evaluatorId: userId }, { team: teamFilter }] } });
      await prisma.evaluationSlot.deleteMany({ where: { OR: [{ claimedById: userId }, { team: teamFilter }] } });
      await prisma.weeklyReport.deleteMany({ where: { OR: [{ submittedById: userId }, { team: teamFilter }] } });
      await prisma.checkout.deleteMany({ where: { OR: [{ userId }, { team: teamFilter }] } });
      await prisma.damageReport.deleteMany({ where: { OR: [{ reportedById: userId }, { resolvedById: userId }, { team: teamFilter }] } });
      await prisma.fabricationRequest.deleteMany({ where: { OR: [{ userId }, { reviewedById: userId }, { team: teamFilter }] } });
      await prisma.materialRequest.deleteMany({ where: { OR: [{ requestedById: userId }, { reviewedById: userId }, { team: teamFilter }] } });
      
      // Now safe to delete Teams
      await prisma.teamMember.deleteMany({ where: { OR: [{ userId }, { team: teamFilter }] } });
      await prisma.team.deleteMany({ where: teamFilter });

      // Now safe to delete Projects created by the user
      await prisma.project.deleteMany({ where: { createdById: userId } });

      // Handle other user-direct relations
      await prisma.$transaction([
        prisma.adminAuditLog.deleteMany({ where: { OR: [{ actorId: userId }, { targetId: userId }] } }),
        prisma.adminNote.deleteMany({ where: { OR: [{ targetUserId: userId }, { authorId: userId }] } }),
        prisma.announcementDismissal.deleteMany({ where: { userId } }),
        prisma.announcement.deleteMany({ where: { createdById: userId } }),
        prisma.workshopRSVP.deleteMany({ where: { userId } }),
        prisma.workshop.deleteMany({ where: { hostId: userId } }),
        prisma.projectProposal.deleteMany({ where: { OR: [{ proposedById: userId }, { reviewedById: userId }] } }),
        prisma.userAchievement.deleteMany({ where: { userId } }),
        prisma.userSkillProgress.deleteMany({ where: { userId } }),
        prisma.userTitle.deleteMany({ where: { userId } }),
        prisma.compliment.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } }),
        prisma.moodBoardNote.deleteMany({ where: { authorId: userId } }),
        prisma.featureRequestVote.deleteMany({ where: { userId } }),
        prisma.featureRequest.deleteMany({ where: { userId } }),
        prisma.labAccessLog.deleteMany({ where: { userId } }),
        prisma.alumniEvaluator.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.clubSettings.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
        prisma.account.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } })
      ]);

      console.log(`Deleted: ${login}`);
    } catch (error: any) {
      console.log(`Failed: ${login} — ${error.message}`);
    }
  }

  console.log("Wipe complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error during wipe:");
  console.error(e);
  process.exit(1);
});
