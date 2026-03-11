// POST and DELETE /api/teams/[id]/members
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status, TeamStatus } from "@prisma/client";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;
		const body = await req.json();
		const { userId } = body;

		if (!userId) {
			return err("userId is required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: { include: { user: true } },
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		if (team.status !== TeamStatus.FORMING) {
			return err("Team must be in FORMING status to add members", 400);
		}

		const isAdmin = ["SECRETARY", "PROJECT_MANAGER", "SOCIAL_MEDIA_MANAGER", "VP", "PRESIDENT"].includes(session.user.role);
		if (team.leaderId !== session.user.id && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can add members", 403);
		}

		if (team.members.some((m) => m.userId === userId)) {
			return err("User is already a member of this team", 400);
		}

		if (team.members.length >= team.project.teamSizeMax) {
			return err("Team is already at maximum capacity", 400);
		}

		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				teams: {
					where: {
						team: {
							status: { in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING] },
						},
					},
				},
			},
		});

		if (!targetUser) {
			return err("Target user not found", 404);
		}

		if (targetUser.status !== Status.ACTIVE) {
			return err("Target user must be ACTIVE", 400);
		}

		if (targetUser.teams.length > 0) {
			return err("Target user is already in an active team", 400);
		}

		// Check team history to see if they worked together before
		const hasWorkedTogether = await prisma.teamMember.findFirst({
			where: {
				userId: userId,
				team: {
					members: {
						some: { userId: session.user.id },
					},
				},
			},
		});

		await prisma.teamMember.create({
			data: {
				teamId: team.id,
				userId: userId,
				isLeader: false,
			},
		});

		const updatedMembers = await prisma.teamMember.findMany({
			where: { teamId: team.id },
			include: {
				user: {
					select: { id: true, name: true, login: true, image: true, currentRank: true },
				},
			},
		});

		return ok({ members: updatedMembers, hasWorkedTogether: !!hasWorkedTogether });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
