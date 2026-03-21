import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus } from "@prisma/client";
import { DefenseEvaluationWithScores, calculateDefenseResult } from "@/lib/defense-scoring";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;
    const { note } = await req.json();

    if (!note || note.trim().length < 10) {
      return err("A descriptive note (min 10 chars) is required to dispel the gallery");
    }

    // 1. Fetch Defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

    // 2. Update Flag
    return await prisma.$transaction(async (tx) => {
      const updatedDefense = await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: {
          lowerRankDispelled: true,
          lowerRankDispelledById: user.id,
          lowerRankDispelledAt: new Date(),
          lowerRankDispelledNote: note,
        },
      });

      // 3. Recalculate Result if exists
      if (defense.result) {
        const allEvaluations = await (tx as any).defenseEvaluation.findMany({
          where: { defenseId },
          include: { criteriaScores: true },
        }) as DefenseEvaluationWithScores[];

        const settings = await (tx as any).defenseCriteriaSettings.findUnique({
          where: { id: "singleton" },
        });

        if (!settings) throw new Error("Defense settings not found");

        const resultData = calculateDefenseResult(
          updatedDefense,
          allEvaluations,
          settings.passThreshold,
          settings.ratingScale
        );

        await (tx as any).defenseResult.update({
          where: { defenseId },
          data: {
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
        });

        // Update status if finalized
        const finalizedStatuses = ["PASSED", "FAILED", "PROVISIONAL"];
        if (finalizedStatuses.includes(updatedDefense.status)) {
            const finalStatus = resultData.provisional 
                 ? "PROVISIONAL" 
                 : (resultData.passed ? "PASSED" : "FAILED");
                 
            await (tx as any).publicDefense.update({
                where: { id: defenseId },
                data: { status: finalStatus },
            });
        }
      }

      // Log to AdminAuditLog
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "DISPEL_GALLERY",
          details: `Gallery dispelled for defense ${defenseId}. Reason: ${note}`,
        },
      });

      return ok(updatedDefense);
    });
  } catch (error: any) {
    return err(error.message);
  }
}
