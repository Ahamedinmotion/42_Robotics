import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ProjectStatus, TeamStatus, Rank } from "@prisma/client";
import { SkillTree, type ProjectNode } from "@/components/cursus/SkillTree";
import { ProjectCockpit } from "@/components/cursus/ProjectCockpit";

// ── Rank ordering helper ─────────────────────────────
const RANK_VALUES: Record<string, number> = {
	E: 1, D: 2, C: 3, B: 4, A: 5, S: 6,
};

// ── Page ─────────────────────────────────────────────

export default async function CursusPage({
	searchParams,
}: {
	searchParams: { tab?: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const userId = session.user.id;
	const tab = searchParams.tab === "project" ? "project" : "overview";

	// ── Fetch current user ────────────────────────
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { currentRank: true },
	});
	if (!user) redirect("/login");

	const userRankVal = RANK_VALUES[user.currentRank] ?? 1;

	// ── Fetch all ACTIVE projects ────────────────
	const allProjects = await prisma.project.findMany({
		where: { status: ProjectStatus.ACTIVE },
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
	});

	// ── Fetch user's team history ─────────────────
	const userTeams = await prisma.teamMember.findMany({
		where: { userId },
		include: {
			team: {
				select: { projectId: true, status: true },
			},
		},
	});

	const completedProjectIds = new Set(
		userTeams.filter((tm) => tm.team.status === TeamStatus.COMPLETED).map((tm) => tm.team.projectId)
	);
	const activeProjectIds = new Set(
		userTeams
			.filter((tm) => [TeamStatus.ACTIVE, TeamStatus.EVALUATING].includes(tm.team.status as any))
			.map((tm) => tm.team.projectId)
	);

	// ── Determine user state for each project ─────
	const grouped: Record<string, ProjectNode[]> = {
		E: [], D: [], C: [], B: [], A: [], S: [],
	};

	for (const p of allProjects) {
		const projectRankVal = RANK_VALUES[p.rank] ?? 1;
		let userState: ProjectNode["userState"];

		if (completedProjectIds.has(p.id)) {
			userState = "completed";
		} else if (activeProjectIds.has(p.id)) {
			userState = "active";
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

	// ── Fetch active team for project cockpit ─────
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
								select: { id: true, login: true, name: true, avatar: true, githubHandle: true },
							},
						},
					},
					weeklyReports: { orderBy: { weekNumber: "asc" } },
					evaluationSlots: {
						include: { evaluations: { select: { id: true, status: true } } },
					},
					materialRequests: { orderBy: { createdAt: "desc" } },
				},
			},
		},
	});

	const activeTeamProjectId = activeTeamMember?.team?.projectId ?? null;

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
		}
		: null;

	// ── Render ─────────────────────────────────────

	return (
		<div className="space-y-6">
			{/* Tab switcher */}
			<div className="inline-flex rounded-full bg-panel p-1">
				<Link
					href="/cursus?tab=overview"
					className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === "overview"
							? "bg-accent font-bold text-background"
							: "text-text-muted hover:text-text-primary"
						}`}
				>
					Overview
				</Link>
				<Link
					href="/cursus?tab=project"
					className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === "project"
							? "bg-accent font-bold text-background"
							: "text-text-muted hover:text-text-primary"
						}`}
				>
					My Project
				</Link>
			</div>

			{/* Tab content */}
			{tab === "overview" ? (
				<SkillTree
					projects={grouped}
					userRank={user.currentRank}
					activeTeamProjectId={activeTeamProjectId}
				/>
			) : (
				<ProjectCockpit team={teamData} userId={userId} />
			)}
		</div>
	);
}
