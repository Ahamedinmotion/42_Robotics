"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────

interface TeamHistoryTeam {
	team: {
		id: string;
		status: string;
		project: { title: string };
		members: {
			userId: string;
			user: { login: string; image: string | null };
		}[];
	};
}

interface TeamHistoryProps {
	teams: TeamHistoryTeam[];
	currentUserId: string;
}

// ── Component ────────────────────────────────────────

const statusStyles: Record<string, string> = {
	COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
	ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
	EVALUATING: "bg-purple-500/10 text-purple-400 border-purple-500/20",
	FORMING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
	FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
	ABANDONED: "bg-red-500/10 text-red-500 border-red-500/20 opacity-80",
	BLACKHOLED: "bg-zinc-900 text-zinc-400 border-zinc-700",
	DISBANDED: "bg-zinc-800/50 text-zinc-500 border-zinc-700/30",
};

export function TeamHistory({ teams, currentUserId }: TeamHistoryProps) {
	const router = useRouter();
	const [cancellingId, setCancellingId] = useState<string | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);

	const handleCancel = async (e: React.MouseEvent, teamId: string) => {
		e.preventDefault();
		e.stopPropagation();
		if (isConfirming) return;
		
		setIsConfirming(true);
		const confirmed = confirm("Are you sure you want to cancel this team formation?");
		setIsConfirming(false);
		
		if (!confirmed) return;
		setCancellingId(teamId);
		try {
			const res = await fetch(`/api/teams/${teamId}/cancel`, { method: "POST" });
			if (res.ok) {
				router.refresh();
			} else {
				const data = await res.json();
				alert(data.error || "Failed to cancel");
			}
		} catch (e) {
			alert("An error occurred");
		} finally {
			setCancellingId(null);
		}
	};

	if (teams.length === 0) {
		return <p className="text-sm italic text-text-muted">No team history yet.</p>;
	}

	// Build repeat-pairing map: userId -> count of teams they share with current user
	const pairingCount = new Map<string, number>();
	for (const tm of teams) {
		for (const m of tm.team.members) {
			if (m.userId !== currentUserId) {
				pairingCount.set(m.userId, (pairingCount.get(m.userId) || 0) + 1);
			}
		}
	}

	return (
		<ul className="divide-y divide-border-color">
			{teams.map((tm, i) => (
				<li key={i} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
					<span className="text-sm font-semibold text-text-primary">{tm.team.project.title}</span>

					<div className="flex items-center -space-x-1.5">
						{tm.team.members
							.filter((m) => m.userId !== currentUserId)
							.map((m) => {
								const repeats = pairingCount.get(m.userId) || 0;
								return (
									<div key={m.userId} className="relative">
										{m.user.image ? (
											<Image
												src={m.user.image}
												alt={m.user.login}
												title={m.user.login}
												width={20}
												height={20}
												className="h-5 w-5 rounded-full border border-background object-cover"
											/>
										) : (
											<div
												title={m.user.login}
												className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-panel2 text-[8px] font-bold text-text-muted"
											>
												{m.user.login.charAt(0).toUpperCase()}
											</div>
										)}
										{repeats > 1 && (
											<span className="absolute -right-1.5 -top-1.5 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-accent-secondary px-0.5 text-[7px] font-bold text-white">
												×{repeats}
											</span>
										)}
									</div>
								);
							})}
					</div>

					<div className="ml-auto flex items-center gap-3">
						{tm.team.status === "FORMING" && (
							<button
								onClick={(e) => handleCancel(e, tm.team.id)}
								disabled={cancellingId === tm.team.id}
								className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors disabled:opacity-50"
							>
								{cancellingId === tm.team.id ? "..." : "Cancel"}
							</button>
						)}
						<span className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] ${statusStyles[tm.team.status] || "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
							{tm.team.status}
						</span>
					</div>
				</li>
			))}
		</ul>
	);
}

