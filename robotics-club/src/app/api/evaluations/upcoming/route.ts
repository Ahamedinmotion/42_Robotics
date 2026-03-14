import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTacticalMask, getIdentityRevealStatus } from "@/lib/utils/evaluation-utils";
import { SlotStatus } from "@prisma/client";

// GET /api/evaluations/upcoming
// Returns evaluator's claimed slots and team's incoming evaluators
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;

		// 1. Fetch slots this user is evaluating
		const giving = await (prisma as any).evaluationSlot.findMany({
			where: {
				claimedById: userId,
				status: (SlotStatus as any).CLAIMED || "CLAIMED",
				slotEnd: { gt: new Date() } // hasn't ended yet
			},
			include: {
				team: {
					include: {
						project: { select: { title: true, rank: true } },
						leader: { select: { login: true, name: true, image: true } }
					}
				}
			},
			orderBy: { slotStart: "asc" }
		});

		// 2. Fetch slots where this user's team is being evaluated
		const teamMember = await prisma.teamMember.findFirst({
			where: { userId, team: { status: { notIn: ["COMPLETED"] } } }, // Removed ABANDONED as it doesn't exist
			select: { teamId: true }
		});

		let receiving = [];
		if (teamMember) {
			receiving = await (prisma as any).evaluationSlot.findMany({
				where: {
					teamId: teamMember.teamId,
					status: (SlotStatus as any).CLAIMED || "CLAIMED",
					slotEnd: { gt: new Date() }
				},
				include: {
					claimedBy: { select: { login: true, name: true, image: true } },
					team: {
						include: {
							project: { select: { title: true, rank: true } }
						}
					}
				},
				orderBy: { slotStart: "asc" }
			});
		}

		// Apply Identity Reveal Logic
		const processSlot = (slot: any, targetUser: any) => {
			const { shouldReveal, isImminent, isInProgress, remainingMins } = getIdentityRevealStatus(new Date(slot.slotStart));
			
			let label = "";
			if (!shouldReveal) {
				const adjective = getTacticalMask(targetUser?.login || slot.id);
				label = `a ${adjective} colleague`;
			} else {
				label = targetUser?.login || "Unknown";
			}

			return {
				...slot,
				revealStatus: { shouldReveal, isImminent, isInProgress, remainingMins },
				maskedIdentity: label,
				revealAt: new Date(new Date(slot.slotStart).getTime() - 15 * 60 * 1000)
			};
		};

		return ok({
			giving: giving.map((s: any) => processSlot(s, s.team.leader)),
			receiving: receiving.map((s: any) => processSlot(s, (s as any).claimedBy))
		});
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
