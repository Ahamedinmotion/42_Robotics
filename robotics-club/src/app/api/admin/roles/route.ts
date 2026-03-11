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

		const users = await (prisma.user as any).findMany({
			where: {
				status: { not: "WAITLIST" },
			},
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				role: true,
				adminPermissions: true,
			},
			orderBy: { login: "asc" },
		});

		return ok(users);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		if (session.user.role !== "PRESIDENT") {
			return err("Forbidden. Only the President can modify roles and permissions.", 403);
		}

		const body = await req.json();
		const { targetUserId, newRole, permissions } = body;

		if (!targetUserId) {
			return err("Target user ID is required", 400);
		}

		const target = await (prisma.user as any).findUnique({
			where: { id: targetUserId },
			include: { adminPermissions: true },
		});

		if (!target) return err("User not found", 404);

		// Prevent demoting another PRESIDENT for safety
		if (target.role === "PRESIDENT" && session.user.id !== targetUserId) {
			return err("Cannot modify another President's role.", 403);
		}

		const data: any = {};
		if (newRole) {
			const validRoles = ["STUDENT", "SECRETARY", "PROJECT_MANAGER", "SOCIAL_MEDIA_MANAGER", "VP", "PRESIDENT"];
			if (!validRoles.includes(newRole)) return err("Invalid role", 400);
			data.role = newRole;
		}

		if (permissions) {
			data.adminPermissions = {
				upsert: {
					create: {
						canManageMembers: permissions.canManageMembers ?? false,
						canManageContent: permissions.canManageContent ?? false,
						canManageAccess: permissions.canManageAccess ?? false,
						canViewAnalytics: permissions.canViewAnalytics ?? false,
						customTitle: permissions.customTitle || null,
					},
					update: {
						canManageMembers: permissions.canManageMembers ?? false,
						canManageContent: permissions.canManageContent ?? false,
						canManageAccess: permissions.canManageAccess ?? false,
						canViewAnalytics: permissions.canViewAnalytics ?? false,
						customTitle: permissions.customTitle || null,
					},
				},
			};
		}

		const updatedUser = await (prisma.user as any).update({
			where: { id: targetUserId },
			data,
			include: { adminPermissions: true },
		});

		return ok(updatedUser);

	} catch (error) {
		console.error("Role PATCH Error:", error);
		return err("Internal Server Error", 500);
	}
}

