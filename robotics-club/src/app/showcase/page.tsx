import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { TeamStatus, Rank } from "@prisma/client";
import { FilterBar } from "@/components/showcase/FilterBar";
import { ShowcaseCard } from "@/components/showcase/ShowcaseCard";

// ── Metadata ─────────────────────────────────────────

export const metadata: Metadata = {
	title: "Showcase — Robotics Club",
	description: "Completed projects by the Robotics Club",
	openGraph: {
		title: "Showcase — Robotics Club",
		description: "Completed projects by the Robotics Club",
		type: "website",
	},
};

// ── Page ─────────────────────────────────────────────

export default async function ShowcasePage({
	searchParams,
}: {
	searchParams: { rank?: string; skill?: string };
}) {
	const rankFilter = searchParams.rank as Rank | undefined;
	const skillFilter = searchParams.skill;

	// Build Prisma where clause
	const teamWhere: any = { status: TeamStatus.COMPLETED };
	if (rankFilter && Object.values(Rank).includes(rankFilter)) {
		teamWhere.rank = rankFilter;
	}
	if (skillFilter) {
		teamWhere.project = { skillTags: { has: skillFilter } };
	}

	// ── Fetch completed teams ─────────────────────
	const teams = await prisma.team.findMany({
		where: teamWhere,
		orderBy: { updatedAt: "desc" },
		include: {
			project: { select: { title: true, description: true, skillTags: true } },
			members: {
				include: {
					user: { select: { id: true, login: true, name: true, image: true } },
				},
			},
			leader: { select: { githubHandle: true } },
			_count: { select: { evaluations: true } },
		},
	});

	// ── Compute filter options from ALL completed teams ─
	const allCompleted = await prisma.team.findMany({
		where: { status: TeamStatus.COMPLETED },
		select: { rank: true, project: { select: { skillTags: true } } },
	});

	const rankSet = new Set<string>();
	const skillCount = new Map<string, number>();

	for (const t of allCompleted) {
		rankSet.add(t.rank);
		for (const tag of (t.project.skillTags as string[]) || []) {
			skillCount.set(tag, (skillCount.get(tag) || 0) + 1);
		}
	}

	const availableRanks = ["E", "D", "C", "B", "A", "S"].filter((r) => rankSet.has(r));
	const topSkillTags = [...skillCount.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8)
		.map(([tag]) => tag);

	const totalCount = allCompleted.length;
	const hasFilters = !!rankFilter || !!skillFilter;

	// ── Render ─────────────────────────────────────

	return (
		<>
			{/* Minimal public header */}
			<header className="flex h-14 items-center justify-between border-b border-border-color bg-background px-4">
				<div className="flex items-center gap-3">
					<Link href="/home" className="text-xl font-bold text-accent">
						RC
					</Link>
					<span className="hidden text-sm text-text-primary sm:inline">
						Robotics Club Showcase
					</span>
				</div>
				<Link
					href="/login"
					className="text-sm text-text-muted transition-colors hover:text-accent"
				>
					Sign in
				</Link>
			</header>

			{/* Content */}
			<main className="mx-auto max-w-6xl px-4 py-8">
				<div className="mb-8 space-y-4">
					<h1 className="text-3xl font-bold text-text-primary">Showcase</h1>
					<p className="text-text-muted">Completed projects by the Robotics Club</p>

					<FilterBar
						ranks={availableRanks}
						skillTags={topSkillTags}
						totalCount={totalCount}
					/>
				</div>

				{teams.length === 0 ? (
					<div className="py-16 text-center">
						<p className="text-lg font-semibold text-text-primary">
							{hasFilters ? "No projects match these filters" : "No projects yet"}
						</p>
						<p className="mt-1 text-sm text-text-muted">
							Completed projects will appear here.
						</p>
						{hasFilters && (
							<Link
								href="/showcase"
								className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
							>
								Clear filters
							</Link>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{teams.map((team) => (
							<ShowcaseCard key={team.id} team={team as any} />
						))}
					</div>
				)}
			</main>
		</>
	);
}
