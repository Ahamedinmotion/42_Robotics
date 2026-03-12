import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

// GET — list all users with roles (for role assignment)
export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const users = await prisma.user.findMany({
			where: {
				status: { not: "WAITLIST" },
			},
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				role: true,
			},
			orderBy: { login: "asc" },
		});

		return ok(users);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

// PATCH — assign a role to a user
export async function PATCH(req: Request) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const body = await req.json();
		const { targetUserId, newRole } = body;

		if (!targetUserId) {
			return err("Target user ID is required", 400);
		}

		const target = await prisma.user.findUnique({
			where: { id: targetUserId },
		});

		if (!target) return err("User not found", 404);

		// Prevent demoting another PRESIDENT for safety
		if (target.role === "PRESIDENT" && auth.user.id !== targetUserId) {
			return err("Cannot modify another President's role.", 403);
		}

		if (newRole) {
			// Validate the role exists in DynamicRole
			const roleExists = await (prisma as any).dynamicRole.findUnique({
				where: { name: newRole },
			});
			if (!roleExists) return err("Invalid role — role does not exist", 400);
		}

		const updatedUser = await prisma.user.update({
			where: { id: targetUserId },
			data: { role: newRole },
			select: { id: true, login: true, name: true, role: true },
		});

		return ok(updatedUser);

	} catch (error) {
		console.error("Role PATCH Error:", error);
		return err("Internal Server Error", 500);
	}
}
