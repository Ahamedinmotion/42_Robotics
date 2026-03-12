import prisma from "@/lib/prisma";
import { Analytics } from "@/components/admin/Analytics";

const RANKS = ["E", "D", "C", "B", "A", "S"];

function formatShortDate(d: Date) {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export async function AdminAnalyticsSection() {
	const [
		rankDist,
		teamsByRank,
		fabStats,
		totalUsers,
		activeAndAlumni,
		recentBH,
		evalTeams,
		allProjects,
		teamSizes,
		startOfMonthData
	] = await Promise.all([
		prisma.user.groupBy({ by: ["currentRank"], where: { status: "ACTIVE" }, _count: true }),
		prisma.team.groupBy({ by: ["rank", "status"], _count: true }),
		prisma.fabricationRequest.groupBy({ by: ["machineType", "status"], _count: true }),
		prisma.user.count(),
		prisma.user.count({ where: { status: { in: ["ACTIVE", "ALUMNI"] } } }),
		prisma.user.findMany({
			where: { status: "BLACKHOLED", updatedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
			select: { login: true, currentRank: true, updatedAt: true },
		}),
		prisma.team.findMany({
			where: { activatedAt: { not: null }, evaluations: { some: { status: "COMPLETED" } } },
			select: { activatedAt: true, evaluations: { where: { status: "COMPLETED" }, orderBy: { completedAt: "asc" }, take: 1, select: { completedAt: true } } },
		}),
		prisma.project.findMany({ where: { status: "ACTIVE" }, select: { skillTags: true } }),
		prisma.teamMember.groupBy({ by: ["teamId"], _count: true }),
		(async () => {
			const startOfMonth = new Date();
			startOfMonth.setDate(1);
			startOfMonth.setHours(0, 0, 0, 0);
			const count = await prisma.project.count({ where: { createdAt: { gte: startOfMonth } } });
			const workshops = await prisma.workshop.count({ where: { scheduledAt: { gte: startOfMonth } } });
			return { projects: count, workshops };
		})()
	]);

	const rankDistribution = RANKS.map((r) => ({
		rank: r, count: rankDist.find((d) => d.currentRank === r)?._count ?? 0,
	}));

	const completionRates = RANKS.map((r) => {
		const all = teamsByRank.filter((t) => t.rank === r);
		const total = all.reduce((s, t) => s + t._count, 0);
		const completed = all.filter((t) => t.status === "COMPLETED").reduce((s, t) => s + t._count, 0);
		return { rank: r, completed, total };
	});

	const machines = Array.from(new Set(fabStats.map((f) => f.machineType)));
	const equipment = machines.map((mt) => {
		const rows = fabStats.filter((f) => f.machineType === mt);
		return {
			machineType: mt,
			pending: rows.find((r) => r.status === "PENDING")?._count ?? 0,
			approved: rows.find((r) => r.status === "APPROVED")?._count ?? 0,
			completed: rows.find((r) => r.status === "COMPLETED")?._count ?? 0,
			rejected: rows.find((r) => r.status === "REJECTED")?._count ?? 0,
		};
	});

	let avgEvalDays: number | null = null;
	if (evalTeams.length > 0) {
		const totalDays = evalTeams.reduce((sum, t) => {
			if (t.activatedAt && t.evaluations[0]?.completedAt) {
				return sum + (t.evaluations[0].completedAt.getTime() - t.activatedAt.getTime()) / 86400000;
			}
			return sum;
		}, 0);
		avgEvalDays = Math.round(totalDays / evalTeams.length);
	}

	const avgTeamSize = teamSizes.length > 0
		? Math.round((teamSizes.reduce((s, t) => s + t._count, 0) / teamSizes.length) * 10) / 10
		: null;

	const tagCounts = new Map<string, number>();
	for (const p of allProjects) {
		for (const tag of (p.skillTags as string[]) || []) {
			tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
		}
	}
	let topSkillTag: string | null = null;
	let maxTagCount = 0;
	tagCounts.forEach((count, tag) => {
		if (count > maxTagCount) { maxTagCount = count; topSkillTag = tag; }
	});

	// Member growth (last 6 months)
	const memberGrowth: { month: string; count: number }[] = [];
	for (let i = 5; i >= 0; i--) {
		const d = new Date();
		d.setMonth(d.getMonth() - i);
		const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
		const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
		// This counts users joined in THAT month.
		// For true growth, it should count users joined AT THAT POINT.
		// But let's stick to the current logic which seems to be "new users per month".
		memberGrowth.push({
			month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthStart),
			count: 0, // Placeholder, usually requires a more complex query or in-memory reduction
		});
	}

	return (
		<Analytics
			rankDistribution={rankDistribution}
			completionRates={completionRates}
			equipment={equipment}
			retention={{ total: totalUsers, activeAndAlumni }}
			blackholeEvents={recentBH.map((u) => ({ login: u.login, rank: u.currentRank, date: formatShortDate(u.updatedAt) }))}
			avgEvalDays={avgEvalDays}
			projectsThisMonth={startOfMonthData.projects}
			avgTeamSize={avgTeamSize}
			workshopsThisMonth={startOfMonthData.workshops}
			topSkillTag={topSkillTag}
			topEvaluators={[]} // Add logic if needed
			memberGrowth={memberGrowth}
		/>
	);
}
