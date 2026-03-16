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
		const { projectId, memberIds = [], status = TeamStatus.FORMING } = body;

		if (!projectId) {
			return err("projectId is required", 400);
		}

		// Ensure current user is in members list if it's an ACTIVE team
		const allMemberIds = Array.from(new Set([session.user.id, ...memberIds]));

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
		});

		if (!user) {
			return err("User not found", 404);
		}

		if (user.status !== Status.ACTIVE) {
			return err("User must be ACTIVE to create a team", 403);
		}

		// Check if any member already has an active team
		const activeMembers = await prisma.teamMember.findMany({
			where: {
				userId: { in: allMemberIds },
				team: {
					status: {
						in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
					},
				},
			},
			include: { user: { select: { login: true } }, team: { select: { projectId: true } } },
		});

		if (activeMembers.length > 0) {
			const existingSameProject = activeMembers.find(m => m.team.projectId === projectId);
			if (existingSameProject) {
				return err(`${existingSameProject.user.login} is already registered for this project`, 400);
			}
			return err(`${activeMembers.map(m => m.user.login).join(", ")} already has an active project`, 400);
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

		if (status === TeamStatus.ACTIVE) {
			if (allMemberIds.length < project.teamSizeMin || allMemberIds.length > project.teamSizeMax) {
				return err(`Team size must be between ${project.teamSizeMin} and ${project.teamSizeMax}`, 400);
			}

			// Validate rank for all members
			const users = await prisma.user.findMany({
				where: { id: { in: allMemberIds } },
				select: { login: true, currentRank: true },
			});

			const ineligible = users.filter(u => {
				const ranks = Object.values(Rank);
				const projectRankIdx = ranks.indexOf(project.rank);
				const userRankIdx = ranks.indexOf(u.currentRank);
				return userRankIdx < projectRankIdx;
			});

			if (ineligible.length > 0) {
				return err(`${ineligible.map(u => u.login).join(", ")} does not have the required rank (${project.rank})`, 400);
			}
		}

		if (project.status !== ProjectStatus.ACTIVE) {
			return err("Project is not ACTIVE", 400);
		}

		const isHighRank = ["B", "A", "S"].includes(project.rank);
		if (isHighRank && project.isUnique && project.teams.length > 0) {
			return err("Project is already claimed by another team", 400);
		}

		// blackholeDeadline
		const blackholeDeadline = new Date();
		blackholeDeadline.setDate(blackholeDeadline.getDate() + project.blackholeDays);

		const team = await prisma.team.create({
			data: {
				projectId: project.id,
				leaderId: user.id,
				status: status,
				rank: user.currentRank,
				blackholeDeadline: status === TeamStatus.ACTIVE ? blackholeDeadline : null,
				activatedAt: status === TeamStatus.ACTIVE ? new Date() : null,
				members: {
					create: allMemberIds.map(id => ({
						userId: id,
						isLeader: id === session.user.id,
					})),
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
								image: true,
								currentRank: true,
							},
						},
					},
				},
			},
		});

		return ok(team);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
