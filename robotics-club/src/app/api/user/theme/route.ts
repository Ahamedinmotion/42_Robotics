// PATCH /api/user/theme
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { theme, unlockTheme } = body;

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { unlockedThemes: true },
		});

		if (!user) return err("User not found", 404);

		const data: any = {};
		if (theme) data.activeTheme = theme;
		let newlyUnlocked = false;
		if (unlockTheme && !user.unlockedThemes.includes(unlockTheme)) {
			data.unlockedThemes = {
				set: [...user.unlockedThemes, unlockTheme],
			};
			newlyUnlocked = true;
		}

		if (Object.keys(data).length === 0) {
			return ok({ message: "No changes" });
		}

		const updated = await prisma.user.update({
			where: { id: session.user.id },
			data,
			select: { activeTheme: true, unlockedThemes: true },
		});

		return ok({ ...updated, newlyUnlocked });

	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
