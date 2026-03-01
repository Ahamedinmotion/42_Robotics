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
				teams: {
					include: {
						team: {
							include: {
								project: true,
							},
						},
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
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
