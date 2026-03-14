// GET and PATCH /api/teams/[id]
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

		const teamId = params.id;
		const userId = session.user.id;
		const userRole = session.user.role;

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: {
					include: {
						user: {
							select: { id: true, name: true, login: true, image: true, currentRank: true },
						},
					},
				},
				weeklyReports: {
					orderBy: { weekNumber: "asc" },
				},
				evaluationSlots: {
					include: {
						evaluations: true,
					},
				},
				materialRequests: true,
				fabricationRequests: true,
				damageReports: true,
				conflictFlags: true,
				scratchpad: {
					include: {
						lastEditedBy: {
							select: { login: true }
						}
					}
				},
				extensionRequests: true,
				disputes: true,
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isAdmin = !!(session.user as any).isAdmin;
		const isOnTeam = team.members.some((m) => m.userId === userId);

		if (!isAdmin && !isOnTeam) {
			const { conflictFlags, scratchpad, extensionRequests, disputes, ...publicTeam } = team as any;
			return ok({ ...publicTeam, conflictFlags: [], scratchpad: null, extensionRequests: [], disputes: [] });
		}

		return ok(team);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;
		const userId = session.user.id;

		const body = await req.json();
		const { status, name, repoUrl } = body;

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isAdmin = !!(session.user as any).isAdmin;
		if (team.leaderId !== userId && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can update team details", 403);
		}

		let firstEverCompletion = false;
		const updateData: any = {};

		if (status) {
			if (!Object.values(TeamStatus).includes(status)) {
				return err("Valid team status is required", 400);
			}
			updateData.status = status as TeamStatus;

			if (status === TeamStatus.COMPLETED) {
				const project = await prisma.project.findUnique({
					where: { id: team.projectId },
					select: { hasBeenCompleted: true },
				});
				if (project && !project.hasBeenCompleted) {
					firstEverCompletion = true;
					await prisma.project.update({
						where: { id: team.projectId },
						data: { hasBeenCompleted: true },
					});
				}
			}
		}

		if (name !== undefined) updateData.name = name;
		if (repoUrl !== undefined) updateData.repoUrl = repoUrl;

		const updatedTeam = await prisma.team.update({
			where: { id: teamId },
			data: updateData,
		});

		return ok({ ...updatedTeam, _firstEverCompletion: firstEverCompletion });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
