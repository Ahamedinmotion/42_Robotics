import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return err("Unauthorized", 401);

  try {
    const criteria = await (prisma as any).defenseCriteria.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    const settings = await (prisma as any).defenseCriteriaSettings.findUnique({
      where: { id: "singleton" },
    });

    return ok({ criteria, settings });
  } catch (error: any) {
    return err(error.message);
  }
}
