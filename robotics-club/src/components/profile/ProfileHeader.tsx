import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { ProfileCard } from "./ProfileCard";

// ── Helpers ──────────────────────────────────────────

const RANK_COLOURS: Record<string, string> = {
	E: "#888888", D: "#44AAFF", C: "#44FF88",
	B: "#FFD700", A: "#FF6B00", S: "#CC44FF",
};

function formatMonthYear(date: Date | string) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(date));
}

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="text-center">
			<p className="text-xl font-bold text-accent">{value}</p>
			<p className="text-xs text-text-muted">{label}</p>
		</div>
	);
}

// ── Component ────────────────────────────────────────

interface ProfileHeaderProps {
	user: {
		image: string | null;
		name: string;
		login: string;
		currentRank: string;
		githubHandle: string | null;
		joinedAt: Date | string;
		skillProgress: { skillTag: string; projectsCompleted: number }[];
		id: string;
	};
	title: string | null;
	completedProjects: number;
	evalsGiven: number;
}

export function ProfileHeader({ user, title, completedProjects, evalsGiven }: ProfileHeaderProps) {
	return (
		<div className="relative flex flex-col items-start justify-between gap-6 rounded-2xl bg-panel p-6 sm:flex-row sm:items-center">
			{/* Profile ID Card Trigger */}
			<div className="absolute right-4 top-4">
				<ProfileCard
					user={{
						id: user.id,
						name: user.name,
						login: user.login,
						avatar: user.image,
						currentRank: user.currentRank,
						joinedAt: user.joinedAt,
						skillProgress: user.skillProgress,
						completedProjects: completedProjects,
					}}
				/>
			</div>

			<div className="flex items-center gap-5">
				{user.image ? (
					<Image
						src={user.image || "/placeholder-avatar.png"}
						alt={user.login}
						width={80}
						height={80}
						className="h-20 w-20 rounded-full border-2 border-accent object-cover"
					/>
				) : (
					<div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent bg-panel2 text-2xl font-bold text-text-muted">
						{user.login.charAt(0).toUpperCase()}
					</div>
				)}
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold text-text-primary">{user.name}</h1>
						<Badge rank={user.currentRank as any} size="lg" />
						{title && (
							<span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
								{title}
							</span>
						)}
					</div>
					<p className="text-sm text-text-muted">@{user.login}</p>
					{user.githubHandle && (
						<a
							href={`https://github.com/${user.githubHandle}`}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-1 inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-accent"
						>
							github.com/{user.githubHandle} ↗
						</a>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-x-8 gap-y-3">
				<StatCard label="Projects Completed" value={completedProjects} />
				<StatCard label="Evaluations Given" value={evalsGiven} />
				<StatCard label="Member Since" value={formatMonthYear(user.joinedAt)} />
				<div className="text-center">
					<p className="text-xl font-bold" style={{ color: RANK_COLOURS[user.currentRank] || "#888" }}>
						{user.currentRank}
					</p>
					<p className="text-xs text-text-muted">Current Rank</p>
				</div>
			</div>
		</div>
	);
}
