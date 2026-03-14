// GET and POST /api/teams/[id]/reports
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

		const reports = await prisma.weeklyReport.findMany({
			where: { teamId },
			orderBy: { weekNumber: "asc" },
			include: {
				submittedBy: {
					select: { id: true, name: true, login: true, image: true },
				},
			},
		});

		return ok(reports);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

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
		const { 
			weekNumber, 
			summary, 
			contributionNotes, 
			photoUrls, 
			readmeUpdated, 
			blockersNotes,
			isMilestone,
			milestoneTitle,
			hoursLogged,
			mood,
			nextWeekPlan
		} = body;

		if (!weekNumber || !summary) {
			return err("weekNumber and summary are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isMember = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});

		if (!isMember) {
			return err("Forbidden. Only team members can submit weekly reports", 403);
		}

		if (![TeamStatus.ACTIVE, TeamStatus.EVALUATING].includes(team.status as any)) {
			return err("Team must be ACTIVE or EVALUATING to submit reports", 400);
		}

		const existingReport = await prisma.weeklyReport.findUnique({
			where: {
				teamId_weekNumber: {
					teamId,
					weekNumber: Number(weekNumber),
				},
			},
		});

		if (existingReport) {
			return err(`A report already exists for week ${weekNumber}`, 400);
		}

		const report = await prisma.weeklyReport.create({
			data: {
				teamId,
				submittedById: session.user.id,
				weekNumber: Number(weekNumber),
				summary,
				contributionNotes: contributionNotes || {},
				photoUrls: photoUrls || [],
				readmeUpdated: Boolean(readmeUpdated),
				blockersNotes,
				isMilestone: Boolean(isMilestone),
				milestoneTitle,
				hoursLogged: hoursLogged ? parseFloat(hoursLogged) : null,
				mood,
				nextWeekPlan,
			},
		});

		return ok(report);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
