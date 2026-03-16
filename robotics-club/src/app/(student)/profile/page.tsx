import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TeamStatus, EvaluationStatus } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { ProjectHistory } from "@/components/profile/ProjectHistory";
import { TeamHistory } from "@/components/profile/TeamHistory";
import { AchievementsGrid } from "@/components/profile/AchievementsGrid";
import { AlumniToggle } from "@/components/profile/AlumniToggle";
import { ComplimentWall } from "@/components/profile/ComplimentWall";
import { TitleSelector } from "@/components/profile/TitleSelector";
import { AdminNotesSection } from "@/components/profile/AdminNotesSection";
import { ActiveMissions } from "@/components/profile/ActiveMissions";

export default async function ProfilePage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");
	const userId = session.user.id;
	const isAdmin = !!(session.user as any).isAdmin;

	// ── Fetch user ────────────────────────────────
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			skillProgress: { orderBy: { projectsCompleted: "desc" } },
			achievements: {
				include: { achievement: { include: { unlockedTitle: true } } } as any,
				orderBy: { unlockedAt: "desc" },
			},
			userTitles: {
				include: { title: true },
				orderBy: { unlockedAt: "desc" }
			},
			alumniEvaluatorOptIn: true,
		} as any,
	});
	if (!user) redirect("/login");

	// ── Active Missions ────────────────────────────
	const activeTeams = await prisma.teamMember.findMany({
		where: { 
			userId, 
			team: { 
				status: { in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING] } 
			} 
		},
		include: {
			team: {
				include: {
					project: { select: { title: true, rank: true } },
					members: {
						include: { user: { select: { login: true, id: true } } },
					},
				},
			},
		},
		orderBy: { team: { createdAt: "desc" } },
	});

	// ── Completed teams ───────────────────────────
	const completedTeams = await prisma.teamMember.findMany({
		where: { userId, team: { status: TeamStatus.COMPLETED } },
		include: {
			team: {
				include: {
					project: { select: { title: true, rank: true, skillTags: true } },
					members: {
						include: { user: { select: { login: true, image: true } } },
					},
					leader: { select: { githubHandle: true } },
				},
			},
		},
		orderBy: { team: { updatedAt: "desc" } },
	});

	// ── All team history ──────────────────────────
	const allTeams = await prisma.teamMember.findMany({
		where: { userId },
		include: {
			team: {
				include: {
					project: { select: { title: true } },
					members: {
						include: { user: { select: { login: true, image: true } } },
					},
				},
			},
		},
		orderBy: { team: { updatedAt: "desc" } },
	});

	// ── Counts ────────────────────────────────────
	const evalsGivenCount = await prisma.evaluation.count({
		where: { evaluatorId: userId, status: EvaluationStatus.COMPLETED },
	});

	// ── milestone projects (flashback) ────────────
	const milestones = completedTeams.map(ct => ({
		title: ct.team.project.title,
		timestamp: ct.team.updatedAt,
	})).reverse(); // Oldest first

	// ── Fun Stats ─────────────────────────────────
	const labLogs = await prisma.labAccessLog.count({
		where: { userId, success: true },
	});
	const totalLabHours = Math.round(labLogs * 1.5); // Heuristic: 1.5h per login

	const reports = await prisma.weeklyReport.findMany({
		where: { submittedById: userId },
		select: { summary: true },
	});
	
	let longestReportWords = 0;
	const wordCounts: Record<string, number> = {};
	const stopWords = new Set(["the", "a", "an", "is", "in", "of", "to", "and", "that", "it", "for", "on", "with", "as", "was", "are", "be", "this", "have", "or"]);

	reports.forEach(r => {
		const words = r.summary.split(/\s+/).filter(w => w.length > 0);
		longestReportWords = Math.max(longestReportWords, words.length);
		words.forEach(w => {
			const sanitized = w.toLowerCase().replace(/[^a-z]/g, "");
			if (sanitized && !stopWords.has(sanitized)) {
				wordCounts[sanitized] = (wordCounts[sanitized] || 0) + 1;
			}
		});
	});

	const mostUsedWord = Object.entries(wordCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "None";

	const ungodlyEvals = await prisma.evaluation.count({
		where: {
			evaluatorId: userId,
			status: EvaluationStatus.COMPLETED,
			createdAt: {
				// This is tricky with prisma alone for "hour of day", but we can fetch them and filter
				// or just use a raw query. Let's fetch the timestamps.
			}
		}
	});
	
	// Simplified: fetch all eval timestamps and filter
	const allEvals = await prisma.evaluation.findMany({
		where: { evaluatorId: userId, status: EvaluationStatus.COMPLETED },
		select: { createdAt: true }
	});
	const ungodlyCount = allEvals.filter(e => {
		const hour = e.createdAt.getHours();
		return hour >= 0 && hour <= 5;
	}).length;

	const funStats = {
		totalLabHours,
		longestReportWords,
		mostUsedWord,
		ungodlyCount
	};

	// ── Admin Notes ───────────────────────────────
	const adminNotes = isAdmin ? await prisma.adminNote.findMany({
		where: { targetUserId: userId },
		include: { author: { select: { login: true } } },
		orderBy: { createdAt: "desc" }
	}) : [];

	// ── All achievements (for locked/unlocked grid) ─
	const allAchievements = await prisma.achievement.findMany({
		orderBy: { title: "asc" },
	});

	// ── Render ─────────────────────────────────────
	const u = user as any;
	// Derive title (most recent achievement)
	const title = (u.achievements?.[0] as any)?.achievement?.title ?? null;
	return (
		<div className="space-y-6">
			{/* Section 1 — Header */}
			<ProfileHeader
				user={{
					...u,
					id: u.id,
					skillProgress: u.skillProgress,
					isOwn: true,
				} as any}
				title={title}
				completedProjects={completedTeams.length}
				evalsGiven={evalsGivenCount}
				milestones={milestones}
				funStats={funStats}
			/>

			{isAdmin && <AdminNotesSection userId={userId} />}

			{/* Section 1.5 — Active Missions */}
			{activeTeams.length > 0 && (
				<ActiveMissions 
					teams={activeTeams.map(at => at.team)} 
					currentUserId={userId} 
				/>
			)}

			<div className="flex justify-end pt-2">
				<TitleSelector
					initialTitle={u.equippedTitle}
					unlockedTitles={u.userTitles.map((ut: any) => ut.title.name)}
				/>
			</div>

			{/* Section 2 — Skill Radar */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Skill Profile
				</h3>
				<SkillRadar
					skills={u.skillProgress.map((s: any) => ({
						skillTag: s.skillTag,
						projectsCompleted: s.projectsCompleted,
					}))}
				/>
			</Card>

			{/* Section 3 — Project History */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Project History
				</h3>
				<ProjectHistory teams={completedTeams as any} />
			</Card>

			{/* Section 4 — Team History */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Team History
				</h3>
				<p className="text-xs text-text-muted">All past teammates across every project</p>
				<TeamHistory teams={allTeams as any} currentUserId={userId} />
			</Card>

			{/* Section 5 — Compliments */}
			<ComplimentWall />

			{/* Section 6 — Achievements awareness */}
			<Card className="space-y-3" id="achievements">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Achievements
				</h3>
				<AchievementsGrid
					allAchievements={allAchievements}
					userAchievements={u.achievements.map((ua: any) => ({
						achievementId: ua.achievementId,
						unlockedAt: ua.unlockedAt.toISOString(),
					}))}
				/>
			</Card>

			{/* Section 7 — Alumni Evaluator (conditional) */}
			{u.status === "ALUMNI" && (
				<Card>
					<AlumniToggle isOptedIn={u.alumniEvaluatorOptIn?.isActive ?? false} />
				</Card>
			)}
		</div>
	);
}
