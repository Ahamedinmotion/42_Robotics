// DELETE /api/teams/[id]/members/[userId]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function DELETE(
	req: Request,
	{ params }: { params: { id: string; userId: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const { id: teamId, userId } = params;

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		if (team.status !== TeamStatus.FORMING) {
			return err("Team must be in FORMING status to remove members", 400);
		}

		const isAdmin = ["SECRETARY", "PROJECT_MANAGER", "SOCIAL_MEDIA_MANAGER", "VP", "PRESIDENT"].includes(session.user.role);
		if (team.leaderId !== session.user.id && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can remove members", 403);
		}

		if (team.leaderId === userId) {
			return err("Cannot remove the team leader", 400);
		}

		const member = await prisma.teamMember.findUnique({
			where: {
				teamId_userId: {
					teamId,
					userId,
				},
			},
		});

		if (!member) {
			return err("User is not a member of this team", 404);
		}

		await prisma.teamMember.delete({
			where: {
				teamId_userId: {
					teamId,
					userId,
				},
			},
		});

		return ok({ success: true });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
