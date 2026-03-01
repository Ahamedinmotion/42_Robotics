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
							select: { id: true, name: true, login: true, avatar: true, currentRank: true },
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
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isAdmin = ["SECRETARY", "PROJECT_MANAGER", "SOCIAL_MEDIA_MANAGER", "VP", "PRESIDENT"].includes(userRole);
		const isOnTeam = team.members.some((m) => m.userId === userId);

		if (!isAdmin && !isOnTeam) {
			const { conflictFlags, ...publicTeam } = team as any;
			return ok({ ...publicTeam, conflictFlags: [] });
		}

		return ok(team);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
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
		const userRole = session.user.role;

		const body = await req.json();
		const { status } = body;

		if (!status || !Object.values(TeamStatus).includes(status)) {
			return err("Valid team status is required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isAdmin = ["SECRETARY", "PROJECT_MANAGER", "SOCIAL_MEDIA_MANAGER", "VP", "PRESIDENT"].includes(userRole);
		if (team.leaderId !== userId && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can update status", 403);
		}

		const updatedTeam = await prisma.team.update({
			where: { id: teamId },
			data: { status: status as TeamStatus },
		});

		return ok(updatedTeam);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
