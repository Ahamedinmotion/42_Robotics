import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";
import { ALL_PERMISSIONS } from "@/lib/permissions";

// GET — list all roles
export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const roles = await (prisma as any).dynamicRole.findMany({
			orderBy: { createdAt: "asc" },
			include: {
				_count: { select: { users: true } },
			},
		});

		return ok(roles);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

// POST — create a new custom role
export async function POST(req: Request) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const { name, displayName, isAdmin, permissions } = await req.json();

		if (!name || !displayName) return err("name and displayName are required", 400);

		// Validate name format (uppercase, underscores only)
		if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
			return err("Role name must be uppercase letters, digits, and underscores", 400);
		}

		// Check for existing role
		const existing = await (prisma as any).dynamicRole.findUnique({ where: { name } });
		if (existing) return err("A role with this name already exists", 400);

		// Validate permissions
		const validPerms = (permissions || []).filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));

		const role = await (prisma as any).dynamicRole.create({
			data: {
				name,
				displayName,
				isSystem: false,
				isAdmin: isAdmin ?? true,
				permissions: validPerms,
			},
		});

		return ok(role);
	} catch (error) {
		console.error("Dynamic Role POST Error:", error);
		return err("Internal Server Error", 500);
	}
}
