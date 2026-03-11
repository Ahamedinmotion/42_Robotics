// GET /api/cursus/projects
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { ProjectStatus, Rank, TeamStatus } from "@prisma/client";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const projects = await prisma.project.findMany({
			where: { status: ProjectStatus.ACTIVE },
			include: {
				_count: {
					select: {
						teams: {
							where: {
								status: {
									in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
								},
							},
						},
					},
				},
				teams: {
					where: {
						status: {
							in: [TeamStatus.ACTIVE, TeamStatus.COMPLETED, TeamStatus.EVALUATING],
						},
					},
					select: {
						id: true, // We will map this, usually teams might have names, but currently we just fetch them. The prompt asked for active/completed team names
						status: true,
						leader: {
							select: { login: true }
						}
					},
				},
			},
		});

		const grouped: Record<Rank, any[]> = {
			E: [],
			D: [],
			C: [],
			B: [],
			A: [],
			S: [],
		};

		for (const project of projects) {
			let enhancedProject: any = { ...project };

			// Filter teams for B rank and above
			const isHighRank = ["B", "A", "S"].includes(project.rank);
			if (isHighRank) {
				// Re-formatting teams to just return names - the team model doesn't explicitly have a name string, so we will use leader.login + ' team'
				enhancedProject.teamNames = project.teams.map(t => `${t.leader.login}'s Team`);
			} else {
				enhancedProject.teamNames = [];
			}
			delete enhancedProject.teams;

			if (grouped[project.rank]) {
				grouped[project.rank].push(enhancedProject);
			}
		}

		return ok(grouped);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
