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

		// Find latest completed evaluation for this team
		const evaluation = await prisma.evaluation.findFirst({
			where: { teamId: params.id },
			orderBy: { completedAt: "desc" },
			include: {
				evaluator: {
					select: {
						login: true,
						name: true,
					},
				},
				feedback: {
					where: { fromRole: "TEAM_MEMBER" as any },
				},
			},
		});

		if (!evaluation) return ok(null);

		// Check if team member has submitted feedback
		const hasSubmittedFeedback = (evaluation as any).feedback.length > 0;
		const timeSinceCompletion = evaluation.completedAt 
			? Date.now() - new Date(evaluation.completedAt).getTime()
			: 0;
		const twentyFourHours = 24 * 60 * 60 * 1000;
		const canViewResult = hasSubmittedFeedback || timeSinceCompletion >= twentyFourHours;

		return ok({
			...evaluation,
			canViewResult,
			hasSubmittedFeedback,
			timeToAutoReveal: Math.max(0, twentyFourHours - timeSinceCompletion),
		});
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
