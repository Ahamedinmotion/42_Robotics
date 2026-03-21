import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { Rank, TeamStatus, Status, DefenseStatus, NotificationType } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return err("Unauthorized", 401);

  try {
    const defenses = await (prisma as any).publicDefense.findMany({
      where: {
        status: { in: [DefenseStatus.SCHEDULED, DefenseStatus.OPEN] },
      },
      include: {
        team: { include: { project: true } },
        _count: {
          select: { registrations: true },
        },
        registrations: {
          select: { userRank: true, isAdmin: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    // Format registration counts by tier
    const formattedDefenses = defenses.map((d: any) => {
      const registrations = d.registrations;
      const tiers = {
        admin: registrations.filter((r: any) => r.isAdmin).length,
        expert: registrations.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length,
        gallery: registrations.filter((r: any) => !r.isAdmin && r.userRank !== Rank.A && r.userRank !== Rank.S).length,
      };

      const { registrations: _, ...rest } = d;
      return { ...rest, registrationTiers: tiers };
    });

    return ok(formattedDefenses);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const { scheduledAt } = await req.json();
    const userId = session.user.id;

    // 1. Find the user's active team at A or S rank
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          status: TeamStatus.ACTIVE,
          rank: { in: [Rank.A, Rank.S] },
        },
      },
      include: {
        team: {
          include: {
            project: true,
            publicDefense: true,
          },
        },
      },
    });

    if (!teamMember) {
      return err("You must be in an active A or S rank team to schedule a defense", 403);
    }

    const team = teamMember.team;

    // 2. Check if the team already has a defense that isn't FAILED or RESCHEDULED
    if (team.publicDefense && team.publicDefense.status !== DefenseStatus.FAILED && team.publicDefense.status !== DefenseStatus.RESCHEDULED) {
      return err("Your team already has a scheduled or active defense");
    }

    // 3. Validate scheduledAt
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return err("Scheduled time must be in the future");
    }

    // 4. Create PublicDefense
    const defense = await (prisma as any).publicDefense.create({
      data: {
        teamId: team.id,
        projectId: team.projectId,
        scheduledAt: scheduledDate,
        status: DefenseStatus.SCHEDULED,
      },
      include: {
        team: { include: { project: true } },
      },
    });

    // 5. Send notifications to ALL active members
    const activeUsers = await prisma.user.findMany({
      where: { status: Status.ACTIVE },
      select: { id: true },
    });

    const projectTitle = team.project.title;
    const teamName = team.name || "Unnamed Team";
    const formattedDate = scheduledDate.toLocaleString();

    await prisma.notification.createMany({
      data: activeUsers.map((u) => ({
        userId: u.id,
        type: "PUBLIC_DEFENSE" as any,
        title: "Public Defense Scheduled",
        body: `${projectTitle} by ${teamName} — ${formattedDate}. Register to evaluate at /evaluations`,
        actionUrl: "/evaluations",
      })),
    });

    return ok(defense);
  } catch (error: any) {
    return err(error.message);
  }
}
