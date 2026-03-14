import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { NotificationType, SlotStatus } from "@prisma/client";

// POST /api/evaluations/slots/[windowId]/claim
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const windowId = params.id;
		const { slotStart, slotEnd } = await req.json();

		if (!slotStart || !slotEnd) {
			return err("slotStart and slotEnd are required", 400);
		}

		// 1. Fetch Window and Team
		const window = await (prisma as any).availabilityWindow.findUnique({
			where: { id: windowId, isOpen: true },
			include: {
				team: {
					include: {
						project: true,
						members: true,
						evaluations: true,
					}
				}
			}
		});

		if (!window) return err("Availability window not found or closed", 404);

		// 2. Validate Evaluator Eligibility
		const user = await prisma.user.findUnique({
			where: { id: session.user.id }
		});
		if (!user) return err("User not found", 404);

		const teamInfo = {
			id: window.team.id,
			members: window.team.members.map((m: any) => ({ userId: m.userId })),
			evaluations: window.team.evaluations,
		};
		const projectInfo = {
			id: window.team.project.id,
			rank: window.team.project.rank,
		};

		const isEligible = isEligibleEvaluator(user as any, teamInfo, projectInfo);
		if (!isEligible) return err("You are not eligible to evaluate this mission", 403);

		// 3. Validate Time Window
		const start = new Date(slotStart);
		const end = new Date(slotEnd);

		if (start < window.startTime || end > window.endTime) {
			return err("Requested slot is outside the availability window", 400);
		}

		// Validate 2h duration
		if (end.getTime() - start.getTime() !== 2 * 60 * 60 * 1000) {
			return err("Evaluation slots must be exactly 2 hours", 400);
		}

		// 5. Check for Overlaps
		const overlappingClaim = await (prisma as any).evaluationSlot.findFirst({
			where: {
				claimedById: user.id,
				status: (SlotStatus as any).CLAIMED || "CLAIMED",
				OR: [
					{ slotStart: { lt: end }, slotEnd: { gt: start } }
				]
			}
		});
		if (overlappingClaim) return err("You already have a claimed evaluation overlapping this time", 400);

		// 6. Create the EvaluationSlot
		const slot = await (prisma as any).evaluationSlot.create({
			data: {
				availabilityWindowId: windowId,
				teamId: window.teamId,
				slotStart: start,
				slotEnd: end,
				claimedById: user.id,
				claimedAt: new Date(),
				status: (SlotStatus as any).CLAIMED || "CLAIMED",
			}
		});

		// 7. Notify Team Leader
		await (prisma as any).notification.create({
			data: {
				userId: window.team.leaderId,
				type: (NotificationType as any).EVAL_SLOT_CLAIMED || "GENERAL",
				title: "Evaluation Claimed",
				body: `Someone has claimed a 2-hour window for your mission evaluation starting at ${start.toLocaleTimeString()}.`,
				actionUrl: `/cursus/projects/${window.team.projectId}/cockpit`,
			}
		});

		return ok(slot);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
