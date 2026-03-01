import React from "react";

// ── Types ────────────────────────────────────────────

interface Achievement {
	id: string;
	title: string;
	description: string | null;
	icon: string | null;
}

interface UserAchievement {
	achievementId: string;
	unlockedAt: Date | string;
}

interface AchievementsGridProps {
	allAchievements: Achievement[];
	userAchievements: UserAchievement[];
}

// ── Helpers ─────────────────────────────────────────

const iconEmoji: Record<string, string> = {
	star: "⭐", rocket: "🚀", clock: "⏰", brain: "🧠",
	flag: "🚩", lightbulb: "💡", eye: "👁", crown: "👑",
};

function formatDate(d: Date | string) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(d));
}

// ── Component ────────────────────────────────────────

export function AchievementsGrid({ allAchievements, userAchievements }: AchievementsGridProps) {
	const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{allAchievements.map((a) => {
				const unlocked = unlockedMap.get(a.id);
				const emoji = iconEmoji[a.icon ?? ""] ?? "🏆";

				return (
					<div
						key={a.id}
						className={`rounded-xl border p-3 transition-colors ${unlocked
								? "border-accent/30 bg-panel"
								: "border-border-color bg-panel opacity-40 grayscale"
							}`}
					>
						<span className="text-xl">{emoji}</span>
						<p className={`mt-1 text-sm font-bold ${unlocked ? "text-text-primary" : "text-text-muted"}`}>
							{a.title}
						</p>
						{unlocked ? (
							<>
								{a.description && (
									<p className="mt-0.5 text-xs text-text-muted">{a.description}</p>
								)}
								<p className="mt-1 text-[10px] text-text-muted">
									{formatDate(unlocked.unlockedAt)}
								</p>
							</>
						) : (
							<p className="mt-0.5 text-xs italic text-text-muted">Locked</p>
						)}
					</div>
				);
			})}
		</div>
	);
}
