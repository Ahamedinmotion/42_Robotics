// PATCH /api/user/alumni-evaluator
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true },
		});

		if (!user || user.status !== "ALUMNI") {
			return err("Only ALUMNI users can toggle evaluator opt-in", 403);
		}

		const existing = await prisma.alumniEvaluator.findUnique({
			where: { userId: session.user.id },
		});

		if (existing) {
			const updated = await prisma.alumniEvaluator.update({
				where: { userId: session.user.id },
				data: { isActive: !existing.isActive },
			});
			return ok(updated);
		}

		const created = await prisma.alumniEvaluator.create({
			data: { userId: session.user.id, isActive: true },
		});
		return ok(created);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
