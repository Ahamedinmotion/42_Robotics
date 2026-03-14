import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Rank, TeamStatus } from "@prisma/client";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const { searchParams } = new URL(req.url);
		const userId1 = searchParams.get("userId1");
		const userId2 = searchParams.get("userId2");
		const rank = searchParams.get("rank") as Rank;

		if (!userId1 || !userId2 || !rank) {
			return err("userId1, userId2, and rank are required", 400);
		}

		// Find if these two users have ever been in a COMPLETED team at this rank
		const commonTeams = await prisma.team.findMany({
			where: {
				status: TeamStatus.COMPLETED,
				rank: rank,
				members: {
					some: { userId: userId1 },
				},
				AND: {
					members: {
						some: { userId: userId2 },
					},
				},
			},
			select: { id: true },
		});

		return ok({ hasWorkedTogether: commonTeams.length > 0 });
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
