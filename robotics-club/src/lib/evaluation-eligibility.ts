import { Rank } from "@prisma/client";

// Rank hierarchy map for generic comparisons (higher number = higher rank)
export const rankValues: Record<Rank, number> = {
	E: 1,
	D: 2,
	C: 3,
	B: 4,
	A: 5,
	S: 6,
};

// Map of maximum rank a user of a given rank can evaluate
export const maxEvaluationTarget: Record<Rank, Rank> = {
	E: Rank.C,
	D: Rank.B,
	C: Rank.A,
	B: Rank.A, // B can evaluate up to A, not S
	A: Rank.S,
	S: Rank.S,
};

type EvaluatorUser = {
	id: string;
	currentRank: Rank;
	role: string;
};

type ProjectInfo = {
	id: string;
	rank: Rank;
};

type TeamInfo = {
	id: string;
	members: { userId: string }[];
	evaluations: { evaluatorId: string }[];
	claims?: { claimedById: string | null }[];
};

export function isEligibleEvaluator(
	evaluator: EvaluatorUser,
	team: TeamInfo,
	project: ProjectInfo
): boolean {
	// 1. Evaluator is not a member of the team
	if (team.members.some((m) => m.userId === evaluator.id)) {
		return false;
	}

	// 2. Evaluator has not already claimed or evaluated this project for this team
	const alreadyEvaluated = team.evaluations.some((e) => e.evaluatorId === evaluator.id);
	const alreadyClaimed = team.claims?.some((c) => c.claimedById === evaluator.id);

	if (alreadyEvaluated || alreadyClaimed) {
		return false;
	}

	const evaluatorRankVal = rankValues[evaluator.currentRank];
	const projectRankVal = rankValues[project.rank];

	// 3. Special rules for A or S rank projects (Staff eval required if Student)
	if (project.rank === Rank.A || project.rank === Rank.S) {
		const isStaff = evaluator.role !== "STUDENT";
		const isHighRank = evaluatorRankVal >= rankValues.A;
		if (!isHighRank && !isStaff) {
			return false;
		}
	}

	// 4. Rank constraints based on the evaluator's rank
	const maxEvalTarget = maxEvaluationTarget[evaluator.currentRank];
	const maxEvalTargetVal = rankValues[maxEvalTarget];

	if (projectRankVal > maxEvalTargetVal) {
		return false;
	}

	return true;
}
