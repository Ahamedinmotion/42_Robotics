import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// POST — dismiss an announcement for the current user
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { announcementId } = await req.json();
		if (!announcementId) return err("announcementId is required", 400);

		// Check announcement exists
		const announcement = await (prisma as any).announcement.findUnique({
			where: { id: announcementId },
		});
		if (!announcement) return err("Announcement not found", 404);

		// Upsert dismissal (idempotent)
		await (prisma as any).announcementDismissal.upsert({
			where: {
				announcementId_userId: {
					announcementId,
					userId: session.user.id,
				},
			},
			update: {},
			create: {
				announcementId,
				userId: session.user.id,
			},
		});

		return ok({ success: true });
	} catch (error) {
		console.error("Dismiss Announcement Error:", error);
		return err("Internal Server Error", 500);
	}
}
