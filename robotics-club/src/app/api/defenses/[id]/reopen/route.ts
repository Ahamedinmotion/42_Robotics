import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;
    const { note } = await req.json();

    if (!note || note.trim().length < 10) {
      return err("A descriptive note (min 10 chars) is required to reopen a defense");
    }

    // 1. Fetch Defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        registrations: { select: { userId: true } },
        evaluations: { select: { evaluatorId: true } },
      },
    });

    if (!defense) return err("Defense not found", 404);
    
    if (defense.reopened) return err("This defense has already been reopened once");
    
    const validStatuses = [DefenseStatus.CLOSED, DefenseStatus.PROVISIONAL];
    if (!validStatuses.includes(defense.status)) {
        return err(`Cannot reopen defense in ${defense.status} status`);
    }

    // 2. Update Defense
    const updatedDefense = await (prisma as any).publicDefense.update({
      where: { id: defenseId },
      data: {
        status: DefenseStatus.OPEN,
        evaluationClosed: false,
        reopened: true,
        reopenedAt: new Date(),
        reopenedById: user.id,
        reopenNote: note,
      },
    });

    // 3. Notify evaluators who haven't submitted
    const submittedIds = new Set(defense.evaluations.map((e: any) => e.evaluatorId));
    const unsubmitted = defense.registrations.filter((r: any) => !submittedIds.has(r.userId));
    const projectTitle = defense.team.project.title;

    if (unsubmitted.length > 0) {
      await prisma.notification.createMany({
        data: unsubmitted.map((r: any) => ({
          userId: r.userId,
          type: "PUBLIC_DEFENSE" as any,
          title: "Evaluation Reopened",
          body: `Evaluation reopened for ${projectTitle}. You can now submit your scores.`,
          actionUrl: "/evaluations",
        })),
      });
    }

    // Log to AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        actorId: user.id,
        action: "REOPEN_DEFENSE",
        details: `Defense ${defenseId} reopened. Reason: ${note}`,
      },
    });

    return ok(updatedDefense);
  } catch (error: any) {
    return err(error.message);
  }
}
