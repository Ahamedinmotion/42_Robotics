import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  // Allow President OR users with CAN_OVERRIDE_EVALUATIONS
  const permissions = (session.user as any).permissions || [];
  const canOverride = session.user.role === "PRESIDENT" || permissions.includes("CAN_OVERRIDE_EVALUATIONS");
  if (!canOverride) {
    return err("Missing override permissions", 403);
  }

  try {
    const defenseId = params.id;
    const { action, note, confirmed } = await req.json();

    // 1. Fetch Defense and Result
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true, members: { select: { userId: true } } } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

    // Accept any finalized state: PROVISIONAL, PASSED, FAILED, CLOSED
    const allowedStates = ["PROVISIONAL", "PASSED", "FAILED", "CLOSED"];
    if (!allowedStates.includes(defense.status)) {
      return err(`Cannot override a defense in ${defense.status} state`);
    }

    if (!defense.result) {
      return err("Defense result not found");
    }

    // 2. Determine the target status
    let finalStatus: string;

    // Support both legacy `confirmed` field and new `action` field
    if (action === "force_pass") {
      finalStatus = "PASSED";
    } else if (action === "override_fail") {
      finalStatus = "FAILED";
    } else if (action === "confirm") {
      finalStatus = defense.result.passed ? "PASSED" : "FAILED";
    } else if (typeof confirmed === "boolean") {
      // Legacy support
      finalStatus = confirmed
        ? (defense.result.passed ? "PASSED" : "FAILED")
        : "FAILED";
    } else {
      return err("Invalid action. Use 'force_pass', 'override_fail', or 'confirm'.", 400);
    }

    // 3. Process
    return await prisma.$transaction(async (tx) => {
      await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: { status: finalStatus },
      });

      await (tx as any).defenseResult.update({
        where: { defenseId },
        data: {
          passed: finalStatus === "PASSED",
          provisional: false,
          presidentConfirmed: true,
          presidentConfirmedById: session.user.id,
          presidentConfirmedAt: new Date(),
          provisionalReason: note ? `Override by ${session.user.name}: ${note}` : null,
        },
      });

      // 4. Notify Team
      const projectTitle = defense.team.project.title;
      const teamMembers = defense.team.members;

      await tx.notification.createMany({
        data: teamMembers.map((m: any) => ({
          userId: m.userId,
          type: "PUBLIC_DEFENSE" as any,
          title: `Defense ${finalStatus}`,
          body: `An admin has updated your defense for ${projectTitle}. Result: ${finalStatus}.${note ? ` Note: ${note}` : ""}`,
          actionUrl: "/evaluations",
        })),
      });

      return ok({ status: finalStatus });
    });
  } catch (error: any) {
    return err(error.message);
  }
}

