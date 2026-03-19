import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { rating, comment, fromRole } = await req.json();

		if (!rating || !fromRole) {
			return err("Rating and role are required", 400);
		}

		const evaluation = await prisma.evaluation.findUnique({
			where: { id: params.id },
			include: {
				team: {
					include: {
						members: true,
					},
				},
			},
		});

		if (!evaluation) return err("Evaluation not found", 404);

		// Authorization
		const isTeamMember = evaluation.team.members.some(m => m.userId === session.user.id);
		const isEvaluator = evaluation.evaluatorId === session.user.id;

		if (fromRole === "TEAM" && !isTeamMember) return err("Forbidden", 403);
		if (fromRole === "EVALUATOR" && !isEvaluator) return err("Forbidden", 403);

		// Determine recipient
		const data: any = {
			evaluationId: params.id,
			rating,
			comment,
			fromRole,
		};

		if (fromRole === "TEAM") {
			data.toEvaluatorId = evaluation.evaluatorId;
		} else {
			data.toTeamId = evaluation.teamId;
		}

		// Create feedback
		const feedback = await (prisma as any).evaluationFeedback.create({ data });

		return ok(feedback);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
