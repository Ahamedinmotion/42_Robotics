import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

export async function POST(req: Request) {
	try {
		const auth = await requirePermission("CAN_IMPERSONATE");
		if (auth instanceof Response) return auth;

		const { targetUserId } = await req.json();
		if (!targetUserId) return err("Target user ID is required", 400);

		const target = await prisma.user.findUnique({ where: { id: targetUserId } });
		if (!target) return err("Target user not found", 404);

		const realAdminId = (auth.user as any).realAdminId || auth.user.id;
		
		await (prisma.user as any).update({
			where: { id: realAdminId },
			data: { impersonatorId: targetUserId }
		});

		// Create audit log
		await (prisma as any).adminAuditLog.create({
			data: {
				actorId: auth.user.id,
				targetId: targetUserId,
				action: "IMPERSONATE_START",
				details: `Started impersonating @${target.login}`
			}
		});

		return ok({ success: true });
	} catch (error) {
		console.error("Impersonation Error:", error);
		return err("Internal Server Error", 500);
	}
}

export async function DELETE() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const realAdminId = (session.user as any).realAdminId || session.user.id;

		await (prisma.user as any).update({
			where: { id: realAdminId },
			data: { impersonatorId: null }
		});

		return ok({ success: true });
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}
