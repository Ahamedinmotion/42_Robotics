import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { Rank } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return err("Unauthorized", 401);

  try {
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: params.id },
      include: {
        team: { 
          include: { 
            project: true,
            evaluations: {
              where: { teamResponse: { not: null } },
              take: 1
            }
          } 
        },
        registrations: {
          select: { userRank: true, isAdmin: true },
        },
        evaluations: {
          select: { id: true },
        },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

    // Format registration counts by tier
    const registrations = defense.registrations;
    const registrationTiers = {
      admin: registrations.filter((r: any) => r.isAdmin).length,
      expert: registrations.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length,
      gallery: registrations.filter((r: any) => !r.isAdmin && r.userRank !== Rank.A && r.userRank !== Rank.S).length,
    };

    // Evaluation count
    const evaluationCount = defense.evaluations.length;

    // Check if team has submitted feedback (to reveal result)
    const teamHasSubmittedFeedback = defense.team.evaluations.length > 0;
    
    const result = (defense.result && teamHasSubmittedFeedback) ? defense.result : null;

    const { registrations: _, evaluations: __, team: ___, ...rest } = defense;

    return ok({
      ...rest,
      team: {
        id: defense.team.id,
        name: defense.team.name,
        project: defense.team.project
      },
      registrationTiers,
      evaluationCount,
      result,
    });
  } catch (error: any) {
    return err(error.message);
  }
}
