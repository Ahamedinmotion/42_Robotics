// POST /api/teams
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { ProjectStatus, Rank, Status, TeamStatus } from "@prisma/client";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { projectId } = body;

		if (!projectId) {
			return err("projectId is required", 400);
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			include: {
				teams: {
					where: {
						team: {
							status: {
								in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
							},
						},
					},
				},
			},
		});

		if (!user) {
			return err("User not found", 404);
		}

		if (user.status !== Status.ACTIVE) {
			return err("User must be ACTIVE to create a team", 403);
		}

		if (user.teams.length > 0) {
			return err("User is already in an active team", 400);
		}

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				teams: {
					where: {
						status: {
							in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING, TeamStatus.COMPLETED],
						},
					},
				},
			},
		});

		if (!project) {
			return err("Project not found", 404);
		}

		if (project.status !== ProjectStatus.ACTIVE) {
			return err("Project is not ACTIVE", 400);
		}

		const isHighRank = ["B", "A", "S"].includes(project.rank);
		if (isHighRank && project.isUnique && project.teams.length > 0) {
			return err("Project is already claimed by another team", 400);
		}

		// blackholeDeadline is now + blackholeDays 
		const blackholeDeadline = new Date();
		blackholeDeadline.setDate(blackholeDeadline.getDate() + project.blackholeDays);

		const team = await prisma.team.create({
			data: {
				projectId: project.id,
				leaderId: user.id,
				status: TeamStatus.FORMING,
				rank: user.currentRank,
				blackholeDeadline: blackholeDeadline,
				members: {
					create: {
						userId: user.id,
						isLeader: true,
					},
				},
			},
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								login: true,
								avatar: true,
								currentRank: true,
							},
						},
					},
				},
			},
		});

		return ok(team);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
