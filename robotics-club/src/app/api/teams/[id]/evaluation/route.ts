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

		// Find all completed evaluations for this team
		const evaluations = await prisma.evaluation.findMany({
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
					where: { fromRole: "TEAM" as any },
				},
			},
		});

		if (!evaluations || evaluations.length === 0) return ok([]);

		// Map through and process feedback requirements for each
		const processed = evaluations.map((ev: any) => {
			const hasSubmittedFeedback = ev.feedback.length > 0;
			const timeSinceCompletion = ev.completedAt 
				? Date.now() - new Date(ev.completedAt).getTime()
				: 0;
			const twentyFourHours = 24 * 60 * 60 * 1000;
			const canViewResult = hasSubmittedFeedback || timeSinceCompletion >= twentyFourHours;

			return {
				...ev,
				canViewResult,
				hasSubmittedFeedback,
				timeToAutoReveal: Math.max(0, twentyFourHours - timeSinceCompletion),
			};
		});

		return ok(processed);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
