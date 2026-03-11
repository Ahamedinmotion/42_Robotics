import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		if (session.user.role !== "PRESIDENT") {
			return err("Forbidden. Only the President can modify roles.", 403);
		}

		const body = await req.json();
		const { targetUserId, newRole } = body;

		if (!targetUserId || !newRole) {
			return err("Missing parameters", 400);
		}

		const validRoles = ["STUDENT", "SECRETARY", "PROJECT_MANAGER", "SOCIAL_MEDIA_MANAGER", "VP", "PRESIDENT"];
		if (!validRoles.includes(newRole)) {
			return err("Invalid role", 400);
		}

		const target = await prisma.user.findUnique({
			where: { id: targetUserId },
			select: { id: true, role: true }
		});

		if (!target) return err("User not found", 404);

		// Prevent demoting self or another PRESIDENT for safety (unless explicit DB override)
		if (target.role === "PRESIDENT" && session.user.id !== targetUserId) {
			return err("Cannot modify another President's role.", 403);
		}

		const updatedUser = await prisma.user.update({
			where: { id: targetUserId },
			data: { role: newRole as any },
		});

		return ok({ id: updatedUser.id, login: updatedUser.login, newRole: updatedUser.role });
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}
