"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/components/providers/SoundProvider";

interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	unlockedTitle?: { name: string } | null;
}

interface UserAchievement {
	achievementId: string;
	unlockedAt: string;
}

interface AchievementsGridProps {
	allAchievements: Achievement[];
	userAchievements: UserAchievement[];
}

export function AchievementsGrid({ allAchievements, userAchievements }: AchievementsGridProps) {
	const { playSFX } = useSound();
	const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{allAchievements.map((a) => {
				const isUnlocked = unlockedIds.has(a.id);
				return (
					<div
						key={a.id}
						onClick={() => isUnlocked && playSFX("achievement")}
						className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${isUnlocked
							? "border-accent/30 bg-panel shadow-lg shadow-accent/5 hover:border-accent/50 hover:shadow-accent/10"
							: "border-border-color bg-panel/30 grayscale opacity-60"
							}`}
					>
						{/* Glow effect for unlocked */}
						{isUnlocked && (
							<div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition-opacity group-hover:opacity-100" />
						)}

						<div className="flex items-start gap-4">
							<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 ${isUnlocked ? "bg-accent/10 text-accent shadow-inner shadow-accent/20" : "bg-panel2 text-text-muted"}`}>
								<span className="text-2xl">{a.icon || "🏆"}</span>
							</div>

							<div className="min-w-0 flex-1">
								<h4 className="truncate text-sm font-black uppercase tracking-tight text-text-primary">
									{a.title}
								</h4>
								<p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
									{a.description}
								</p>

								{isUnlocked && a.unlockedTitle && (
									<div className="mt-3 flex items-center gap-1.5">
										<span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent border border-accent/20">
											Title Reward
										</span>
										<span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">
											{a.unlockedTitle.name}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Progress tracking line at bottom */}
						<div className={`absolute bottom-0 left-0 h-0.5 transition-all duration-700 ${isUnlocked ? "w-full bg-accent/40" : "w-0 bg-border-color"}`} />
					</div>
				);
			})}
		</div>
	);
}
