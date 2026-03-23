// POST /api/evaluations/slots
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { NotificationType, Status, TeamStatus } from "@prisma/client";
import { getClubSettings } from "@/lib/club-settings";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { teamId, availableWindows } = body;

		if (!teamId || !availableWindows || !Array.isArray(availableWindows)) {
			return err("teamId and valid availableWindows array are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: true,
				evaluationSlots: {
					where: { status: "OPEN" },
				},
				evaluations: {
					select: { evaluatorId: true }, // get past evaluators
				},
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		if (team.leaderId !== session.user.id) {
			return err("Forbidden. Only the team leader can create evaluation slots", 403);
		}

		if (team.status !== TeamStatus.EVALUATING) {
			return err("Team must be in EVALUATING status to open slots", 400);
		}

		if (team.evaluationSlots.length > 0) {
			return err("An OPEN evaluation slot already exists for this team", 400);
		}

		const window = await prisma.availabilityWindow.create({
			data: {
				teamId,
				startTime: new Date(),
				endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week valid window
				isOpen: true,
			}
		});

		// Create the OPEN evaluation slot
		const slot = await prisma.evaluationSlot.create({
			data: {
				teamId,
				availabilityWindowId: window.id,
				slotStart: new Date(),
				slotEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				status: "OPEN",
			},
		});

		// Notify eligible evaluators
		// 1. Fetch all ACTIVE users
		const allUsers = await prisma.user.findMany({
			where: { status: Status.ACTIVE },
		});

		// Map the team object structurally for the eligibility helper
		const teamInfo = {
			id: team.id,
			members: team.members.map(m => ({ userId: m.userId })),
			evaluations: team.evaluations,
		};

		const projectInfo = {
			id: team.project.id,
			rank: team.project.rank,
		};

		const settings = await getClubSettings();
		const antiSnipeBaseSeconds = settings.antiSnipeMinutes * 60;
		const antiSnipeMaxSeconds = antiSnipeBaseSeconds * 3;

		let eligibleCount = 0;

		for (const user of allUsers) {
			const evaluatorInfo = {
				id: user.id,
				currentRank: user.currentRank,
				role: user.role,
			};

			const isEligible = isEligibleEvaluator(evaluatorInfo, teamInfo, projectInfo);

			if (isEligible) {
				// Anti-snipe delay based on configured minutes
				const randomSecondsDelay = Math.floor(Math.random() * (antiSnipeMaxSeconds - antiSnipeBaseSeconds + 1) + antiSnipeBaseSeconds);
				const deliverAt = new Date(Date.now() + randomSecondsDelay * 1000);

				await prisma.notification.create({
					data: {
						userId: user.id,
						type: NotificationType.EVAL_SLOT_AVAILABLE,
						title: "New Evaluation Available",
						body: `A new evaluation slot is available for ${team.project.title}.`,
						actionUrl: `/cursus?slotId=${slot.id}`,
						isPush: true,
						deliverAt,
					},
				});
				eligibleCount++;
			}
		}

		return ok({ slot, eligibleCount });
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
