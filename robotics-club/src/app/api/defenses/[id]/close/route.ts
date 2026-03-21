import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType, Rank, Status } from "@prisma/client";
import { calculateDefenseResult, DefenseEvaluationWithScores } from "@/lib/defense-scoring";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;
    const body = await req.json();
    const { confirm } = body;

    // 1. Fetch defense and registration progress
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true, members: { select: { userId: true } } } },
        registrations: { select: { id: true, userId: true, userRank: true, isAdmin: true } },
        evaluations: { select: { id: true, evaluatorId: true } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status !== DefenseStatus.OPEN) return err(`Cannot close defense in ${defense.status} status`);

    // 2. Count unsubmitted evaluators
    const submittedIds = new Set(defense.evaluations.map((e: any) => e.evaluatorId));
    const unsubmitted = defense.registrations.filter((r: any) => !submittedIds.has(r.userId));

    if (unsubmitted.length > 0 && !confirm) {
      const tiers = {
        admin: unsubmitted.filter((r: any) => r.isAdmin).length,
        expert: unsubmitted.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length,
        gallery: unsubmitted.filter((r: any) => !r.isAdmin && r.userRank !== Rank.A && r.userRank !== Rank.S).length,
      };

      return ok({
        warning: true,
        unsubmittedCount: unsubmitted.length,
        unsubmittedTiers: tiers,
      });
    }

    // 3. Finalize and Calculate
    return await prisma.$transaction(async (tx) => {
      // 3a. Update metadata
      await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: {
          status: DefenseStatus.CLOSED,
          evaluationClosed: true,
          evaluationClosedAt: new Date(),
          evaluationClosedById: user.id,
        },
      });

      // 3b. Fetch all evaluations with scores
      const allEvaluations = await (tx as any).defenseEvaluation.findMany({
        where: { defenseId },
        include: { criteriaScores: true },
      }) as DefenseEvaluationWithScores[];

      const settings = await (tx as any).defenseCriteriaSettings.findUnique({
        where: { id: "singleton" },
      });

      if (!settings) throw new Error("Defense settings not found");

      // 3c. Calculate Result
      const resultData = calculateDefenseResult(
        defense,
        allEvaluations,
        settings.passThreshold,
        settings.ratingScale
      );

      // 3d. Upsert Result Record
      await (tx as any).defenseResult.upsert({
        where: { defenseId },
        update: {
          adminAverage: resultData.adminAverage,
          adminPassed: resultData.adminPassed,
          adminCount: resultData.adminCount,
          expertAverage: resultData.expertAverage,
          expertPassed: resultData.expertPassed,
          expertCount: resultData.expertCount,
          galleryWeighted: resultData.galleryWeighted,
          galleryCount: resultData.galleryCount,
          galleryExcluded: resultData.galleryExcluded,
          finalScore: resultData.finalScore,
          passed: resultData.passed,
          provisional: resultData.provisional,
          provisionalReason: resultData.provisionalReason,
          calculatedAt: new Date(),
        },
        create: {
          defenseId,
          adminAverage: resultData.adminAverage,
          adminPassed: resultData.adminPassed,
          adminCount: resultData.adminCount,
          expertAverage: resultData.expertAverage,
          expertPassed: resultData.expertPassed,
          expertCount: resultData.expertCount,
          galleryWeighted: resultData.galleryWeighted,
          galleryCount: resultData.galleryCount,
          galleryExcluded: resultData.galleryExcluded,
          finalScore: resultData.finalScore,
          passed: resultData.passed,
          provisional: resultData.provisional,
          provisionalReason: resultData.provisionalReason,
        },
      });

      // 3e. Update Final status
      const finalStatus = resultData.provisional 
        ? DefenseStatus.PROVISIONAL 
        : (resultData.passed ? DefenseStatus.PASSED : DefenseStatus.FAILED);

      await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: { status: finalStatus },
      });

      // 4. Notifications
      const projectTitle = defense.team.project.title;
      
      if (resultData.provisional) {
        // Notify President
        const president = await tx.user.findFirst({ where: { role: "PRESIDENT", status: Status.ACTIVE } });
        if (president) {
          await tx.notification.create({
            data: {
              userId: president.id,
              type: "PUBLIC_DEFENSE" as any,
              title: "Provisional Defense Result",
              body: `The defense for ${projectTitle} is PROVISIONAL (${resultData.provisionalReason}). Your confirmation is required.`,
              actionUrl: "/admin/defenses",
            },
          });
        }
      } else {
        // Notify Team
        const teamMembers = defense.team.members;
        await tx.notification.createMany({
          data: teamMembers.map((m: any) => ({
            userId: m.userId,
            type: "PUBLIC_DEFENSE" as any,
            title: `Defense ${resultData.passed ? 'PASSED' : 'FAILED'}`,
            body: `Your defense for ${projectTitle} has been processed. Result: ${resultData.passed ? 'PASSED' : 'FAILED'}.`,
            actionUrl: "/evaluations",
          })),
        });
      }

      return ok({ status: finalStatus, result: resultData });
    });
  } catch (error: any) {
    return err(error.message);
  }
}
