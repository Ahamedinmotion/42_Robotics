import { redirect } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
// @ts-ignore
import { TeamStatus, EvaluationStatus } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BlackholeTimer } from "@/components/ui/BlackholeTimer";
import { NotificationList } from "@/components/home/NotificationList";
import { WorkshopRsvpButton } from "@/components/home/WorkshopRsvpButton";

// ── Helpers ──────────────────────────────────────────

const iconEmoji: Record<string, string> = {
	star: "⭐",
	rocket: "🚀",
	clock: "⏰",
	brain: "🧠",
	flag: "🚩",
	lightbulb: "💡",
	eye: "👁",
	crown: "👑",
};

function formatMonthYear(date: Date) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function formatEventDate(date: Date) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

function daysAgo(date: Date) {
	const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
	if (diff === 0) return "today";
	if (diff === 1) return "1 day ago";
	return `${diff} days ago`;
}

// ── Inline sub-component ────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="text-center">
			<p className="text-xl font-bold text-accent">{value}</p>
			<p className="text-xs text-text-muted">{label}</p>
		</div>
	);
}

// ── Page ─────────────────────────────────────────────

export default async function HomePage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const now = new Date();
	const userId = session.user.id;

	// ── 1. Current user ─────────────────────────
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			teams: {
				where: {
					team: { status: { in: [TeamStatus.ACTIVE, TeamStatus.EVALUATING] } },
				},
				include: {
					team: {
						include: {
							project: true,
							members: {
								include: {
									user: { select: { id: true, login: true, image: true } },
								},
							},
							weeklyReports: { orderBy: { createdAt: "desc" }, take: 1 },
							evaluationSlots: {
								where: { status: "OPEN" },
								take: 1,
							},
						},
					},
				},
				take: 1,
			},
			achievements: {
				include: { achievement: true },
				orderBy: { unlockedAt: "desc" },
				take: 3,
			},
			_count: {
				select: {
					evaluationsGiven: { where: { status: EvaluationStatus.COMPLETED } },
				},
			},
		},
	});

	if (!user) redirect("/login");

	const completedTeamsCount = await prisma.teamMember.count({
		where: { userId, team: { status: TeamStatus.COMPLETED } },
	});

	// ── 2. Unread notifications ─────────────────
	const unreadNotifications = await prisma.notification.findMany({
		where: { userId, readAt: null, deliverAt: { lte: now } },
		orderBy: { createdAt: "desc" },
		take: 5,
	});

	const unreadCount = await prisma.notification.count({
		where: { userId, readAt: null, deliverAt: { lte: now } },
	});

	// ── 3. Upcoming workshops ──────────────────
	const workshops = await prisma.workshop.findMany({
		where: { scheduledAt: { gt: now } },
		orderBy: { scheduledAt: "asc" },
		take: 2,
		include: {
			host: { select: { name: true, login: true } },
			rsvps: { where: { status: "GOING" } },
		},
	});

	// Check user RSVP status for each workshop
	const userRsvps = await prisma.workshopRSVP.findMany({
		where: { userId, workshopId: { in: workshops.map((w: any) => w.id) } },
	});
	const rsvpMap = new Map(userRsvps.map((r: any) => [r.workshopId, r.status]));

	// ── Derived data ───────────────────────────
	const activeTeamMember = user.teams[0] ?? null;
	const activeTeam = activeTeamMember?.team ?? null;
	const lastReport = activeTeam?.weeklyReports[0] ?? null;
	const openEvalSlot = activeTeam?.evaluationSlots[0] ?? null;

	// ── Render ─────────────────────────────────

	return (
		<div className="space-y-6">
			{/* ── Identity Strip ──────────────────────── */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="flex items-center gap-4">
					{user.avatar ? (
						<Image
							src={user.avatar}
							alt={user.login}
							width={48}
							height={48}
							className="h-12 w-12 rounded-full border border-border-color object-cover"
						/>
					) : (
						<div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-color bg-panel2 text-lg font-bold text-text-muted">
							{user.login.charAt(0).toUpperCase()}
						</div>
					)}
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
							<Badge rank={user.currentRank as any} size="lg" />
						</div>
						<p className="text-sm text-text-muted">@{user.login}</p>
					</div>
				</div>

				<div className="flex gap-6">
					<StatCard label="Projects" value={completedTeamsCount} />
					<StatCard label="Evals Given" value={user._count.evaluationsGiven} />
					<StatCard label="Rank" value={user.currentRank} />
					<StatCard label="Member Since" value={formatMonthYear(user.joinedAt)} />
				</div>
			</div>

			{/* ── 3-Column Grid ──────────────────────── */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{/* ── Left Column (2/3) ────────────────── */}
				<div className="space-y-6 md:col-span-2">
					{/* Current Project Card */}
					{activeTeam ? (
						<Card glowing className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<h2 className="text-lg font-bold text-text-primary">
										{activeTeam.project.title}
									</h2>
									<Badge rank={activeTeam.project.rank as any} size="sm" />
								</div>
								<span
									className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${activeTeam.status === TeamStatus.ACTIVE
										? "bg-green-900/40 text-green-400"
										: "bg-orange-900/40 text-orange-400"
										}`}
								>
									{activeTeam.status}
								</span>
							</div>

							{activeTeam.blackholeDeadline && activeTeam.activatedAt && (
								<BlackholeTimer
									deadline={activeTeam.blackholeDeadline}
									activatedAt={activeTeam.activatedAt}
								/>
							)}

							<div>
								<p className="mb-1 text-xs text-text-muted">Team</p>
								<div className="flex -space-x-2">
									{activeTeam.members.map((m: any) =>
										m.user.avatar ? (
											<Image
												key={m.user.id}
												src={m.user.avatar}
												alt={m.user.login}
												title={m.user.login}
												width={24}
												height={24}
												className="h-6 w-6 rounded-full border-2 border-background object-cover"
											/>
										) : (
											<div
												key={m.user.id}
												title={m.user.login}
												className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-panel2 text-[10px] font-bold text-text-muted"
											>
												{m.user.login.charAt(0).toUpperCase()}
											</div>
										)
									)}
								</div>
							</div>

							<div className="flex items-center justify-between border-t border-border-color pt-3">
								<p className="text-xs text-text-muted">
									{lastReport
										? `Last report: ${daysAgo(lastReport.createdAt)}`
										: "No report submitted yet"}
								</p>
								<div className="flex gap-2">
									<Button variant="secondary" size="sm" href="/cursus?tab=project">
										Submit Report
									</Button>
									<Button variant="primary" size="sm" href="/cursus?tab=project">
										View Project
									</Button>
								</div>
							</div>
						</Card>
					) : (
						<Card className="border-dashed">
							<div className="space-y-2 py-4 text-center">
								<p className="font-semibold text-text-primary">No active project</p>
								<p className="text-sm text-text-muted">
									Head to the Cursus to activate a project and start building.
								</p>
								<Button variant="primary" href="/cursus">
									Browse Projects
								</Button>
							</div>
						</Card>
					)}

					{/* Notifications & Actions Panel */}
					<Card className="space-y-3">
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
								Notifications
							</h3>
							{unreadCount > 0 && (
								<span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-urgency px-1.5 text-[10px] font-bold text-white">
									{unreadCount}
								</span>
							)}
						</div>
						<NotificationList
							notifications={unreadNotifications.map((n: any) => ({
								id: n.id,
								type: n.type,
								title: n.title,
								body: n.body,
								createdAt: n.createdAt.toISOString(),
								readAt: n.readAt?.toISOString() ?? null,
							}))}
						/>
					</Card>
				</div>

				{/* ── Right Column (1/3) ───────────────── */}
				<div className="space-y-6">
					{/* Upcoming Events */}
					<Card className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
							Upcoming
						</h3>
						{!openEvalSlot && workshops.length === 0 ? (
							<p className="text-sm italic text-text-muted">Nothing scheduled</p>
						) : (
							<div className="space-y-3">
								{openEvalSlot && (
									<div className="rounded-lg bg-panel2 p-3">
										<p className="text-sm font-semibold text-accent">Evaluation window open</p>
										<p className="text-xs text-text-muted">
											Opened {formatEventDate(openEvalSlot.createdAt)}
										</p>
									</div>
								)}
								{workshops.slice(0, 1).map((w: any) => (
									<div key={w.id} className="rounded-lg bg-panel2 p-3">
										<p className="text-sm font-semibold text-text-primary">{w.title}</p>
										<p className="text-xs text-text-muted">{formatEventDate(w.scheduledAt)}</p>
										<p className="text-xs text-text-muted">{w.host.name}</p>
									</div>
								))}
							</div>
						)}
					</Card>

					{/* Recent Achievements */}
					<Card className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
							Achievements
						</h3>
						{user.achievements.length === 0 ? (
							<p className="text-sm italic text-text-muted">No achievements yet</p>
						) : (
							<ul className="space-y-3">
								{user.achievements.map((ua: any) => (
									<li key={ua.id} className="flex items-start gap-2">
										<span className="text-lg">
											{iconEmoji[ua.achievement.icon ?? ""] ?? "🏆"}
										</span>
										<div className="min-w-0">
											<p className="text-sm font-bold text-text-primary">
												{ua.achievement.title}
											</p>
											<p className="truncate text-xs text-text-muted">
												{ua.achievement.description}
											</p>
											<p className="text-xs text-text-muted">
												{formatMonthYear(ua.unlockedAt)}
											</p>
										</div>
									</li>
								))}
							</ul>
						)}
						<a
							href="/profile#achievements"
							className="block text-xs font-medium text-accent transition-colors hover:underline"
						>
							View all →
						</a>
					</Card>

					{/* Workshop Feed */}
					<Card className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
							Workshops
						</h3>
						{workshops.length === 0 ? (
							<p className="text-sm italic text-text-muted">No workshops scheduled</p>
						) : (
							<ul className="space-y-4">
								{workshops.map((w) => (
									<li key={w.id} className="space-y-1">
										<p className="text-sm font-bold text-text-primary">{w.title}</p>
										<p className="text-xs text-text-muted">Host: {w.host.name}</p>
										<p className="text-xs text-text-muted">
											{formatEventDate(w.scheduledAt)}
										</p>
										<div className="flex items-center justify-between">
											<p className="text-xs text-text-muted">
												{w.rsvps.length} attending
											</p>
											<WorkshopRsvpButton
												workshopId={w.id}
												initialStatus={
													(rsvpMap.get(w.id) as "GOING" | "NOT_GOING") ?? null
												}
											/>
										</div>
									</li>
								))}
							</ul>
						)}
						<p className="text-xs text-text-muted">
							Workshops are separate from the cursus. No rank implications.
						</p>
					</Card>
				</div>
			</div>
		</div>
	);
}
