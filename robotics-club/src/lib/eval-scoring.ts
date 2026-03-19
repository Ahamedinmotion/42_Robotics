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
					const selectedOpt = question.options?.find((o: any) => o.label === value);
					normalizedValue = selectedOpt?.isCorrect ? 1 : 0;
					break;
				default:
					normalizedValue = value ? 1 : 0;
			}
 
			// Check auto-fail
			if (question.isHardRequirement) {
				const threshold = question.passThreshold ?? 1; // Default to 1 (100% of weight)
				if (normalizedValue < (threshold / 5)) { // Assuming threshold is on 1-5 scale for stars, or raw normalized for others?
					// Wait, threshold from UI for stars is 1-5. For normalized it's 0-1.
					// Let's normalize the threshold check.
					const normalizedThreshold = question.type === 'STAR_RATING' 
						? threshold / 5 
						: question.type === 'LINEAR_SCALE' 
							? (threshold - (question.scaleMin ?? 0)) / ((question.scaleMax ?? 10) - (question.scaleMin ?? 0))
							: 1; // Default to full pass for other types
					
					if (normalizedValue < normalizedThreshold) {
						hardRequirementFailed = true;
					}
				}
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
