import { QuestionType } from "@prisma/client";

interface ScoringResult {
	totalScore: number;
	passed: boolean;
	sectionScores: Record<string, number>;
	hardRequirementFailed: boolean;
}

export function calculateScore(sheet: any, responses: Record<string, any>): ScoringResult {
	let totalWeightedScore = 0;
	let hardRequirementFailed = false;
	const sectionScores: Record<string, number> = {};

	for (const section of sheet.sections) {
		let sectionQuestionWeightSum = 0;
		let sectionWeightedValueSum = 0;

		for (const question of section.questions) {
			const value = responses[question.id];
			const weight = question.weight || 1;
			sectionQuestionWeightSum += weight;

			let normalizedValue = 0; // 0 to 1

			switch (question.type) {
				case "STAR_RATING":
					normalizedValue = (Number(value) || 0) / 5;
					break;
				case "CHECKBOX":
					normalizedValue = value ? 1 : 0;
					break;
				case "LINEAR_SCALE":
					const min = question.scaleMin ?? 0;
					const max = question.scaleMax ?? 10;
					normalizedValue = (Number(value) - min) / (max - min);
					break;
				case "MULTIPLE_CHOICE":
					// Usually options have point values in advanced systems, 
					// but here we just check if it's the first option (best) or similar? 
					// Actually, let's treat it as 1 if answered, 0 if not for now, 
					// OR better: if it's a "selection", maybe we don't score it directly 
					// unless we have specific point mapping. 
					// For now, let's assume it's binary or custom.
					normalizedValue = value ? 1 : 0;
					break;
				default:
					normalizedValue = value ? 1 : 0;
			}

			// Check auto-fail
			if (question.isHardRequirement && normalizedValue < 1) {
				hardRequirementFailed = true;
			}

			sectionWeightedValueSum += normalizedValue * weight;
		}

		const sectionScore = sectionQuestionWeightSum > 0 
			? (sectionWeightedValueSum / sectionQuestionWeightSum) * 100 
			: 100;
		
		sectionScores[section.id] = sectionScore;
		totalWeightedScore += (sectionScore * (section.weight / 100));
	}

	const passed = !hardRequirementFailed && totalWeightedScore >= (sheet.passMark || 60);

	return {
		totalScore: Math.round(totalWeightedScore * 100) / 100,
		passed,
		sectionScores,
		hardRequirementFailed,
	};
}
