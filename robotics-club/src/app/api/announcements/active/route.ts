import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// GET — active announcements (not expired, not dismissed by current user)
export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const now = new Date();
		const userId = session.user.id;

		const announcements = await (prisma as any).announcement.findMany({
			where: {
				expiresAt: { gt: now },
				dismissals: {
					none: { userId },
				},
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				title: true,
				body: true,
				createdAt: true,
				expiresAt: true,
			},
		});

		return ok(announcements);
	} catch (error) {
		console.error("Active Announcements Error:", error);
		return err("Internal Server Error", 500);
	}
}
