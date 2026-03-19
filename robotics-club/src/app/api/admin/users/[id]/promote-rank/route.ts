import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Rank } from "@prisma/client";

const RANK_ORDER: Rank[] = ["E", "D", "C", "B", "A", "S"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_MANAGE_MEMBERS");
	if (auth instanceof Response) return auth;

	try {
		const user = await prisma.user.findUnique({
			where: { id: params.id },
			select: { currentRank: true },
		});

		if (!user) return err("User not found", 404);

		const currentIndex = RANK_ORDER.indexOf(user.currentRank as Rank);
		if (currentIndex === -1) return err("Invalid current rank", 400);
		if (currentIndex === RANK_ORDER.length - 1) return err("User already at maximum rank", 400);

		const nextRank = RANK_ORDER[currentIndex + 1];

		const updated = await prisma.user.update({
			where: { id: params.id },
			data: { currentRank: nextRank },
			select: { id: true, login: true, currentRank: true },
		});

		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
