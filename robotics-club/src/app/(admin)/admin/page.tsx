import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MemberControl } from "@/components/admin/MemberControl";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { Analytics } from "@/components/admin/Analytics";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { AccessSecurity } from "@/components/admin/AccessSecurity";

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
			where: { userId: { in: activeUsers.map((u: any) => u.id) }, team: { status: "COMPLETED" } },
			_count: true,
		});
		const completedMap = new Map(completedCounts.map((c: any) => [c.userId, c._count]));

		const activeMembers = activeUsers.map((u: any) => {
			const activeTeam = u.teams[0]?.team ?? null;
			const lastRead = u.notifications[0]?.readAt;
			return {
				id: u.id, login: u.login, name: u.name, image: u.avatar,
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

		const ser = (u: any) => ({ id: u.id, login: u.login, name: u.name, image: u.avatar, currentRank: u.currentRank, status: u.status, labAccessEnabled: u.labAccessEnabled, joinedAt: u.joinedAt.toISOString(), updatedAt: u.updatedAt.toISOString() });

		return (
			<MemberControl
				activeMembers={activeMembers}
				waitlist={waitlist.map(ser)}
				blackholed={blackholed.map(ser)}
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

		return (
			<ModerationQueue
				fabrication={fabReqs.map((f: any) => ({
					id: f.id, userName: f.user.name, userLogin: f.user.login, machineType: f.machineType,
					purpose: f.purpose, estimatedTime: f.estimatedMinutes, material: f.material,
					modelFileUrl: f.modelFileUrl, status: f.status,
				}))}
				materials={matReqs.map((m: any) => ({
					id: m.id, teamName: m.teamId, projectTitle: m.team.project.title,
					itemName: m.itemName, quantity: m.quantity, estimatedCost: m.estimatedCost,
					justification: m.justification, status: m.status,
				}))}
				proposals={proposals.map((p: any) => ({
					id: p.id, proposedByName: p.proposedBy.name, proposedByRank: p.proposedBy.currentRank,
					title: p.title, proposedRank: p.proposedRank, description: p.description,
					learningObjectives: p.learningObjectives, buildPlan: p.buildPlan, status: p.status,
				}))}
				conflicts={conflictFlags.map((c: any) => ({
					id: c.id, teamName: c.teamId, projectTitle: c.team.project.title,
					description: c.description, status: c.status,
					createdAt: c.createdAt.toISOString(), moderatorNote: c.moderatorNote,
				}))}
				damage={damageReports.map((d: any) => ({
					id: d.id, reporterName: d.reportedBy.name, itemDescription: d.itemName,
					estimatedValue: d.estimatedValue, description: d.description, status: d.status,
				}))}
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
		const rankDistribution = RANKS.map((r: any) => ({
			rank: r, count: rankDist.find((d: any) => d.currentRank === r)?._count ?? 0,
		}));

		const teamsByRank = await prisma.team.groupBy({
			by: ["rank", "status"], _count: true,
		});
		const completionRates = RANKS.map((r: any) => {
			const all = teamsByRank.filter((t: any) => t.rank === r);
			const total = all.reduce((s: any, t: any) => s + t._count, 0);
			const completed = all.filter((t: any) => t.status === "COMPLETED").reduce((s: any, t: any) => s + t._count, 0);
			return { rank: r, completed, total };
		});

		const fabStats = await prisma.fabricationRequest.groupBy({
			by: ["machineType", "status"], _count: true,
		});
		const machines = Array.from(new Set(fabStats.map((f: any) => f.machineType)));
		const equipment = machines.map((mt: any) => {
			const rows = fabStats.filter((f: any) => f.machineType === mt);
			return {
				machineType: mt,
				pending: rows.find((r: any) => r.status === "PENDING")?._count ?? 0,
				approved: rows.find((r: any) => r.status === "APPROVED")?._count ?? 0,
				completed: rows.find((r: any) => r.status === "COMPLETED")?._count ?? 0,
				rejected: rows.find((r: any) => r.status === "REJECTED")?._count ?? 0,
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
			const totalDays = evalTeams.reduce((sum: any, t: any) => {
				if (t.activatedAt && t.evaluations[0]?.completedAt) {
					return sum + (t.evaluations[0].completedAt.getTime() - t.activatedAt.getTime()) / 86400000;
				}
				return sum;
			}, 0);
			avgEvalDays = Math.round(totalDays / evalTeams.length);
		}

		return (
			<Analytics
				rankDistribution={rankDistribution}
				completionRates={completionRates}
				equipment={equipment}
				retention={{ total: totalUsers, activeAndAlumni }}
				blackholeEvents={recentBH.map((u: any) => ({ login: u.login, rank: u.currentRank, date: formatShortDate(u.updatedAt) }))}
				avgEvalDays={avgEvalDays}
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

		return (
			<ContentManagement
				projects={projects.map((p: any) => ({
					id: p.id, title: p.title, rank: p.rank, status: p.status,
					teamCount: p._count.teams, description: p.description,
					teamSizeMin: p.teamSizeMin, teamSizeMax: p.teamSizeMax,
					blackholeDays: p.blackholeDays,
					skillTags: (p.skillTags as string[]) || [],
					isUnique: p.isUnique,
					subjectSheetUrl: p.subjectSheetUrl, evaluationSheetUrl: p.evaluationSheetUrl,
				}))}
				userRole={userRole}
			/>
		);
	}

	// ═══════════════════════════════════════════════
	// SECTION: Access
	// ═══════════════════════════════════════════════
	if (section === "access") {
		const logs = await prisma.labAccessLog.findMany({
			take: 50, orderBy: { createdAt: "desc" },
			include: { user: { select: { name: true, login: true, avatar: true } } },
		});
		const flaggedCount = await prisma.labAccessLog.count({ where: { flagged: true } });
		const labAccessCount = await prisma.user.count({ where: { labAccessEnabled: true } });

		return (
			<AccessSecurity
				logs={logs.map((l: any) => ({
					id: l.id, userName: l.user.name, userLogin: l.user.login,
					userImage: l.user.avatar, method: l.method, success: l.success,
					flagged: l.flagged, note: l.note, timestamp: l.createdAt.toISOString(),
				}))}
				flaggedCount={flaggedCount}
				labAccessCount={labAccessCount}
				userRole={userRole}
			/>
		);
	}

	// Fallback
	redirect("/admin?section=members");
}
