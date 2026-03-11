import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TeamStatus, EvaluationStatus } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SkillRadar } from "@/components/profile/SkillRadar";
import { ProjectHistory } from "@/components/profile/ProjectHistory";
import { AchievementsGrid } from "@/components/profile/AchievementsGrid";

export default async function PublicProfilePage({
	params,
}: {
	params: { id: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const targetId = params.id;

	// If viewing own profile, redirect to /profile
	if (targetId === session.user.id) redirect("/profile");

	// ── Fetch public profile ──────────────────────
	const user = await prisma.user.findUnique({
		where: { id: targetId },
		select: {
			id: true,
			login: true,
			name: true,
			image: true,
			currentRank: true,
			status: true,
			joinedAt: true,
			githubHandle: true,
			skillProgress: { orderBy: { projectsCompleted: "desc" } },
			achievements: {
				include: { achievement: true },
				orderBy: { unlockedAt: "desc" },
			},
		},
	});

	if (!user) notFound();

	// ── Completed teams (public) ──────────────────
	const completedTeams = await prisma.teamMember.findMany({
		where: { userId: targetId, team: { status: TeamStatus.COMPLETED } },
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

	// ── Eval count ────────────────────────────────
	const evalsGivenCount = await prisma.evaluation.count({
		where: { evaluatorId: targetId, status: EvaluationStatus.COMPLETED },
	});

	// ── All achievements for grid ─────────────────
	const allAchievements = await prisma.achievement.findMany({
		orderBy: { title: "asc" },
	});

	const title = user.achievements[0]?.achievement?.title ?? null;

	// ── Render ─────────────────────────────────────
	return (
		<div className="space-y-6">
			<ProfileHeader
				user={user}
				title={title}
				completedProjects={completedTeams.length}
				evalsGiven={evalsGivenCount}
			/>

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

			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Project History
				</h3>
				<ProjectHistory teams={completedTeams} />
			</Card>

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
		</div>
	);
}
