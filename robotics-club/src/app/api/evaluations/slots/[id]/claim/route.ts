// POST /api/evaluations/slots/[id]/claim
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { EvaluationStatus, NotificationType, Rank } from "@prisma/client";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const slotId = params.id;
		const userId = session.user.id;

		// Run atomically with transaction to avoid double booking
		const evaluation = await prisma.$transaction(async (tx) => {
			const slot = await tx.evaluationSlot.findUnique({
				where: { id: slotId },
				include: {
					team: {
						include: {
							project: true,
							members: true,
							evaluations: { select: { evaluatorId: true } },
						},
					},
					evaluations: {
						include: {
							evaluator: {
								select: { id: true, role: true, currentRank: true },
							},
						},
					},
				},
			});

			if (!slot) {
				throw new Error("Evaluation slot not found");
			}

			if (slot.status !== "OPEN") {
				throw new Error("This evaluation slot is no longer open");
			}

			const user = await tx.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				throw new Error("User not found");
			}

			// Check anti-snipe: find a notification tied to this specific slot
			const notification = await tx.notification.findFirst({
				where: {
					userId: userId,
					type: NotificationType.EVAL_SLOT_AVAILABLE,
					actionUrl: `/cursus?slotId=${slotId}`,
					deliverAt: { lte: new Date() },
				},
			});

			if (!notification) {
				throw new Error("Evaluation slot not yet available");
			}

			// Check generic eligibility
			const teamInfo = {
				id: slot.team.id,
				members: slot.team.members.map((m) => ({ userId: m.userId })),
				evaluations: slot.team.evaluations,
			};

			const projectInfo = {
				id: slot.team.project.id,
				rank: slot.team.project.rank,
			};

			const evaluatorInfo = {
				id: user.id,
				currentRank: user.currentRank,
				role: user.role,
			};

			const isEligible = isEligibleEvaluator(evaluatorInfo, teamInfo, projectInfo);
			if (!isEligible) {
				throw new Error("You are not eligible to claim this evaluation");
			}

			// --- Staff / peer eval enforcement ---
			const isHighRank = slot.team.project.rank === Rank.A || slot.team.project.rank === Rank.S;

			// Count existing peer and staff evals on this slot
			let peerEvalCount = 0;
			let staffEvalCount = 0;
			for (const existingEval of slot.evaluations) {
				if (existingEval.evaluator.role === "STUDENT") {
					peerEvalCount++;
				} else {
					staffEvalCount++;
				}
			}

			const isCurrentUserStaff = user.role !== "STUDENT";

			if (isHighRank) {
				// A/S rank: max 2 peer + 1 staff = 3 total
				if (isCurrentUserStaff) {
					if (staffEvalCount >= 1) {
						throw new Error("Staff evaluation slot is already filled");
					}
				} else {
					if (peerEvalCount >= 2) {
						throw new Error("Peer evaluation slots are already filled");
					}
				}
				if (slot.evaluations.length >= 3) {
					throw new Error("Maximum evaluations for this slot have already been claimed");
				}
			} else {
				// All other ranks: max 2 peer evals, no staff eval
				if (peerEvalCount >= 2) {
					throw new Error("Peer evaluation slots are already filled");
				}
				if (slot.evaluations.length >= 2) {
					throw new Error("Maximum evaluations for this slot have already been claimed");
				}
			}

			// Create the evaluation
			const newEval = await tx.evaluation.create({
				data: {
					teamId: slot.teamId,
					projectId: slot.team.project.id,
					evaluatorId: userId,
					slotId: slot.id,
					status: EvaluationStatus.PENDING,
					claimedAt: new Date(),
				},
			});

			// Determine if slot should be marked FILLED
			const totalAfterClaim = slot.evaluations.length + 1;
			const maxClaimed = isHighRank ? 3 : 2;
			if (totalAfterClaim >= maxClaimed) {
				await tx.evaluationSlot.update({
					where: { id: slot.id },
					data: { status: "FILLED" },
				});
			}

			return newEval;
		});

		return ok(evaluation);
	} catch (error: unknown) {
		const statusMap: Record<string, number> = {
			"Evaluation slot not yet available": 403,
			"Forbidden": 403,
			"You are not eligible to claim this evaluation": 403,
			"Evaluation slot not found": 404,
		};
		const errorMessage = (error as Error).message.replace(/^Error: /, "");
		const status = statusMap[errorMessage] || 400;

		return err(errorMessage, status);
	}
}
