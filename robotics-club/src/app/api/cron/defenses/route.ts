import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DefenseStatus, NotificationType } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

/**
 * Public Defense Scheduled Check
 * Runs every 5 minutes to notify admins of starting defenses.
 */
export async function GET() {
  try {
    const now = new Date();

    // 1. Find defenses that should be starting now but aren't open yet
    const startingDefenses = await (prisma as any).publicDefense.findMany({
      where: {
        status: DefenseStatus.SCHEDULED,
        scheduledAt: { lte: now },
        evaluationOpen: false,
      },
      include: {
        team: { include: { project: true } },
      },
    });

    if (startingDefenses.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 2. Find all users with CAN_MANAGE_DEFENSES permission
    // We fetch all dynamic roles with the permission first to optimize
    const rolesWithPermission = await (prisma as any).dynamicRole.findMany({
      where: {
        permissions: { has: "CAN_MANAGE_DEFENSES" },
      },
      select: { name: true },
    });

    const roleNames = rolesWithPermission.map((r: any) => r.name);

    if (roleNames.length === 0) {
      return NextResponse.json({ success: true, count: 0, warning: "No roles found with CAN_MANAGE_DEFENSES" });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: roleNames },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({ success: true, count: 0, warning: "No active admins found for notification" });
    }

    // 3. Send urgent notifications to these admins for each starting defense
    const notifications = [];
    for (const defense of startingDefenses) {
      const projectTitle = defense.team.project.title;
      const teamName = defense.team.name || "Unnamed Team";

      for (const admin of admins) {
        notifications.push({
          userId: admin.id,
          type: "PUBLIC_DEFENSE" as any,
          title: "🚨 Defense Starting Now",
          body: `${projectTitle} by ${teamName} is scheduled to start now. Open evaluation at /admin or /evaluations`,
          actionUrl: "/evaluations",
        });
      }
    }

    await prisma.notification.createMany({
      data: notifications,
    });

    return NextResponse.json({
      success: true,
      defensesProcessed: startingDefenses.length,
      notificationsSent: notifications.length,
    });
  } catch (error: any) {
    console.error("Defense Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
