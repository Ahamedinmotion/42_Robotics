import prisma from "@/lib/prisma";
import { Rank } from "@prisma/client";

export async function getRankRequirements(rank: Rank) {
	const [requirement, requiredProjectCount] = await Promise.all([
		prisma.rankRequirement.findUnique({
			where: { rank },
		}),
		prisma.project.count({
			where: { rank, isRequired: true, status: "ACTIVE" },
		}),
	]);

	return {
		requirement: requirement || { rank, projectsRequired: 4 }, // Fallback just in case
		requiredProjectCount,
	};
}

export async function validateRequirements(
	rank: Rank, 
	potentialNewReqCount?: number, 
	potentialNewAdvancementCount?: number
) {
	const current = await getRankRequirements(rank);
	
	const requiredProjectCount = potentialNewReqCount ?? current.requiredProjectCount;
	const advancementRequirement = potentialNewAdvancementCount ?? current.requirement.projectsRequired;

	if (requiredProjectCount > advancementRequirement) {
		return {
			isValid: false,
			error: `You have ${requiredProjectCount} required projects but only ${advancementRequirement} completions needed to advance from ${rank}. Required projects cannot exceed the advancement requirement.`
		};
	}

	return { isValid: true };
}
