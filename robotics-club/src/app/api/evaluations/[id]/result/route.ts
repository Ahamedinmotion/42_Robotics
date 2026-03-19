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
					where: { fromRole: "TEAM" as any },
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
		// EXCEPT: The evaluator can always see the results they submitted.
		if (isTeamMember && !isEvaluator && !isAdmin) {
			const hasSubmittedFeedback = (evaluation as any).feedback.length > 0;
			const timeSinceCompletion = Date.now() - new Date(evaluation.completedAt || evaluation.updatedAt).getTime();
			const twentyFourHours = 24 * 60 * 60 * 1000;

			if (!hasSubmittedFeedback && timeSinceCompletion < twentyFourHours) {
				return err("Feedback required before viewing results", 403);
			}
		}

		// Count COMPLETED evaluations for this team/project to determine if it's the final one
		const completedCount = await prisma.evaluation.count({
			where: {
				teamId: evaluation.teamId,
				projectId: (evaluation as any).projectId,
				status: "COMPLETED" as any,
			},
		});

		// isFinal is true if there are at least 1 completed evaluation before this one (so this is 2nd+)
		// Or we can base it on a specific count if known. Using >= 2 as per user "second or third".
		const isFinal = completedCount >= 2;

		return ok({ 
			...evaluation, 
			attemptCount: completedCount,
			isFinal,
			isEvaluatee: isTeamMember
		});
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
