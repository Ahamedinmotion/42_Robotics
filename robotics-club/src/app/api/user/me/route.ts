// GET /api/user/me
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

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			include: {
				skillProgress: true,
				achievements: {
					include: {
						achievement: true,
					},
				},
				_count: {
					select: {
						evaluationsGiven: true,
						notifications: true,
					},
				},
			},
		});

		if (!user) {
			return err("User not found", 404);
		}

		return ok(user);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const body = await req.json();
		const { equippedTitle } = body;

		// Verify user actually has this achievement if it's a title from one
		if (equippedTitle) {
			const hasAchievement = await prisma.userAchievement.findFirst({
				where: {
					userId: session.user.id,
					achievement: { title: equippedTitle },
				},
			});
			if (!hasAchievement && equippedTitle !== "") {
				return err("You haven't unlocked this title yet", 403);
			}
		}

		const updated = await prisma.user.update({
			where: { id: session.user.id },
			data: { equippedTitle },
		});

		return ok(updated);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
