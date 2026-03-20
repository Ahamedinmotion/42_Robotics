import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { err } from "@/lib/api";
import { getRolePermissions, hasAnyPermission, hasPermission, isRoleAdmin } from "@/lib/permissions";

/**
 * Require a specific permission key. Returns { user, permissions } or a Response error.
 */
export async function requirePermission(permissionKey: string) {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		return err("Unauthorized", 401);
	}

	const permissions = session.user.permissions as string[] | undefined;

	if (!permissions || !hasPermission(permissions, permissionKey)) {
		return err("Forbidden — insufficient permissions", 403);
	}

	return { user: session.user, permissions };
}

/**
 * Check if user has admin dashboard access. Uses the session permissions array.
 */
export function isAdminRole(role: string): boolean {
	// For middleware/layout which can't async-fetch, we check role name.
	// System admin roles are any non-STUDENT role that has isAdmin=true.
	// This is a sync fallback; the real check is session.user.isAdmin.
	return role !== "STUDENT";
}

/**
 * Legacy-compatible: require any of the given permission keys.
 */
export async function requireAnyPermission(permissionKeys: string[]) {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		return err("Unauthorized", 401);
	}

	const permissions = session.user.permissions as string[] | undefined;
	
	if (!permissions || !hasAnyPermission(permissions, permissionKeys)) {
		return err("Forbidden — insufficient permissions", 403);
	}

	return { user: session.user, permissions };
}
