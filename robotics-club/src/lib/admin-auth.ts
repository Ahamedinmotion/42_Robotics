import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { err } from "@/lib/api";

const ADMIN_ROLES = [
	"SECRETARY",
	"PROJECT_MANAGER",
	"SOCIAL_MEDIA_MANAGER",
	"VP",
	"PRESIDENT",
];

export async function requireAdmin(allowedRoles: string[]) {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		return err("Unauthorized", 401);
	}

	if (!allowedRoles.includes(session.user.role)) {
		return err("Forbidden — insufficient role", 403);
	}

	return { user: session.user };
}

export function isAdminRole(role: string) {
	return ADMIN_ROLES.includes(role);
}
