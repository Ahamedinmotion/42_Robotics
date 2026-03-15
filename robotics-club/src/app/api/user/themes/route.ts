import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { THEMES } from "@/lib/themes";

export async function PATCH(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user) return err("Unauthorized", 401);

	const body = await req.json();
	const { activeTheme, unlockTheme, questComplete } = body;
	const userId = (session.user as any).id;

	// Handle Quest Completion
	if (questComplete) {
		await prisma.user.update({
			where: { id: userId },
			data: { hasFoundSecrets: true }
		});

		// Achievement Check: PATIENT_ZERO
		const achievement = await prisma.achievement.findUnique({ where: { key: "PATIENT_ZERO" } });
		if (achievement) {
			const existing = await prisma.userAchievement.findUnique({
				where: { userId_achievementId: { userId, achievementId: achievement.id } }
			});
			if (!existing) {
				await prisma.userAchievement.create({
					data: { userId, achievementId: achievement.id }
				});
			}
		}
		return ok({ message: "You were expected." });
	}

	try {
		// If questComplete was not handled, proceed with theme updates
		// const { activeTheme, unlockTheme } = await req.json(); // This line is now handled by the initial body parsing
		// const userId = (session.user as any).id; // This is now defined above

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { unlockedThemes: true },
		});

		if (!user) return err("User not found", 404);

		const updateData: any = {};

		if (activeTheme) {
			updateData.activeTheme = activeTheme;
		}

		let newlyUnlocked = false;
		if (unlockTheme) {
			if (!user.unlockedThemes.includes(unlockTheme)) {
				updateData.unlockedThemes = {
					set: [...user.unlockedThemes, unlockTheme],
				};
				newlyUnlocked = true;
			}
		}

		if (Object.keys(updateData).length === 0) {
			return ok({ message: "No changes" });
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: updateData,
		});

		// Achievement Check: Interior Decorator
		const ALL_THEME_IDS = THEMES.map(t => t.id);
		const hasAllThemes = ALL_THEME_IDS.every(id => updated.unlockedThemes.includes(id));
		
		if (hasAllThemes) {
			// Check if already has it
			const achievement = await prisma.achievement.findUnique({ where: { key: "INTERIOR_DECORATOR" } });
			if (achievement) {
				const existing = await prisma.userAchievement.findUnique({
					where: { userId_achievementId: { userId, achievementId: achievement.id } }
				});
				if (!existing) {
					await prisma.userAchievement.create({
						data: { userId, achievementId: achievement.id }
					});
				}
			}
		}

		return ok({
			activeTheme: updated.activeTheme,
			unlockedThemes: updated.unlockedThemes,
			newlyUnlocked,
		});
	} catch (e: any) {
		console.error("Theme API Error:", e);
		return err(e.message, 500);
	}
}
