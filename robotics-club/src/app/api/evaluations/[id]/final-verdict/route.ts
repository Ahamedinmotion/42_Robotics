import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkAdvancementEligibility } from "@/lib/rank-advancement";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

		const evaluation = await prisma.evaluation.findUnique({
			where: { id: params.id },
			include: { team: { include: { project: true } } }
		});

		if (!evaluation) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

		const teamId = evaluation.teamId;

		const allEvals = await prisma.evaluation.findMany({
			where: { teamId, status: "COMPLETED" as any }
		});

		// Require all completed evaluations to have passed
		const passed = allEvals.length > 0 && allEvals.every(e => e.passed);
		let newRank = null;

		if (passed) {
			// Mark team as COMPLETED explicitly
			await prisma.team.update({
				where: { id: teamId },
				data: { status: "COMPLETED" }
			});

			// Check rank advancement using the team leader ID assuming they are the main user
			// Or better yet, the session user since we are doing this for them
			const eligibility = await checkAdvancementEligibility(session.user.id, evaluation.team.project.rank);
			
			if (eligibility.isEligible) {
				const ranks = ["E", "D", "C", "B", "A", "S"];
				const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }});
				const userRankIdx = ranks.indexOf(currentUser?.currentRank || "E");
				
				// Only advance if the project's rank is the user's current rank to prevent advancing multiple ranks at once
				if (evaluation.team.project.rank === currentUser?.currentRank && userRankIdx < ranks.length - 1) {
					newRank = ranks[userRankIdx + 1];
					
					// Update user's rank
					await prisma.user.update({
						where: { id: session.user.id },
						data: { currentRank: newRank as any }
					});
				}
			}
		}

		return NextResponse.json({ ok: true, passed, newRank });
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}
