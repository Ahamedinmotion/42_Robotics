import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id || session.user.role !== "PRESIDENT") {
			return err("Unauthorized. Only the President can impersonate.", 401);
		}

		const { targetUserId } = await req.json();
		if (!targetUserId) return err("Target user ID is required", 400);

		const target = await prisma.user.findUnique({ where: { id: targetUserId } });
		if (!target) return err("Target user not found", 404);

		// Store impersonation in the database for persistence (this requires a refresh or session adjustment)
		// We'll use a cookie-based approach or session override. 
		// For simplicity, we'll store it on the user record (impersonatorId) and handle it in auth.ts.
		
		await (prisma.user as any).update({
			where: { id: session.user.id },
			data: { impersonatorId: targetUserId }
		});

		// Create audit log
		await (prisma as any).adminAuditLog.create({
			data: {
				actorId: session.user.id,
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

		await (prisma.user as any).update({
			where: { id: session.user.id },
			data: { impersonatorId: null }
		});

		return ok({ success: true });
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}
