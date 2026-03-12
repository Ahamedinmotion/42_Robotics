import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

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
