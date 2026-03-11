// PATCH /api/user/theme
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Theme } from "@prisma/client";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { theme } = body;

		if (!theme || !Object.values(Theme).includes(theme)) {
			return err("Valid theme (FORGE or FIELD) is required", 400);
		}

		const updated = await prisma.user.update({
			where: { id: session.user.id },
			data: { activeTheme: theme as Theme },
			select: { activeTheme: true },
		});

		return ok(updated);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
