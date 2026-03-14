import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { NotificationType, SlotStatus } from "@prisma/client";

// DELETE /api/evaluations/availability/[id]
// Closes an availability window
export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const windowId = params.id;
		const window = await (prisma as any).availabilityWindow.findUnique({
			where: { id: windowId },
			include: {
				team: {
					include: { members: true }
				},
				slots: {
					where: { status: "CLAIMED" },
				}
			}
		});

		if (!window) return err("Availability window not found", 404);

		// Check permissions (leader or admin)
		const isLeader = window.team.leaderId === session.user.id;
		const isAdmin = session.user.role === "ADMIN" || session.user.role === "STAFF";
		if (!isLeader && !isAdmin) return err("Forbidden", 403);

		const now = new Date();
		const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);

		// 15-minute cancellation rule
		const hasTightSlots = window.slots.some((s: any) => s.slotStart <= fifteenMinsFromNow);
		
		if (hasTightSlots) {
			await prisma.conflictFlag.create({
				data: {
					teamId: window.teamId,
					raisedById: session.user.id,
					description: `Late cancellation of evaluation availability (within 15 mins of a claimed slot).`,
				}
			});
		}

		// Notify affected evaluators
		for (const slot of window.slots) {
			if (slot.claimedById) {
				await prisma.notification.create({
					data: {
						userId: slot.claimedById,
						type: (NotificationType as any).EVAL_CANCELLED || "GENERAL",
						title: "Evaluation Cancelled",
						body: `The squad has closed their availability for your claimed slot at ${new Date(slot.slotStart).toLocaleTimeString()}.`,
						actionUrl: `/cursus`,
					}
				});
			}
		}

		// Close window
		await (prisma as any).availabilityWindow.update({
			where: { id: windowId },
			data: { isOpen: false }
		});

		// Also cancel all individual slots that were open/claimed in this window
		await (prisma as any).evaluationSlot.updateMany({
			where: { availabilityWindowId: windowId, status: { in: ["OPEN", "CLAIMED"] } },
			data: { status: "OPEN" } 
		});

		return ok({ success: true, strikeLogged: hasTightSlots });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
