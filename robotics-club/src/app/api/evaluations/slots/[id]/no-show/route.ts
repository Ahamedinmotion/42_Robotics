import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { SlotStatus } from "@prisma/client";

// PATCH /api/evaluations/slots/[id]/no-show
// Records an evaluator no-show and logs a strike
export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const slotId = params.id;
		const slot = await prisma.evaluationSlot.findUnique({
			where: { id: slotId },
			include: { team: true }
		});

		if (!slot) return err("Slot not found", 404);

		// Logic check: Can only be called if slotStart + 30m has passed and status is CLAIMED
		const now = new Date();
		const thirtyMinsAfterStart = new Date(slot.slotStart.getTime() + 30 * 60 * 1000);

		if (now < thirtyMinsAfterStart) {
			return err("Cannot mark as no-show until 30 minutes after slot start", 400);
		}
		if (slot.status !== SlotStatus.CLAIMED) {
			return err("Slot is not in CLAIMED status", 400);
		}

		// Update slot
		await prisma.evaluationSlot.update({
			where: { id: slotId },
			data: { status: SlotStatus.NO_SHOW }
		});

		// Log a strike against the evaluator
		await prisma.conflictFlag.create({
			data: {
				teamId: slot.teamId,
				raisedById: slot.team.leaderId, // Team leader "raises" the flag automatically
				description: `Evaluator no-show for slot starting at ${slot.slotStart.toLocaleTimeString()}.`,
				// Note: Real strike logic (3 strikes = suspension) would be handled by a separate background worker or admin check
			}
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
