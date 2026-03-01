// GET /api/user/[id]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const userId = params.id;

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				login: true,
				name: true,
				avatar: true,
				currentRank: true,
				status: true,
				joinedAt: true,
				githubHandle: true,
				skillProgress: true,
				achievements: {
					include: {
						achievement: true,
					},
				},
				teams: {
					where: {
						team: {
							status: TeamStatus.COMPLETED,
						},
					},
					include: {
						team: {
							select: {
								project: {
									select: {
										title: true,
										rank: true,
									},
								},
							},
						},
					},
				},
				_count: {
					select: {
						evaluationsGiven: true,
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
