import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request) {
  const auth = await requirePermission("CAN_EDIT_CONTENT");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const { criteria, settings } = await req.json();

    // 1. Validation
    if (!settings || !criteria) return err("Missing required data");

    const activeCriteriaCount = criteria.filter((c: any) => c.isActive).length;
    if (activeCriteriaCount < 5) return err("Minimum 5 active criteria required");
    if (activeCriteriaCount > 15) return err("Maximum 15 active criteria allowed");

    if (settings.ratingScale < 3 || settings.ratingScale > 10) return err("Rating scale must be between 3 and 10");
    if (settings.passThreshold < 1 || settings.passThreshold > 100) return err("Pass threshold must be between 1 and 100");

    // 2. Database Update
    return await prisma.$transaction(async (tx) => {
      // Update Settings
      const updatedSettings = await (tx as any).defenseCriteriaSettings.update({
        where: { id: "singleton" },
        data: {
          ratingScale: settings.ratingScale,
          overallMinChars: settings.overallMinChars,
          passThreshold: settings.passThreshold,
          updatedById: user.id,
        },
      });

      // Upsert Criteria
      const criteriaResults = [];
      for (const c of criteria) {
        const result = await (tx as any).defenseCriteria.upsert({
          where: { id: c.id || 'new-id' },
          update: {
            name: c.name,
            description: c.description,
            order: c.order,
            minChars: c.minChars,
            isActive: c.isActive,
          },
          create: {
            name: c.name,
            description: c.description,
            order: c.order,
            minChars: c.minChars,
            isActive: c.isActive,
          },
        });
        criteriaResults.push(result);
      }

      return ok({ criteria: criteriaResults, settings: updatedSettings });
    });
  } catch (error: any) {
    return err(error.message);
  }
}
