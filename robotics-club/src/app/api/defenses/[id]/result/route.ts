import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: params.id },
      include: {
        team: { include: { project: true, members: { include: { user: { select: { id: true } } } } } },
        result: true,
        evaluations: {
          include: {
            criteriaScores: {
              include: { criteria: true },
            },
          },
        },
      },
    });

    if (!defense) return err("Defense not found", 404);

    const result = defense.result;
    if (!result) return err("Results not yet available", 400);

    // Check if user is a team member
    const isTeamMember = defense.team.members.some((m: any) => m.user.id === session.user.id);

    // Build anonymous evaluator feedback
    const evaluatorFeedback = defense.evaluations.map((ev: any) => {
      let label = "Club Member";
      if (ev.isAdmin) label = "Admin";
      else if (ev.evaluatorRank === "S") label = "S Rank Evaluator";
      else if (ev.evaluatorRank === "A") label = "A Rank Evaluator";
      else if (ev.evaluatorRank === "B") label = "B Rank Member";
      else if (ev.evaluatorRank === "C") label = "C Rank Member";
      else if (ev.evaluatorRank === "D") label = "D Rank Member";
      else label = "Gallery Member";

      const tier = ev.isAdmin ? "admin" : (ev.evaluatorRank === "A" || ev.evaluatorRank === "S") ? "expert" : "gallery";

      return {
        label,
        tier,
        overallReview: ev.overallReview,
        totalScore: ev.totalScore,
        criteriaScores: ev.criteriaScores.map((cs: any) => ({
          criteriaName: cs.criteria?.name || "Unknown",
          score: cs.score,
          note: cs.note,
        })),
      };
    });

    // Build criteria averages for radar chart
    const criteriaMap: Record<string, { name: string; scores: number[] }> = {};
    defense.evaluations.forEach((ev: any) => {
      ev.criteriaScores.forEach((cs: any) => {
        const name = cs.criteria?.name || cs.criteriaId;
        if (!criteriaMap[name]) criteriaMap[name] = { name, scores: [] };
        criteriaMap[name].scores.push(cs.score);
      });
    });

    const criteriaAverages = Object.values(criteriaMap).map(c => ({
      name: c.name,
      average: c.scores.reduce((a, b) => a + b, 0) / c.scores.length,
    })).sort((a, b) => b.average - a.average);

    return ok({
      id: defense.id,
      status: defense.status,
      project: {
        title: defense.team.project.title,
        rank: defense.team.project.rank,
      },
      teamName: defense.team.name,
      isTeamMember,
      result: {
        adminAverage: result.adminAverage,
        adminPassed: result.adminPassed,
        adminCount: result.adminCount,
        expertAverage: result.expertAverage,
        expertPassed: result.expertPassed,
        expertCount: result.expertCount,
        galleryWeighted: result.galleryWeighted,
        galleryCount: result.galleryCount,
        galleryExcluded: result.galleryExcluded,
        finalScore: result.finalScore,
        passed: result.passed,
        provisional: result.provisional,
        provisionalReason: result.provisionalReason,
        dispelledNote: defense.dispelledNote,
      },
      evaluatorFeedback,
      criteriaAverages,
    });
  } catch (error: any) {
    return err(error.message);
  }
}
