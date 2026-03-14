import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const evaluation = await prisma.evaluation.findUnique({
			where: { id: params.id },
			include: {
				evaluator: {
					select: {
						id: true,
						login: true,
						name: true,
						image: true,
						currentRank: true,
					},
				},
				team: {
					include: {
						members: true,
					},
				},
				feedback: {
					where: { fromRole: "TEAM_MEMBER" as any },
				},
			},
		});

		if (!evaluation) return err("Evaluation not found", 404);

		// Authorization: Only team members or the evaluator or admin can see results
		const isTeamMember = (evaluation as any).team.members.some((m: any) => m.userId === session.user.id);
		const isEvaluator = evaluation.evaluatorId === session.user.id;
		const isAdmin = (session.user as any).isAdmin;

		if (!isTeamMember && !isEvaluator && !isAdmin) {
			return err("Forbidden", 403);
		}

		// Disclosure Policy: If team member, must have submitted feedback OR 24h passed
		if (isTeamMember && !isAdmin) {
			const hasSubmittedFeedback = (evaluation as any).feedback.length > 0;
			const timeSinceCompletion = Date.now() - new Date(evaluation.completedAt || evaluation.updatedAt).getTime();
			const twentyFourHours = 24 * 60 * 60 * 1000;

			if (!hasSubmittedFeedback && timeSinceCompletion < twentyFourHours) {
				return err("Feedback required before viewing results", 403);
			}
		}

		// Count attempts for this project
		const attemptCount = await prisma.evaluation.count({
			where: {
				teamId: evaluation.teamId,
				projectId: (evaluation as any).projectId,
				status: { in: ["COMPLETED", "FAILED"] as any },
			},
		});

		return ok({ ...evaluation, attemptCount });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
