import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status, TeamStatus } from "@prisma/client";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const { searchParams } = new URL(req.url);
		const query = searchParams.get("q");

		if (!query || query.length < 2) {
			return ok([]);
		}

		const users = await prisma.user.findMany({
			where: {
				status: Status.ACTIVE,
				login: {
					contains: query,
					mode: "insensitive",
				},
				id: {
					not: session.user.id,
				},
			},
			take: 10,
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				currentRank: true,
				teams: {
					where: {
						team: {
							status: {
								in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
							},
						},
					},
					select: {
						team: {
							select: {
								status: true,
								project: {
									select: { title: true },
								},
							},
						},
					},
				},
				_count: {
					select: {
						teams: {
							where: {
								team: { status: TeamStatus.COMPLETED },
							},
						},
					},
				},
			},
		});

		const formattedUsers = users.map((u) => ({
			id: u.id,
			login: u.login,
			name: u.name,
			image: u.image,
			currentRank: u.currentRank,
			activeProject: u.teams[0]?.team.project.title || null,
			isAvailable: u.teams.length === 0,
			completedCount: u._count.teams,
		}));

		return ok(formattedUsers);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
