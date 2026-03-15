import prisma from "@/lib/prisma";

/**
 * Unlocks an achievement for a user if they don't already have it.
 * Also dispatches a custom event for the UI to show feedback.
 */
export async function unlockAchievement(userId: string, achievementKey: string) {
	try {
		// 1. Find the achievement
		const achievement = await prisma.achievement.findUnique({
			where: { key: achievementKey },
		});

		if (!achievement) {
			console.error(`Achievement not found: ${achievementKey}`);
			return { success: false, message: "Achievement not found" };
		}

		// 2. Check if user already has it
		const existing = await prisma.userAchievement.findUnique({
			where: {
				userId_achievementId: {
					userId,
					achievementId: achievement.id,
				},
			},
		});

		if (existing) {
			return { success: true, alreadyUnlocked: true };
		}

		// 3. Unlock it
		await prisma.userAchievement.create({
			data: {
				userId,
				achievementId: achievement.id,
			},
		});

		// 4. Dispatch event (this works if called from a Server Action or API route that returns to client)
		// But usually we want to trigger this from the client too if possible.
		// Since this is a server-side utility, the client-side feedback will happen 
		// if the API response includes a flag or if the client listens to a standard event.
		
		return { success: true, newlyUnlocked: true, achievement };
	} catch (error) {
		console.error("Unlock achievement error:", error);
		return { success: false, error };
	}
}
