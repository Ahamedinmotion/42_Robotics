import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

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

export async function RecentAchievements({ userId }: { userId: string }) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			achievements: {
				include: { achievement: true },
				orderBy: { unlockedAt: "desc" },
				take: 3,
			},
		},
	});

	if (!user) return null;

	return (
		<Card className="space-y-3">
			<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
				Achievements
			</h3>
			{user.achievements.length === 0 ? (
				<p className="text-sm italic text-text-muted">No achievements yet</p>
			) : (
				<ul className="space-y-3">
					{user.achievements.map((ua) => (
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
	);
}
