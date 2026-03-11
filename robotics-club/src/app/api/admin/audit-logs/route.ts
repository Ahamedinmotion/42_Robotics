import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id || session.user.role !== "PRESIDENT") {
			return err("Unauthorized", 401);
		}

		const logs = await (prisma as any).adminAuditLog.findMany({
			take: 100,
			orderBy: { createdAt: "desc" },
			include: {
				actor: { select: { login: true, name: true } },
				target: { select: { login: true, name: true } }
			}
		});

		return ok(logs);
	} catch (error) {
		console.error("Audit Log FETCH Error:", error);
		return err("Internal Server Error", 500);
	}
}
