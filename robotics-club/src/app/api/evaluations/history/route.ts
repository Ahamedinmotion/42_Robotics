import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// GET /api/evaluations/history
// Returns completed evaluations given by the current user
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;

		const history = await (prisma as any).evaluationSlot.findMany({
			where: {
				claimedById: userId,
				status: { in: ["COMPLETED", "NO_SHOW"] }
			},
			include: {
				team: {
					include: {
						project: { select: { title: true } },
						leader: { select: { login: true } }
					}
				},
				evaluations: {
					include: { feedback: true }
				}
			},
			orderBy: { slotStart: "desc" }
		});

		return ok(history);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
