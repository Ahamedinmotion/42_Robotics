import prisma from "@/lib/prisma";
import { TeamStatus } from "@prisma/client";
import { ProjectCockpit } from "@/components/cursus/ProjectCockpit";

export async function ProjectCockpitSection({ userId }: { userId: string }) {
	const activeTeamMember = await prisma.teamMember.findFirst({
		where: {
			userId,
			team: { status: { in: [TeamStatus.ACTIVE, TeamStatus.EVALUATING] } },
		},
		include: {
			team: {
				include: {
					project: { select: { id: true, title: true, rank: true } },
					members: {
						include: {
							user: {
								select: { id: true, login: true, name: true, image: true, githubHandle: true },
							},
						},
					},
					weeklyReports: { orderBy: { weekNumber: "asc" } },
					evaluationSlots: {
						include: { evaluations: { select: { id: true, status: true } } },
					},
					materialRequests: { orderBy: { createdAt: "desc" } },
					fabricationRequests: { orderBy: { createdAt: "desc" } },
					checkouts: { orderBy: { createdAt: "desc" } },
				},
			},
		},
	});

	// Serialise team data for client component
	const teamData = activeTeamMember?.team
		? {
			id: activeTeamMember.team.id,
			status: activeTeamMember.team.status,
			rank: activeTeamMember.team.rank,
			blackholeDeadline: activeTeamMember.team.blackholeDeadline?.toISOString() ?? null,
			activatedAt: activeTeamMember.team.activatedAt?.toISOString() ?? null,
			project: activeTeamMember.team.project,
			members: activeTeamMember.team.members.map((m) => ({
				userId: m.userId,
				isLeader: m.isLeader,
				user: m.user,
			})),
			weeklyReports: activeTeamMember.team.weeklyReports.map((r) => ({
				id: r.id,
				weekNumber: r.weekNumber,
				summary: r.summary,
				readmeUpdated: r.readmeUpdated,
				createdAt: r.createdAt.toISOString(),
			})),
			evaluationSlots: activeTeamMember.team.evaluationSlots.map((s) => ({
				id: s.id,
				status: s.status,
				createdAt: s.createdAt.toISOString(),
				evaluations: s.evaluations,
			})),
			materialRequests: activeTeamMember.team.materialRequests.map((mr) => ({
				id: mr.id,
				itemName: mr.itemName,
				quantity: mr.quantity,
				estimatedCost: mr.estimatedCost,
				status: mr.status,
				createdAt: mr.createdAt.toISOString(),
			})),
			fabricationRequests: activeTeamMember.team.fabricationRequests.map((fr) => ({
				id: fr.id,
				machineType: fr.machineType,
				status: fr.status,
				createdAt: fr.createdAt.toISOString(),
			})),
			checkouts: activeTeamMember.team.checkouts.map((co) => ({
				id: co.id,
				itemName: co.itemName,
				quantity: co.quantity,
				status: co.status,
				createdAt: co.createdAt.toISOString(),
			})),
		}
		: null;

	return <ProjectCockpit team={teamData} userId={userId} />;
}
