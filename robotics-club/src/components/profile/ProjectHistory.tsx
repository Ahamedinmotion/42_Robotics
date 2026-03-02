import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

// ── Helpers ──────────────────────────────────────────

function titleCase(str: string) {
	return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMonthYear(date: Date | string) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(date));
}

// ── Types ────────────────────────────────────────────

interface CompletedTeam {
	team: {
		updatedAt: Date | string;
		project: {
			title: string;
			rank: string;
			skillTags: string[];
		};
		members: {
			user: { login: string; image: string | null };
		}[];
		leader: { githubHandle: string | null } | null;
	};
}

interface ProjectHistoryProps {
	teams: CompletedTeam[];
}

// ── Component ────────────────────────────────────────

export function ProjectHistory({ teams }: ProjectHistoryProps) {
	if (teams.length === 0) {
		return <p className="text-sm italic text-text-muted">No completed projects yet.</p>;
	}

	return (
		<ul className="divide-y divide-border-color">
			{teams.map((tm, i) => {
				const p = tm.team.project;
				const tags = (p.skillTags as string[]) || [];
				const visibleTags = tags.slice(0, 3);
				const extra = tags.length - 3;

				return (
					<li key={i} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
						<Badge rank={p.rank as any} size="sm" />
						<span className="font-bold text-text-primary">{p.title}</span>

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

						<span className="ml-auto text-xs text-text-muted">
							{formatMonthYear(tm.team.updatedAt)}
						</span>

						<div className="flex -space-x-1.5">
							{tm.team.members.slice(0, 5).map((m, j) =>
								m.user.image ? (
									<Image
										key={j}
										src={m.user.image}
										alt={m.user.login}
										title={m.user.login}
										width={20}
										height={20}
										className="h-5 w-5 rounded-full border border-background object-cover"
									/>
								) : (
									<div key={j} title={m.user.login} className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-panel2 text-[8px] font-bold text-text-muted">
										{m.user.login.charAt(0).toUpperCase()}
									</div>
								)
							)}
						</div>
					</li>
				);
			})}
		</ul>
	);
}

