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

export default async function ProfilePage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");
	const userId = session.user.id;

	// ── Fetch user ────────────────────────────────
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			skillProgress: { orderBy: { projectsCompleted: "desc" } },
			achievements: {
				include: { achievement: true },
				orderBy: { unlockedAt: "desc" },
			},
			alumniEvaluatorOptIn: true,
		},
	});
	if (!user) redirect("/login");

	// ── Completed teams ───────────────────────────
	const completedTeams = await prisma.teamMember.findMany({
		where: { userId, team: { status: TeamStatus.COMPLETED } },
		include: {
			team: {
				include: {
					project: { select: { title: true, rank: true, skillTags: true } },
					members: {
						include: { user: { select: { login: true, avatar: true } } },
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
						include: { user: { select: { login: true, avatar: true } } },
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

	// ── All achievements (for locked/unlocked grid) ─
	const allAchievements = await prisma.achievement.findMany({
		orderBy: { title: "asc" },
	});

	// Derive title (most recent achievement)
	const title = user.achievements[0]?.achievement?.title ?? null;

	// ── Render ─────────────────────────────────────
	return (
		<div className="space-y-6">
			{/* Section 1 — Header */}
			<ProfileHeader
				user={user}
				title={title}
				completedProjects={completedTeams.length}
				evalsGiven={evalsGivenCount}
			/>

			{/* Section 2 — Skill Radar */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Skill Profile
				</h3>
				<SkillRadar
					skills={user.skillProgress.map((s) => ({
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

			{/* Section 5 — Achievements */}
			<Card className="space-y-3" id="achievements">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Achievements
				</h3>
				<AchievementsGrid
					allAchievements={allAchievements}
					userAchievements={user.achievements.map((ua) => ({
						achievementId: ua.achievementId,
						unlockedAt: ua.unlockedAt,
					}))}
				/>
			</Card>

			{/* Section 6 — Alumni Evaluator (conditional) */}
			{user.status === "ALUMNI" && (
				<Card>
					<AlumniToggle isOptedIn={user.alumniEvaluatorOptIn?.isActive ?? false} />
				</Card>
			)}
		</div>
	);
}
