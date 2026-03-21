import { PublicDefense, DefenseEvaluation, DefenseCriteriaScore, DefenseResult, Rank } from "@prisma/client";

export const EVALUATOR_WEIGHTS: Record<string, number> = {
  S: 1.0,
  A: 1.0,
  B: 0.4,
  C: 0.3,
  D: 0.2,
  E: 0.1,
};

/**
 * Returns the weight for a given rank.
 * Defaults to 0.1 if rank not found.
 */
export function getEvaluatorWeight(rank: string): number {
  return EVALUATOR_WEIGHTS[rank] || 0.1;
}

/**
 * Calculates the score for a single evaluation.
 * Average of all criteria scores normalized to 0-100.
 */
export function calculateEvaluationScore(
  criteriaScores: DefenseCriteriaScore[],
  ratingScale: number
): number {
  if (criteriaScores.length === 0) return 0;
  
  const sum = criteriaScores.reduce((acc, curr) => acc + curr.score, 0);
  return (sum / (criteriaScores.length * ratingScale)) * 100;
}

export type DefenseEvaluationWithScores = DefenseEvaluation & {
  criteriaScores: DefenseCriteriaScore[];
};

export interface DefenseResultData {
  adminAverage: number | null;
  adminPassed: boolean | null;
  adminCount: number;
  expertAverage: number | null;
  expertPassed: boolean | null;
  expertCount: number;
  galleryWeighted: number | null;
  galleryCount: number;
  galleryExcluded: boolean;
  finalScore: number;
  passed: boolean;
  provisional: boolean;
  provisionalReason: string | null;
}

/**
 * Core calculation logic for a defense result.
 * Aggregates scores from admins, experts (A/S ranks), and gallery members.
 */
export function calculateDefenseResult(
  defense: PublicDefense,
  evaluations: DefenseEvaluationWithScores[],
  passThreshold: number,
  ratingScale: number
): DefenseResultData {
  const adminEvals = evaluations.filter(e => e.isAdmin);
  const expertEvals = evaluations.filter(e => !e.isAdmin && (e.evaluatorRank === Rank.A || e.evaluatorRank === Rank.S));
  const galleryEvals = evaluations.filter(e => !e.isAdmin && e.evaluatorRank !== Rank.A && e.evaluatorRank !== Rank.S);

  // 1. Admin Results
  let adminAverage: number | null = null;
  let adminPassed: boolean | null = null;
  if (adminEvals.length > 0) {
    const adminSum = adminEvals.reduce((acc, e) => acc + (e.totalScore || 0), 0);
    adminAverage = adminSum / adminEvals.length;
    adminPassed = adminAverage >= passThreshold;
  }

  // 2. Expert Results
  let expertAverage: number | null = null;
  let expertPassed: boolean | null = null;
  let expertProvisional = false;

  if (expertEvals.length > 0) {
    const expertSum = expertEvals.reduce((acc, e) => acc + (e.totalScore || 0), 0);
    expertAverage = expertSum / expertEvals.length;
    
    if (expertEvals.length < 2) {
       expertPassed = null; // Too few experts, provisional
       expertProvisional = true;
    } else {
       expertPassed = expertAverage >= passThreshold;
    }
  } else {
    expertPassed = null;
    expertProvisional = true;
  }

  // 3. Gallery Results
  let galleryWeighted: number | null = null;
  const galleryExcluded = defense.expertJuryOnly || defense.lowerRankDispelled;
  
  if (!galleryExcluded && galleryEvals.length > 0) {
    let numerator = 0;
    let denominator = 0;
    galleryEvals.forEach(e => {
        const weight = getEvaluatorWeight(e.evaluatorRank);
        numerator += (e.totalScore || 0) * weight;
        denominator += weight;
    });
    galleryWeighted = denominator > 0 ? numerator / denominator : null;
  }

  // 4. Final Score (Includes all non-admin evaluations weighted)
  // Non-admin includes expertEvals and galleryEvals (if not excluded)
  let finalNumerator = 0;
  let finalDenominator = 0;

  expertEvals.forEach(e => {
      const weight = getEvaluatorWeight(e.evaluatorRank);
      finalNumerator += (e.totalScore || 0) * weight;
      finalDenominator += weight;
  });

  if (!galleryExcluded) {
    galleryEvals.forEach(e => {
        const weight = getEvaluatorWeight(e.evaluatorRank);
        finalNumerator += (e.totalScore || 0) * weight;
        finalDenominator += weight;
    });
  }

  const finalScore = finalDenominator > 0 ? finalNumerator / finalDenominator : 0;

  // 5. Final Result Determination
  const adminCheck = adminPassed === true || adminPassed === null;
  const expertCheck = expertPassed === true || expertPassed === null;
  const scoreCheck = finalScore >= passThreshold;

  const passed = adminCheck && expertCheck && scoreCheck;
  const provisional = adminPassed === null || expertPassed === null;
  
  let provisionalReason = null;
  if (provisional) {
      if (adminPassed === null && adminEvals.length === 0) {
          provisionalReason = "No admin evaluation submitted.";
      } else if (expertPassed === null && expertEvals.length < 2) {
          provisionalReason = "Fewer than 2 expert evaluations submitted.";
      }
  }

  return {
    adminAverage,
    adminPassed,
    adminCount: adminEvals.length,
    expertAverage,
    expertPassed,
    expertCount: expertEvals.length,
    galleryWeighted,
    galleryCount: galleryEvals.length,
    galleryExcluded,
    finalScore,
    passed,
    provisional,
    provisionalReason
  };
}
