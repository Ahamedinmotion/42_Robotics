import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_EXTEND_DEADLINES");
	if (auth instanceof Response) return auth;

	try {
		const { days } = await req.json();
		if (!days || days < 1 || days > 30) return err("days must be 1–30", 400);

		const team = await prisma.team.findUnique({ where: { id: params.id } });
		if (!team) return err("Team not found", 404);

		const current = team.blackholeDeadline ?? new Date();
		const extended = new Date(current.getTime() + days * 86400000);

		const updated = await prisma.team.update({
			where: { id: params.id },
			data: { blackholeDeadline: extended },
			select: { id: true, blackholeDeadline: true },
		});
		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
