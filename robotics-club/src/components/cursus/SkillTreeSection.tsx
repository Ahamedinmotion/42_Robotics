import prisma from "@/lib/prisma";
import { TeamStatus } from "@prisma/client";
import { SkillTree, type ProjectNode } from "@/components/cursus/SkillTree";

const RANK_VALUES: Record<string, number> = {
	E: 1, D: 2, C: 3, B: 4, A: 5, S: 6,
};

export async function SkillTreeSection({ userId }: { userId: string }) {
	// ── Parallel Data Fetching ─────────────────
	const [user, allProjects, userTeams] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { currentRank: true },
		}),
		prisma.project.findMany({
			where: { status: "ACTIVE" },
			include: {
				teams: {
					where: {
						status: {
							in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
						},
					},
					select: { id: true },
				},
			},
		}),
		prisma.teamMember.findMany({
			where: { userId },
			include: {
				team: {
					select: { projectId: true, status: true },
				},
			},
		}),
	]);

	if (!user) return null;

	const userRankVal = RANK_VALUES[user.currentRank] ?? 1;

	const completedProjectIds = new Set(
		userTeams.filter((tm) => tm.team.status === TeamStatus.COMPLETED).map((tm) => tm.team.projectId)
	);
	const activeProjectIds = new Set(
		userTeams
			.filter((tm) => tm.team.status === TeamStatus.ACTIVE || tm.team.status === TeamStatus.EVALUATING)
			.map((tm) => tm.team.projectId)
	);

	// ── Determine user state for each project ─────
	const grouped: Record<string, ProjectNode[]> = {
		E: [], D: [], C: [], B: [], A: [], S: [],
	};

	let activeTeamProjectId: string | null = null;

	for (const p of allProjects) {
		const projectRankVal = RANK_VALUES[p.rank] ?? 1;
		let userState: ProjectNode["userState"];

		if (completedProjectIds.has(p.id)) {
			userState = "completed";
		} else if (activeProjectIds.has(p.id)) {
			userState = "active";
			activeTeamProjectId = p.id;
		} else if (p.rank === "S" && userRankVal < RANK_VALUES.A) {
			userState = "locked";
		} else if (projectRankVal <= userRankVal) {
			userState = "available";
		} else {
			userState = "locked";
		}

		const node: ProjectNode = {
			id: p.id,
			title: p.title,
			rank: p.rank,
			skillTags: (p.skillTags as string[]) || [],
			blackholeDays: p.blackholeDays,
			teamSizeMin: p.teamSizeMin,
			teamSizeMax: p.teamSizeMax,
			activeTeamCount: p.teams.length,
			isUnique: p.isUnique,
			userState,
		};

		if (grouped[p.rank]) {
			grouped[p.rank].push(node);
		}
	}

	return (
		<div className="-mx-4 sm:-mx-6 lg:-mx-8">
			<SkillTree
				projects={grouped}
				userRank={user.currentRank}
				activeTeamProjectId={activeTeamProjectId}
			/>
		</div>
	);
}
