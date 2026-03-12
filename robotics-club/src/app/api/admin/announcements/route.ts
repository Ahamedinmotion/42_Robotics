import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission, requireAnyPermission } from "@/lib/admin-auth";

// GET — list all announcements (for admin management)
export async function GET() {
	try {
		const auth = await requireAnyPermission(["CAN_SEND_ANNOUNCEMENTS", "CAN_MANAGE_ANNOUNCEMENTS"]);
		if (auth instanceof Response) return auth;

		const announcements = await (prisma as any).announcement.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				createdBy: { select: { login: true, name: true } },
				_count: { select: { dismissals: true } },
			},
		});

		return ok(announcements);
	} catch (error) {
		console.error("Announcements GET Error:", error);
		return err("Internal Server Error", 500);
	}
}

// POST — create a new announcement
export async function POST(req: Request) {
	try {
		const auth = await requirePermission("CAN_SEND_ANNOUNCEMENTS");
		if (auth instanceof Response) return auth;

		const { title, body, expiresAt } = await req.json();

		if (!title || !body || !expiresAt) {
			return err("title, body, and expiresAt are required", 400);
		}

		const expiry = new Date(expiresAt);
		if (isNaN(expiry.getTime()) || expiry <= new Date()) {
			return err("expiresAt must be a valid future date", 400);
		}

		const announcement = await (prisma as any).announcement.create({
			data: {
				title,
				body,
				expiresAt: expiry,
				createdById: auth.user.id,
			},
		});

		return ok(announcement, 201);
	} catch (error) {
		console.error("Announcement POST Error:", error);
		return err("Internal Server Error", 500);
	}
}
