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

    // 1. Fetch and validate defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        registrations: { select: { userId: true } },
      },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status !== DefenseStatus.SCHEDULED && defense.status !== DefenseStatus.MINIMUM_NOT_MET) {
        return err(`Cannot open defense in ${defense.status} status`);
    }

    // 2. Update status and log opener
    const updatedDefense = await (prisma as any).publicDefense.update({
      where: { id: defenseId },
      data: {
        status: DefenseStatus.OPEN,
        evaluationOpen: true,
        evaluationOpenedAt: new Date(),
        evaluationOpenedById: user.id,
      },
    });

    // 3. Notify all registered evaluators
    const registrations = defense.registrations;
    const projectTitle = defense.team.project.title;

    if (registrations.length > 0) {
      await prisma.notification.createMany({
        data: registrations.map((r: any) => ({
          userId: r.userId,
          type: "PUBLIC_DEFENSE" as any,
          title: "Evaluation Open",
          body: `Evaluation is now open for ${projectTitle}. Submit your scores at /evaluations`,
          actionUrl: "/evaluations",
        })),
      });
    }

    return ok(updatedDefense);
  } catch (error: any) {
    return err(error.message);
  }
}
