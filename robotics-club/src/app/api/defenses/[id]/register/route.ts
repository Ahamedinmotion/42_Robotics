import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { Rank, DefenseStatus } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

/**
 * Register to evaluate a defense
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const userId = session.user.id;
    const defenseId = params.id;

    // 1. Fetch defense and user details
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { members: { select: { userId: true } } } },
        registrations: { select: { userRank: true, isAdmin: true } },
      },
    });

    if (!defense) return err("Defense not found", 404);

    if (defense.status !== DefenseStatus.SCHEDULED && defense.status !== DefenseStatus.OPEN) {
      return err("Registration is only allowed for scheduled or open defenses");
    }

    // 2. Validate user is not a team member
    const isTeamMember = defense.team.members.some((m: any) => m.userId === userId);
    if (isTeamMember) return err("You cannot register to evaluate your own team's project", 403);

    // 3. Check if already registered
    const existing = await (prisma as any).defenseRegistration.findUnique({
      where: { defenseId_userId: { defenseId, userId } },
    });
    if (existing) return err("You are already registered for this defense");

    // 4. Determine admin and expert status
    const userRank = session.user.currentRank;
    const permissions = session.user.permissions as string[] | [];
    const isAdmin = hasPermission(permissions, "CAN_MANAGE_DEFENSES");

    // 5. Create registration and update minimumMet
    return await prisma.$transaction(async (tx) => {
      const registration = await (tx as any).defenseRegistration.create({
        data: {
          defenseId,
          userId,
          userRank,
          isAdmin,
        },
      });

      // Recalculate minimumMet
      const currentRegistrations = [...defense.registrations, { userRank, isAdmin }];
      const adminCount = currentRegistrations.filter(r => r.isAdmin).length;
      const expertCount = currentRegistrations.filter(r => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length;
      
      const minimumMet = adminCount >= 1 && expertCount >= 2;

      if (minimumMet !== defense.minimumMet) {
        await (tx as any).publicDefense.update({
          where: { id: defenseId },
          data: { minimumMet, status: minimumMet ? DefenseStatus.SCHEDULED : DefenseStatus.MINIMUM_NOT_MET },
        });
      }

      return ok(registration);
    });
  } catch (error: any) {
    return err(error.message);
  }
}

/**
 * Cancel registration
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const userId = session.user.id;
    const defenseId = params.id;

    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: { registrations: true },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status === DefenseStatus.OPEN) {
      return err("Cannot cancel registration once the defense has started");
    }

    return await prisma.$transaction(async (tx) => {
      await (tx as any).defenseRegistration.delete({
        where: { defenseId_userId: { defenseId, userId } },
      });

      // Recalculate minimumMet
      const updatedRegistrations = defense.registrations.filter((r: any) => r.userId !== userId);
      const adminCount = updatedRegistrations.filter((r: any) => r.isAdmin).length;
      const expertCount = updatedRegistrations.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length;
      
      const minimumMet = adminCount >= 1 && expertCount >= 2;

      if (minimumMet !== defense.minimumMet) {
        await (tx as any).publicDefense.update({
          where: { id: defenseId },
          data: { minimumMet, status: minimumMet ? DefenseStatus.SCHEDULED : DefenseStatus.MINIMUM_NOT_MET },
        });
      }

      return ok({ cancelled: true });
    });
  } catch (error: any) {
    return err(error.message);
  }
}
