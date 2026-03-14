import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { calculateScore } from "@/lib/eval-scoring";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { responses, writtenFeedback, durationSeconds, sheetVersion } = await req.json();

		const slot = await (prisma as any).evaluationSlot.findUnique({
			where: { id: params.id },
			include: {
				team: {
					include: {
						project: {
							include: {
								evalSheet: {
									include: {
										sections: {
											include: {
												questions: true,
											},
										},
									},
								} as any,
							},
						},
					},
				},
			},
		});

		if (!slot) return err("Slot not found", 404);
		if ((slot as any).claimedById !== session.user.id) return err("Not your slot to evaluate", 403);
		if (slot.status === "COMPLETED" as any) return err("Already submitted", 400);

		const sheet = (slot as any).team.project.evalSheet;
		if (!sheet) return err("Evaluation rubric not found for this project", 400);

		// Calculate score
		const scoring = calculateScore(sheet, responses);

		// Atomic update
		const result = await prisma.$transaction(async (tx) => {
			// 1. Create evaluation record if it doesn't exist, or update it
			// Usually an Evaluation record is created when a slot is claimed.
			// Let's check for an existing evaluation for this slot.
			let evaluation = await tx.evaluation.findFirst({
				where: { slotId: slot.id }
			});

			if (!evaluation) {
				// This shouldn't happen based on previous flows, but fallback
				evaluation = await tx.evaluation.create({
					data: {
						slotId: slot.id,
						evaluatorId: session.user.id,
						teamId: slot.teamId,
						projectId: slot.team.projectId,
						status: "COMPLETED",
					}
				});
			}

			// 2. Anomaly Detection & Consistency Check
			const previousEval = await (tx as any).evaluation.findFirst({
				where: {
					teamId: slot.teamId,
					sheetVersion: sheetVersion,
					status: "COMPLETED" as any,
				},
				orderBy: { completedAt: "desc" },
			});

			let isAnomaly = false;
			let anomalyNote = null;
			if (previousEval && previousEval.totalScore !== null) {
				const gap = Math.abs(previousEval.totalScore - scoring.totalScore);
				if (gap > 40) {
					isAnomaly = true;
					anomalyNote = `High discrepancy: Previous ${previousEval.totalScore} vs Current ${scoring.totalScore}`;
				}
			}

			// Midnight check
			const now = new Date();
			const isMidnightEval = now.getHours() === 0;

			// 3. Update evaluation with scores and feedback
			const updatedEval = await (tx as any).evaluation.update({
				where: { id: evaluation.id },
				data: {
					status: "COMPLETED",
					totalScore: scoring.totalScore,
					passed: scoring.passed,
					writtenFeedback,
					durationSeconds,
					sheetVersion,
					submittedAt: now,
					completedAt: now,
					isAnomaly,
					anomalyNote,
					isMidnightEval,
				}
			});

			// 3. Save responses
			const responseData = Object.entries(responses).map(([qId, val]) => ({
				evaluationId: evaluation.id,
				questionId: qId,
				value: val as any,
			}));

			await (tx as any).evalResponse.createMany({
				data: responseData
			});

			// 4. Update slot status
			await tx.evaluationSlot.update({
				where: { id: slot.id },
				data: { status: "COMPLETED" as any }
			});

			return updatedEval;
		});

		return ok(result);
	} catch (error) {
		console.error("Submission error:", error);
		return err((error as Error).message, 500);
	}
}
