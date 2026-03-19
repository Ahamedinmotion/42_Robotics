import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { NotificationType, Status, TeamStatus } from "@prisma/client";
import { getClubSettings } from "@/lib/club-settings";

// POST /api/evaluations/availability
// Creates AvailabilityWindow(s) and triggers notifications
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { teamId, windows } = await req.json();
		if (!teamId || !windows || !Array.isArray(windows)) {
			return err("teamId and windows array are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: true,
				evaluations: true,
			}
		});

		if (!team) return err("Team not found", 404);
		if (team.leaderId !== session.user.id) return err("Only leader can set availability", 403);

		// --- Cooldown Escalation Logic ---
		const previousEvals = await prisma.evaluation.findMany({
			where: {
				teamId: team.id,
				OR: [
					{ status: "FAILED" },
					{ status: "COMPLETED", passed: false }
				] as any,
			},
			orderBy: { completedAt: "desc" },
		});

		const attemptCount = previousEvals.length + 1;
		const lastEval = previousEvals[0];
		const isAdmin = session.user.role === "ADMIN";
		const isImpersonating = !!(session.user as any).impersonatorId;

		if (attemptCount > 2 && lastEval && !isAdmin && !isImpersonating) {
			const lastDate = new Date(lastEval.completedAt || lastEval.updatedAt);
			const now = new Date();
			const hoursSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
			
			if (attemptCount <= 4 && hoursSinceLast < 24) {
				return err("Cooldown active: 1 day wait required after 2 failed attempts", 403);
			}
			if (attemptCount <= 6 && hoursSinceLast < 72) {
				return err("Cooldown active: 3 day wait required after 4 failed attempts", 403);
			}
			if (attemptCount > 6 && !(team as any).nextAttemptApproved) {
				return err("Maximum failed attempts exceeded. Requires manual approval from VP or President.", 403);
			}
		}

		// 1. Create Windows
		const createdWindows = [];
		for (const w of windows) {
			const start = new Date(w.startTime);
			const end = new Date(w.endTime);

			// Validate 1h minimum
			if (end.getTime() - start.getTime() < 1 * 60 * 60 * 1000) {
				return err("Availability window must be at least 1 hour", 400);
			}

			// Validate no overlap
			const overlap = await (prisma as any).availabilityWindow.findFirst({
				where: {
					teamId,
					isOpen: true,
					OR: [
						{ startTime: { lt: end }, endTime: { gt: start } }
					]
				}
			});
			if (overlap) return err(`Overlap detected for window starting at ${start.toISOString()}`, 400);

			const newWindow = await (prisma as any).availabilityWindow.create({
				data: {
					teamId,
					startTime: start,
					endTime: end,
				}
			});
			createdWindows.push(newWindow);
		}

		// Update team status to EVALUATING if it wasn't already
		if (team.status !== TeamStatus.EVALUATING) {
			await prisma.team.update({
				where: { id: teamId },
				data: { status: TeamStatus.EVALUATING }
			});
		}

		// 2. Trigger Anti-Snipe Notifications (similar to old logic but adapted)
		const settings = await getClubSettings();
		const allUsers = await prisma.user.findMany({ where: { status: Status.ACTIVE } });
		
		const teamInfo = {
			id: team.id,
			members: team.members.map(m => ({ userId: m.userId })),
			evaluations: team.evaluations,
		};
		const projectInfo = {
			id: team.project.id,
			rank: team.project.rank,
		};

		const antiSnipeBaseSeconds = settings.antiSnipeMinutes * 60;
		const antiSnipeMaxSeconds = antiSnipeBaseSeconds * 3;

		for (const user of allUsers) {
			const isEligible = isEligibleEvaluator(user as any, teamInfo, projectInfo);
			if (isEligible) {
				const randomDelay = Math.floor(Math.random() * (antiSnipeMaxSeconds - antiSnipeBaseSeconds + 1) + antiSnipeBaseSeconds);
				const deliverAt = new Date(Date.now() + randomDelay * 1000);

				await prisma.notification.create({
					data: {
						userId: user.id,
						type: NotificationType.EVAL_SLOT_AVAILABLE,
						title: "New Availability Opened",
						body: `Squad ${(team as any).name || 'Unnamed'} is available for ${team.project.title} evaluations.`,
						actionUrl: `/cursus/projects/${team.project.id}`,
						deliverAt,
					}
				});
			}
		}

		return ok({ windows: createdWindows });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

// GET /api/evaluations/availability?teamId=...
// Returns all windows for a team with anonymized claimer info
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const teamId = searchParams.get("teamId");
		if (!teamId) return err("teamId is required", 400);

		const windows = await (prisma as any).availabilityWindow.findMany({
			where: { teamId, isOpen: true },
			include: {
				slots: {
					include: {
						claimedBy: {
							select: {
								id: true,
								login: true,
								name: true,
								image: true,
							}
						}
					}
				}
			},
			orderBy: { startTime: "asc" }
		});

		// Anonymization Logic
		const now = new Date();
		const anonymizedWindows = windows.map((w: any) => ({
			...w,
			slots: w.slots.map((s: any) => {
				const revealingIn = s.slotStart.getTime() - now.getTime() - (15 * 60 * 1000);
				const shouldReveal = revealingIn <= 0;

				return {
					...s,
					claimedBy: s.claimedBy ? (shouldReveal ? s.claimedBy : { login: "████████", revealingIn }) : null
				};
			})
		}));

		return ok(anonymizedWindows);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
