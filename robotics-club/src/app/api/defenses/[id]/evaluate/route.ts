import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus } from "@prisma/client";
import { getEvaluatorWeight, calculateEvaluationScore } from "@/lib/defense-scoring";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const userId = session.user.id;
    const defenseId = params.id;
    const { scores, overallReview } = await req.json(); // scores: { criteriaId: string, score: number, note: string }[]

    // 1. Fetch Defense, Registration, and Settings
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        registrations: { where: { userId } },
        evaluations: { where: { evaluatorId: userId } },
      },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status !== DefenseStatus.OPEN) return err("Evaluations are not open for this defense");

    const registration = defense.registrations[0];
    if (!registration) return err("You are not registered to evaluate this defense", 403);
    if (defense.evaluations.length > 0) return err("You have already submitted an evaluation for this defense");

    const settings = await (prisma as any).defenseCriteriaSettings.findUnique({
      where: { id: "singleton" },
    });
    const criteria = await (prisma as any).defenseCriteria.findMany({
      where: { isActive: true },
    });

    if (!settings || !criteria) return err("Evaluation configuration missing");

    // 2. Validation
    if (overallReview.length < settings.overallMinChars) {
      return err(`Overall review must be at least ${settings.overallMinChars} characters`);
    }

    const criteriaMap = new Map(criteria.map((c: any) => [c.id, c]));
    const submittedScores: { criteriaId: string; score: number; note: string }[] = [];

    for (const c of criteria) {
      const scoreData = scores.find((s: any) => s.criteriaId === c.id);
      if (!scoreData) return err(`Missing score for criteria: ${c.name}`);
      
      if (scoreData.score < 1 || scoreData.score > settings.ratingScale) {
        return err(`Score for ${c.name} must be between 1 and ${settings.ratingScale}`);
      }
      
      if (scoreData.note.length < c.minChars) {
        return err(`Note for ${c.name} must be at least ${c.minChars} characters`);
      }
      
      submittedScores.push({
        criteriaId: c.id,
        score: scoreData.score,
        note: scoreData.note,
      });
    }

    // 3. Calculation
    const totalScore = calculateEvaluationScore(submittedScores as any, settings.ratingScale);

    // 4. Persistence
    return await prisma.$transaction(async (tx) => {
      const evaluation = await (tx as any).defenseEvaluation.create({
        data: {
          defenseId,
          evaluatorId: userId,
          evaluatorRank: registration.userRank,
          evaluatorWeight: getEvaluatorWeight(registration.userRank),
          isAdmin: registration.isAdmin,
          overallReview,
          totalScore,
          criteriaScores: {
            createMany: {
              data: submittedScores,
            },
          },
        },
      });

      return ok(evaluation);
    });
  } catch (error: any) {
    return err(error.message);
  }
}
