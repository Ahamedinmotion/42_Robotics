import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";
import { ALL_PERMISSIONS } from "@/lib/permissions";

// PATCH — update a custom role's name, permissions, or admin flag
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const role = await (prisma as any).dynamicRole.findUnique({ where: { name: params.id } });
		if (!role) return err("Role not found", 404);

		// Safety first: Nobody (not even President) can modify the President role itself via API
		if (role.name === "PRESIDENT") return err("The President role is immutable for system safety", 403);

		// System roles are normally protected, but the President can override them
		if (role.isSystem && auth.user.role !== "PRESIDENT") {
			return err("System roles can only be modified by the President", 403);
		}

		const body = await req.json();
		const data: any = {};

		if (body.displayName) data.displayName = body.displayName;
		if (body.isAdmin !== undefined) data.isAdmin = Boolean(body.isAdmin);
		if (body.permissions) {
			data.permissions = body.permissions.filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));
		}

		const updated = await (prisma as any).dynamicRole.update({
			where: { name: params.id },
			data,
		});

		return ok(updated);
	} catch (error) {
		console.error("Dynamic Role PATCH Error:", error);
		return err("Internal Server Error", 500);
	}
}

// DELETE — delete a custom role (reassign users to STUDENT)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const role = await (prisma as any).dynamicRole.findUnique({ where: { name: params.id } });
		if (!role) return err("Role not found", 404);

		// Safety first: Cannot delete critical roles
		if (role.name === "PRESIDENT" || role.name === "STUDENT") {
			return err(`The ${role.name} role is required for system operation and cannot be deleted`, 403);
		}

		// System roles can only be deleted by the President
		if (role.isSystem && auth.user.role !== "PRESIDENT") {
			return err("System roles can only be deleted by the President", 403);
		}

		// Reassign all users with this role to STUDENT
		await prisma.user.updateMany({
			where: { role: params.id },
			data: { role: "STUDENT" },
		});

		await (prisma as any).dynamicRole.delete({ where: { name: params.id } });

		return ok({ success: true });
	} catch (error) {
		console.error("Dynamic Role DELETE Error:", error);
		return err("Internal Server Error", 500);
	}
}
