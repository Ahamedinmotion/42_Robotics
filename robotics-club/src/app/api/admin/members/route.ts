// GET /api/admin/members
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status, TeamStatus } from "@prisma/client";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const allowedRoles = ["SECRETARY", "VP", "PRESIDENT"];
		if (!allowedRoles.includes(session.user.role)) {
			return err("Forbidden", 403);
		}

		const members = await prisma.user.findMany({
			where: {
				status: Status.ACTIVE,
			},
			orderBy: {
				joinedAt: "asc",
			},
			select: {
				id: true,
				login: true,
				name: true,
				avatar: true,
				role: true,
				currentRank: true,
				joinedAt: true,
				status: true,
				teams: {
					where: {
						team: {
							status: {
								in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
							},
						},
					},
					include: {
						team: {
							select: {
								project: {
									select: { title: true },
								},
								blackholeDeadline: true,
							},
						},
					},
				},
				notifications: {
					where: { readAt: { not: null } },
					orderBy: { readAt: "desc" },
					take: 1,
					select: { readAt: true },
				},
				_count: {
					select: {
						teams: {
							where: {
								team: { status: TeamStatus.COMPLETED },
							},
						},
					},
				},
			},
		});

		const now = new Date();

		const formattedMembers = members.map((u) => {
			const activeTeamData = u.teams[0]?.team || null;
			let daysSinceInteraction = -1;

			if (u.notifications.length > 0 && u.notifications[0].readAt) {
				const diffMs = now.getTime() - u.notifications[0].readAt.getTime();
				daysSinceInteraction = Math.floor(diffMs / (1000 * 60 * 60 * 24));
			}

			const { teams, notifications, ...rest } = u;

			return {
				...rest,
				activeTeam: activeTeamData,
				daysSinceLastInteraction: daysSinceInteraction,
				completedTeamsCount: u._count.teams,
			};
		});

		return ok(formattedMembers);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
