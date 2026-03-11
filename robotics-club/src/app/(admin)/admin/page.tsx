import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MemberControl } from "@/components/admin/MemberControl";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { Analytics } from "@/components/admin/Analytics";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { AccessSecurity } from "@/components/admin/AccessSecurity";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { MoodBoard } from "@/components/admin/MoodBoard";
import { AchievementEditor } from "@/components/admin/AchievementEditor";
import { AuditLogView } from "@/components/admin/AuditLogView";

// ── Helpers ──────────────────────────────────────────

function daysAgoFrom(date: Date) {
	return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function formatShortDate(d: Date) {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

const RANKS = ["E", "D", "C", "B", "A", "S"];

// ── Page ─────────────────────────────────────────────

export default async function AdminPage({
	searchParams,
}: {
	searchParams: { section?: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");
	if (session.user.role === "STUDENT") redirect("/home");

	const section = searchParams.section || "members";
	const userRole = session.user.role;

	// ═══════════════════════════════════════════════
	// SECTION: Members
	// ═══════════════════════════════════════════════
	if (section === "members") {
		const activeUsers = await prisma.user.findMany({
			where: { status: "ACTIVE" },
			include: {
				teams: {
					where: { team: { status: { in: ["ACTIVE", "EVALUATING"] } } },
					include: { team: { include: { project: { select: { title: true } } } } },
					take: 1,
				},
				notifications: { where: { readAt: { not: null } }, orderBy: { readAt: "desc" }, take: 1, select: { readAt: true } },
				_count: { select: { teams: true } },
			},
			orderBy: { name: "asc" },
		});

		const completedCounts = await prisma.teamMember.groupBy({
			by: ["userId"],
			where: { userId: { in: activeUsers.map((u) => u.id) }, team: { status: "COMPLETED" } },
			_count: true,
		});
		const completedMap = new Map(completedCounts.map((c) => [c.userId, c._count]));

		const activeMembers = activeUsers.map((u) => {
			const activeTeam = u.teams[0]?.team ?? null;
			const lastRead = u.notifications[0]?.readAt;
			return {
				id: u.id, login: u.login, name: u.name, image: u.image,
				currentRank: u.currentRank, status: u.status,
				labAccessEnabled: u.labAccessEnabled,
				joinedAt: u.joinedAt.toISOString(), updatedAt: u.updatedAt.toISOString(),
				projectTitle: activeTeam?.project?.title ?? null,
				teamId: activeTeam?.id ?? null,
				blackholeDeadline: activeTeam?.blackholeDeadline?.toISOString() ?? null,
				daysAgo: lastRead ? daysAgoFrom(lastRead) : daysAgoFrom(u.joinedAt),
				completedCount: completedMap.get(u.id) || 0,
			};
		});

		const waitlist = await prisma.user.findMany({
			where: { status: "WAITLIST" }, orderBy: { joinedAt: "asc" },
		});
		const blackholed = await prisma.user.findMany({ where: { status: "BLACKHOLED" } });
		const alumniRaw = await prisma.user.findMany({
			where: { status: "ALUMNI" }, include: { alumniEvaluatorOptIn: true },
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ser = (u: any) => ({ ...u, joinedAt: u.joinedAt.toISOString(), updatedAt: u.updatedAt.toISOString() });

		return (
			<MemberControl
				activeMembers={activeMembers}
				waitlist={waitlist.map(ser)}
				blackholed={blackholed.map(ser)}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				alumni={alumniRaw.map((u: any) => ({ ...ser(u), alumniOptedIn: u.alumniEvaluatorOptIn?.isActive ?? false }))}
				activeCount={activeMembers.length}
			/>
		);
	}

	// ═══════════════════════════════════════════════
	// SECTION: Queue
	// ═══════════════════════════════════════════════
	if (section === "queue") {
		const [fabReqs, matReqs, proposals, conflictFlags, damageReports] = await Promise.all([
			prisma.fabricationRequest.findMany({
				where: { status: "PENDING" },
				include: { user: { select: { name: true, login: true } }, team: { select: { id: true } } },
			}),
			prisma.materialRequest.findMany({
				where: { status: "PENDING" },
				include: { team: { include: { project: { select: { title: true } } } }, requestedBy: { select: { name: true } } },
			}),
			prisma.projectProposal.findMany({
				where: { status: "PENDING" },
				include: { proposedBy: { select: { name: true, currentRank: true } } },
			}),
			prisma.conflictFlag.findMany({
				where: { status: "OPEN" },
				select: { id: true, teamId: true, description: true, status: true, createdAt: true, moderatorNote: true, team: { select: { project: { select: { title: true } } } } },
			}),
			prisma.damageReport.findMany({
				where: { status: { in: ["REPORTED", "UNDER_REVIEW"] } },
				include: { reportedBy: { select: { name: true } } },
			}),
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapFab = (f: any) => ({
			id: f.id, userName: f.user.name, userLogin: f.user.login, machineType: f.machineType,
			purpose: f.purpose, estimatedTime: f.estimatedMinutes, material: f.material,
			modelFileUrl: f.modelFileUrl, status: f.status,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapMat = (m: any) => ({
			id: m.id, teamName: m.teamId, projectTitle: m.team.project.title,
			itemName: m.itemName, quantity: m.quantity, estimatedCost: m.estimatedCost,
			justification: m.justification, status: m.status,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapProp = (p: any) => ({
			id: p.id, proposedByName: p.proposedBy.name, proposedByRank: p.proposedBy.currentRank,
			title: p.title, proposedRank: p.proposedRank, description: p.description,
			learningObjectives: p.learningObjectives, buildPlan: p.buildPlan, status: p.status,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapConf = (c: any) => ({
			id: c.id, teamName: c.teamId, projectTitle: c.team.project.title,
			description: c.description, status: c.status,
			createdAt: c.createdAt.toISOString(), moderatorNote: c.moderatorNote,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapDam = (d: any) => ({
			id: d.id, reporterName: d.reportedBy.name, itemDescription: d.itemName,
			estimatedValue: d.estimatedValue, description: d.description, status: d.status,
		});

		return (
			<ModerationQueue
				fabrication={fabReqs.map(mapFab)}
				materials={matReqs.map(mapMat)}
				proposals={proposals.map(mapProp)}
				conflicts={conflictFlags.map(mapConf)}
				damage={damageReports.map(mapDam)}
			/>
		);
	}

	// ═══════════════════════════════════════════════
	// SECTION: Analytics
	// ═══════════════════════════════════════════════
	if (section === "analytics") {
		const rankDist = await prisma.user.groupBy({
			by: ["currentRank"], where: { status: "ACTIVE" }, _count: true,
		});
		const rankDistribution = RANKS.map((r) => ({
			rank: r, count: rankDist.find((d) => d.currentRank === r)?._count ?? 0,
		}));

		const teamsByRank = await prisma.team.groupBy({
			by: ["rank", "status"], _count: true,
		});
		const completionRates = RANKS.map((r) => {
			const all = teamsByRank.filter((t) => t.rank === r);
			const total = all.reduce((s, t) => s + t._count, 0);
			const completed = all.filter((t) => t.status === "COMPLETED").reduce((s, t) => s + t._count, 0);
			return { rank: r, completed, total };
		});

		const fabStats = await prisma.fabricationRequest.groupBy({
			by: ["machineType", "status"], _count: true,
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

		const totalUsers = await prisma.user.count();
		const activeAndAlumni = await prisma.user.count({ where: { status: { in: ["ACTIVE", "ALUMNI"] } } });

		const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
		const recentBH = await prisma.user.findMany({
			where: { status: "BLACKHOLED", updatedAt: { gte: thirtyDaysAgo } },
			select: { login: true, currentRank: true, updatedAt: true },
		});

		// Eval throughput
		const evalTeams = await prisma.team.findMany({
			where: { activatedAt: { not: null }, evaluations: { some: { status: "COMPLETED" } } },
			select: { activatedAt: true, evaluations: { where: { status: "COMPLETED" }, orderBy: { completedAt: "asc" }, take: 1, select: { completedAt: true } } },
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

		// ── New analytics data ──────────────────

		// Projects created this month
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);
		const projectsThisMonth = await prisma.project.count({
			where: { createdAt: { gte: startOfMonth } },
		});

		// Avg team size
		const teamSizes = await prisma.teamMember.groupBy({
			by: ["teamId"], _count: true,
		});
		const avgTeamSize = teamSizes.length > 0
			? Math.round((teamSizes.reduce((s, t) => s + t._count, 0) / teamSizes.length) * 10) / 10
			: null;

		// Workshops this month
		const workshopsThisMonth = await prisma.workshop.count({
			where: { scheduledAt: { gte: startOfMonth } },
		});

		// Top skill tag
		const allProjects = await prisma.project.findMany({
			where: { status: "ACTIVE" }, select: { skillTags: true },
		});
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

		// Top evaluators
		const topEvalsRaw = await prisma.evaluation.groupBy({
			by: ["evaluatorId"],
			where: { status: "COMPLETED" },
			_count: true,
			orderBy: { _count: { evaluatorId: "desc" } },
			take: 5,
		});
		const topEvalUsers = await prisma.user.findMany({
			where: { id: { in: topEvalsRaw.map((e) => e.evaluatorId) } },
			select: { id: true, login: true, name: true },
		});
		const topEvaluators = topEvalsRaw.map((e) => {
			const u = topEvalUsers.find((u) => u.id === e.evaluatorId);
			return { login: u?.login || "", name: u?.name || "", count: e._count };
		});

		// Member growth (last 6 months)
		const memberGrowth: { month: string; count: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const d = new Date();
			d.setMonth(d.getMonth() - i);
			const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
			const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
			const count = await prisma.user.count({
				where: { joinedAt: { gte: monthStart, lte: monthEnd } },
			});
			memberGrowth.push({
				month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthStart),
				count,
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
				projectsThisMonth={projectsThisMonth}
				avgTeamSize={avgTeamSize}
				workshopsThisMonth={workshopsThisMonth}
				topSkillTag={topSkillTag}
				topEvaluators={topEvaluators}
				memberGrowth={memberGrowth}
			/>
		);
	}

	// ═══════════════════════════════════════════════
	// SECTION: Content
	// ═══════════════════════════════════════════════
	if (section === "content") {
		const projects = await prisma.project.findMany({
			orderBy: [{ rank: "asc" }, { title: "asc" }],
			include: { _count: { select: { teams: true } } },
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapProj = (p: any) => ({
			id: p.id, title: p.title, rank: p.rank, status: p.status,
			teamCount: p._count.teams, description: p.description,
			teamSizeMin: p.teamSizeMin, teamSizeMax: p.teamSizeMax,
			blackholeDays: p.blackholeDays,
			skillTags: (p.skillTags as string[]) || [],
			isUnique: p.isUnique,
			subjectSheetUrl: p.subjectSheetUrl, evaluationSheetUrl: p.evaluationSheetUrl,
		});

		return (
			<ContentManagement
				projects={projects.map(mapProj)}
				userRole={userRole}
			/>
		);
	}

	// ═══════════════════════════════════════════════
	// SECTION: Access
	// ═══════════════════════════════════════════════
	if (section === "access") {
		const [logs, flaggedCount, membersWithAccess] = await Promise.all([
			prisma.labAccessLog.findMany({
				take: 50, orderBy: { createdAt: "desc" },
				include: { user: { select: { name: true, login: true, image: true } } },
			}),
			prisma.labAccessLog.count({ where: { flagged: true } }),
			prisma.user.findMany({
				where: { labAccessEnabled: true },
				select: { id: true, login: true, name: true, image: true },
				orderBy: { login: "asc" }
			})
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const mapLog = (l: any) => ({
			id: l.id, userName: l.user.name, userLogin: l.user.login,
			userImage: l.user.image, method: l.method, success: l.success,
			flagged: l.flagged, note: l.note, timestamp: l.createdAt.toISOString(),
		});

		return (
			<AccessSecurity
				logs={logs.map(mapLog)}
				flaggedCount={flaggedCount}
				membersWithAccess={membersWithAccess}
				labAccessCount={membersWithAccess.length}
				userRole={userRole}
			/>
		);
	}

	// ═══════════════════════════════════════════════
	// SECTION: Board (Mood Board)
	// ═══════════════════════════════════════════════
	if (section === "board") {
		return <MoodBoard />;
	}

	// ═══════════════════════════════════════════════
	// SECTION: Achievements
	// ═══════════════════════════════════════════════
	if (section === "achievements") {
		return <AchievementEditor />;
	}

	// ═══════════════════════════════════════════════
	// SECTION: Audit Log
	// ═══════════════════════════════════════════════
	if (section === "audit" && userRole === "PRESIDENT") {
		return <AuditLogView />;
	}

	// ═══════════════════════════════════════════════
	// SECTION: Roles
	// ═══════════════════════════════════════════════
	if (section === "roles" && userRole === "PRESIDENT") {
		const allUsers = await prisma.user.findMany({
			select: { id: true, login: true, name: true, image: true, role: true, adminPermissions: true },
			orderBy: [{ role: 'asc' }, { name: 'asc' }]
		});

		return <RoleManagement initialUsers={allUsers as any} />;
	}

	// Fallback
	redirect("/admin?section=members");
}
