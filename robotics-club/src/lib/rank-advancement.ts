import prisma from "@/lib/prisma";
import { Rank, TeamStatus } from "@prisma/client";
import { getRankRequirements } from "./rank-requirements";

export async function checkAdvancementEligibility(userId: string, rank: Rank) {
	const currentReq = await getRankRequirements(rank);
	const projectsRequired = currentReq.requirement.projectsRequired;

	const [requiredProjects, userTeams] = await Promise.all([
		prisma.project.findMany({
			where: { rank, isRequired: true, status: "ACTIVE" },
			select: { id: true, title: true },
		}),
		prisma.teamMember.findMany({
			where: { userId },
			include: {
				team: {
					select: { projectId: true, status: true, project: { select: { rank: true } } },
				},
			},
		}),
	]);

	// Filter down to completed projects at this rank
	const completedProjectsAtRank = userTeams
		.filter((tm) => tm.team.status === TeamStatus.COMPLETED && tm.team.project?.rank === rank)
		.map((tm) => tm.team.projectId);

	const completedProjectIds = new Set(completedProjectsAtRank);

	// Check 1: Required projects
	const missingRequiredProjects = requiredProjects.filter((p) => !completedProjectIds.has(p.id));

	if (missingRequiredProjects.length > 0) {
		return {
			isEligible: false,
			missingRequired: missingRequiredProjects.map((p) => p.title),
			neededCount: Math.max(0, projectsRequired - completedProjectIds.size),
		};
	}

	// Check 2: Total count
	const totalCompleted = completedProjectIds.size;
	if (totalCompleted < projectsRequired) {
		return {
			isEligible: false,
			missingRequired: [],
			neededCount: projectsRequired - totalCompleted,
		};
	}

	return { 
		isEligible: true,
		missingRequired: [],
		neededCount: 0 
	};
}
