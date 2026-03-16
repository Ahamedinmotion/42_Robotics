import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: { members: true }
		});

		if (!team) return err("Team not found", 404);

		// Only leader can cancel
		if (team.leaderId !== session.user.id) {
			return err("Only the team leader can cancel formation", 403);
		}

		// Can only cancel FORMING teams
		if (team.status !== TeamStatus.FORMING) {
			return err("Only teams in formation can be cancelled", 400);
		}

		// Delete the team (and cascading members)
		await prisma.team.delete({
			where: { id: teamId }
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
