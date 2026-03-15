import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				notifications: {
					where: { type: "PLATFORM_OBSERVATION" },
					orderBy: { createdAt: "desc" },
					take: 1
				},
				_count: {
					select: {
						evaluationsGiven: true,
						teams: { where: { team: { status: "COMPLETED" } } }
					}
				}
			}
		});

		if (!user) return err("User not found", 404);

		// 1-hour rate limit check
		if (user.notifications.length > 0) {
			const lastTime = new Date(user.notifications[0].createdAt).getTime();
			if (Date.now() - lastTime < 3600000) {
				return ok({ skipped: true, reason: "Rate limited" });
			}
		}

		// Generate random observation
		const observations = [
			"The Platform notes your persistence.",
			"Data flow is nominal. Continue your efforts.",
			"You are searching for things that do not wish to be found.",
			`Evaluations: ${user._count.evaluationsGiven}. The registry is pleased.`,
			`Projects: ${user._count.teams}. Level recursion detected.`,
			"The abyss looks back. It is unimpressed.",
			"42.0.0. Connection stable.",
			"Your digital footprint is expanding. Efficiency is advised."
		];
		const text = observations[Math.floor(Math.random() * observations.length)];

		// Create notification
		const notification = await prisma.notification.create({
			data: {
				userId,
				type: "PLATFORM_OBSERVATION",
				title: "THE PLATFORM",
				body: text,
			}
		});

		return ok({ notification });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
