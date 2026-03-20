import prisma from "@/lib/prisma";

// ── Master permission keys ──────────────────────
export const ALL_PERMISSIONS = [
	"ALL",
	"CAN_IMPERSONATE",
	"CAN_SEND_ANNOUNCEMENTS",
	"CAN_MANAGE_MEMBERS",
	"CAN_MANAGE_WAITLIST",
	"CAN_EXTEND_DEADLINES",
	"CAN_APPROVE_FABRICATION",
	"CAN_APPROVE_MATERIALS",
	"CAN_APPROVE_PROPOSALS",
	"CAN_RESOLVE_CONFLICTS",
	"CAN_MANAGE_DAMAGE",
	"CAN_MANAGE_PROJECTS",
	"CAN_MANAGE_LAB_ACCESS",
	"CAN_VIEW_ANALYTICS",
	"CAN_EDIT_CONTENT",
	"CAN_MANAGE_ROLES",
	"CAN_MANAGE_CLUB_SETTINGS",
	"CAN_MANAGE_ANNOUNCEMENTS",
	"CAN_OVERRIDE_EVALUATIONS",
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

// ── Helpers ─────────────────────────────────────

/** Get the permission keys for a user's role. President always gets ALL. */
export async function getUserPermissions(userId: string): Promise<string[]> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});
	if (!user) return [];

	// President always has every permission
	if (user.role === "PRESIDENT") return [...ALL_PERMISSIONS];

	const dynamicRole = await (prisma as any).dynamicRole.findUnique({
		where: { name: user.role },
	});

	return dynamicRole?.permissions ?? [];
}

/** Get permissions from a role name directly. */
export async function getRolePermissions(roleName: string): Promise<string[]> {
	if (roleName === "PRESIDENT") return [...ALL_PERMISSIONS];

	const dynamicRole = await (prisma as any).dynamicRole.findUnique({
		where: { name: roleName },
	});

	return dynamicRole?.permissions ?? [];
}

/** Check if a role is admin (has dashboard access). */
export async function isRoleAdmin(roleName: string): Promise<boolean> {
	if (roleName === "PRESIDENT") return true;

	const dynamicRole = await (prisma as any).dynamicRole.findUnique({
		where: { name: roleName },
	});

	return dynamicRole?.isAdmin ?? false;
}

/** Check if a permissions array includes a specific key. */
export function hasPermission(permissions: string[], key: string): boolean {
	return permissions.includes("ALL") || permissions.includes(key);
}

/** Check if a permissions array includes any of the given keys. */
export function hasAnyPermission(permissions: string[], keys: string[]): boolean {
	return permissions.includes("ALL") || keys.some((k) => permissions.includes(k));
}
