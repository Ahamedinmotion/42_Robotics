import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";

// ── Helpers ──────────────────────────────────────────

function titleCase(str: string) {
	return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMonthYear(date: Date | string) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(date));
}

function slugify(str: string) {
	return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ── Types ────────────────────────────────────────────

interface ShowcaseTeam {
	id: string;
	status: string;
	updatedAt: Date | string;
	rank: string;
	project: {
		title: string;
		description: string | null;
		skillTags: string[];
	};
	members: {
		user: { id: string; login: string; name: string; image: string | null };
	}[];
	leader: { githubHandle: string | null } | null;
	_count: { evaluations: number };
	weeklyReports?: {
		photoUrls: string[];
	}[];
}

interface ShowcaseCardProps {
	team: ShowcaseTeam;
}

// ── Component ────────────────────────────────────────

export function ShowcaseCard({ team }: ShowcaseCardProps) {
	const isInProgress = team.status !== "COMPLETED";
	const tags = (team.project.skillTags as string[]) || [];
	const visibleTags = tags.slice(0, 3);
	const extra = tags.length - 3;
	const visibleMembers = team.members.slice(0, 3);
	const moreMembers = team.members.length - 3;
	const ghHandle = team.leader?.githubHandle;

	// Extract first mission photo
	const allPhotos = team.weeklyReports?.flatMap(r => r.photoUrls) || [];
	const heroPhoto = allPhotos[0];

	// Cloudinary transformation
	const getHeroUrl = (url: string) => {
		if (!url.includes("cloudinary.com")) return url;
		return url.replace("/upload/", "/upload/w_640,h_360,c_fill,g_auto/");
	};

	return (
		<div 
			data-showcase-card
			className="group overflow-hidden rounded-xl border border-border-color bg-panel transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
		>
			{/* Image hero area */}
			<div className="relative flex aspect-video items-center justify-center bg-panel2 overflow-hidden">
				{heroPhoto ? (
					<Image 
						src={getHeroUrl(heroPhoto)} 
						alt={team.project.title}
						fill
						className="object-cover group-hover:scale-105 transition-transform duration-500"
					/>
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opaicty-50" />
				)}
				
				<div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

				<div className="relative z-10 scale-110">
					<Badge rank={team.rank as any} size="lg" />
				</div>
				{isInProgress && (
					<div className="absolute left-2 top-2 z-10 rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent backdrop-blur-sm">
						In Progress
					</div>
				)}
				<div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
					<p className="truncate text-sm font-bold text-white uppercase tracking-tighter">{team.project.title}</p>
				</div>
			</div>

			{/* Body */}
			<div className="space-y-3 p-4">
				<p className="truncate text-sm font-bold text-text-primary">{team.project.title}</p>
				{team.project.description && (
					<p className="line-clamp-2 text-xs text-text-muted">{team.project.description}</p>
				)}

				{/* Skill tags */}
				<div className="flex flex-wrap gap-1">
					{visibleTags.map((t) => (
						<span key={t} className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] text-text-muted">
							{titleCase(t)}
						</span>
					))}
					{extra > 0 && (
						<span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] text-text-muted">
							+{extra} more
						</span>
					)}
				</div>

				{/* Team row */}
				<div className="flex items-center gap-2">
					<span className="text-xs text-text-muted">By</span>
					<div className="flex -space-x-1.5">
						{visibleMembers.map((m) =>
							m.user.image ? (
								<Link key={m.user.id} href={`/profile/${m.user.id}`}>
									<Image
										src={m.user.image}
										alt={m.user.login}
										title={m.user.login}
										width={24}
										height={24}
										className="h-6 w-6 rounded-full border border-background object-cover"
									/>
								</Link>
							) : (
								<Link key={m.user.id} href={`/profile/${m.user.id}`}>
									<div
										title={m.user.login}
										className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-panel2 text-[9px] font-bold text-text-muted"
									>
										{m.user.login.charAt(0).toUpperCase()}
									</div>
								</Link>
							)
						)}
					</div>
					<span className="truncate text-xs text-text-muted">
						{visibleMembers.map((m) => m.user.login).join(", ")}
						{moreMembers > 0 && ` +${moreMembers}`}
					</span>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-border-color pt-3">
					<span className="text-xs text-text-muted">{formatMonthYear(team.updatedAt)}</span>
					{ghHandle && (
						<a
							href={`https://github.com/${ghHandle}/${slugify(team.project.title)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs font-medium text-accent transition-colors hover:underline"
						>
							View on GitHub →
						</a>
					)}
				</div>
			</div>
		</div>
	);
}

