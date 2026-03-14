import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { getTacticalMask } from "@/lib/utils/evaluation-utils";

// GET /api/evaluations/available
// Returns all availability windows where current user is eligible to evaluate
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return err("User not found", 404);

		// Fetch all open availability windows starting in the future
		const allWindows = await (prisma as any).availabilityWindow.findMany({
			where: {
				isOpen: true,
				endTime: { gt: new Date() },
				team: {
					members: { none: { userId } } // User cannot evaluate their own team
				}
			},
			include: {
				team: {
					include: {
						project: true,
						members: true,
						evaluations: true,
					}
				},
				slots: true,
			},
			orderBy: { startTime: "asc" }
		});

		// Filter by eligibility
		const availableMissions = allWindows.filter((window: any) => {
			const teamInfo = {
				id: window.team.id,
				members: window.team.members.map((m: any) => ({ userId: m.userId })),
				evaluations: window.team.evaluations,
			};
			const projectInfo = {
				id: window.team.project.id,
				rank: window.team.project.rank,
			};

			return isEligibleEvaluator(user as any, teamInfo, projectInfo);
		});

		// Tactical Anonymization (mask squad name)
		const anonymousMissions = availableMissions.map((window: any) => {
			const adjective = getTacticalMask(window.teamId);
			return {
				id: window.id,
				startTime: window.startTime,
				endTime: window.endTime,
				project: {
					title: window.team.project.title,
					rank: window.team.project.rank,
				},
				maskedSquad: `a ${adjective} squad`,
				slots: window.slots,
			};
		});

		return ok(anonymousMissions);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
