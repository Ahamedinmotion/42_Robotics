import prisma from "@/lib/prisma";
import { TeamStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { SkillTree, type ProjectNode } from "@/components/cursus/SkillTree";
import { checkAdvancementEligibility } from "@/lib/rank-advancement";
import { Rank } from "@prisma/client";

const RANK_VALUES: Record<string, number> = {
	E: 1, D: 2, C: 3, B: 4, A: 5, S: 6,
};

export async function SkillTreeSection({ userId }: { userId: string }) {
	// ── Parallel Data Fetching ─────────────────
	const [user, allProjects, userTeams, allRankReqs] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: { currentRank: true },
		}),
		prisma.project.findMany({
			where: { status: "ACTIVE" },
			include: {
				_count: {
					select: {
						teams: true,
					},
				},
				teams: {
					where: {
						status: "COMPLETED",
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
		prisma.rankRequirement.findMany(),
	]);

	const rankRequirements = ["E", "D", "C", "B", "A", "S"].reduce((acc, r) => {
		const f = allRankReqs.find(x => x.rank === r);
		acc[r] = f ? f.projectsRequired : 4;
		return acc;
	}, {} as Record<string, number>);

	if (!user) {
		redirect("/login");
	}

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

		const completionRate = p._count.teams > 0 
			? Math.round((p.teams.length / p._count.teams) * 100) 
			: 0;

		const node: ProjectNode = {
			id: p.id,
			title: p.title,
			rank: p.rank,
			skillTags: (p.skillTags as string[]) || [],
			blackholeDays: p.blackholeDays,
			teamSizeMin: p.teamSizeMin,
			teamSizeMax: p.teamSizeMax,
			activeTeamCount: p._count.teams,
			isUnique: p.isUnique,
			description: p.description,
			completionRate,
			hasBeenCompleted: (p as any).hasBeenCompleted,
			userState,
			isRequired: p.isRequired || false,
		};

		if (grouped[p.rank]) {
			grouped[p.rank].push(node);
		}
	}

	const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S"];
	const rankProgress = await Promise.all(
		RANKS.map(async (r) => {
			const eligibility = await checkAdvancementEligibility(userId, r);
			return { 
				rank: r, 
				isEligible: eligibility.isEligible, 
				missingRequired: eligibility.missingRequired || [], 
				neededCount: eligibility.neededCount || 0 
			};
		})
	);

	return (
		<div className="-mx-4 sm:-mx-6 lg:-mx-8">
			<SkillTree
				projects={grouped}
				userRank={user.currentRank}
				activeTeamProjectId={activeTeamProjectId}
				rankProgress={rankProgress}
				rankRequirements={rankRequirements}
			/>
		</div>
	);
}
