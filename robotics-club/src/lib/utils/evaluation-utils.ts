/**
 * Evaluation Tactical Adjectives
 * Used to mask colleague identities until the 15-minute tactical window.
 */
export const TACTICAL_ADJECTIVES = [
	"rather brilliant", "suspiciously calm", "methodical", "caffeinated",
	"enigmatic", "quietly confident", "unreasonably talented",
	"aggressively helpful", "chronically debugging", "perpetually iterating",
	"alarmingly prepared", "refreshingly honest", "dangerously creative",
	"surprisingly thorough", "delightfully chaotic", "impressively stubborn",
	"curiously determined", "relentlessly iterating", "suspiciously brilliant",
	"oddly prepared", "infectiously enthusiastic", "devastatingly logical",
	"charmingly persistent", "quietly unstoppable", "remarkably composed",
	"disturbingly efficient", "endearingly ambitious", "famously detail-oriented",
	"legendarily caffeinated", "heroically debugging"
];

/**
 * getTacticalMask
 * Generates a stable adjective based on a string ID (e.g., userId or teamId).
 */
export function getTacticalMask(seed: string): string {
	let hash = 0;
	if (seed.length === 0) return TACTICAL_ADJECTIVES[0];
	for (let i = 0; i < seed.length; i++) {
		const char = seed.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0; // Convert to 32bit integer
	}
	const index = Math.abs(hash) % TACTICAL_ADJECTIVES.length;
	return TACTICAL_ADJECTIVES[index];
}

/**
 * getIdentityRevealStatus
 * Determines if an identity should be revealed based on the 15-minute threshold.
 */
export function getIdentityRevealStatus(startTime: Date) {
	const now = new Date();
	const diffMs = startTime.getTime() - now.getTime();
	const diffMins = diffMs / (1000 * 60);

	return {
		shouldReveal: diffMins <= 15,
		isImminent: diffMins <= 15 && diffMins > 0,
		isInProgress: diffMs <= 0 && diffMs > -(120 * 60 * 1000), // 2h window
		remainingMs: diffMs,
		remainingMins: Math.ceil(diffMins)
	};
}
