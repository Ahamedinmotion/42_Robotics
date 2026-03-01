// GET /api/notifications
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const userId = session.user.id;
		const now = new Date();

		const notifications = await prisma.notification.findMany({
			where: {
				userId,
				deliverAt: {
					lte: now,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const unreadCount = notifications.filter((n) => !n.readAt).length;

		return ok({ notifications, unreadCount });
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
