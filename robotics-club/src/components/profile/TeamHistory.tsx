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

const statusColours: Record<string, string> = {
	COMPLETED: "bg-green-900/40 text-green-400",
	ACTIVE: "bg-blue-900/40 text-blue-400",
	EVALUATING: "bg-orange-900/40 text-orange-400",
	FORMING: "bg-yellow-900/40 text-yellow-400",
	FAILED: "bg-red-900/40 text-red-400",
	DISBANDED: "bg-gray-800/40 text-gray-400",
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
						<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColours[tm.team.status] || "bg-gray-800/40 text-gray-400"}`}>
							{tm.team.status}
						</span>
					</div>
				</li>
			))}
		</ul>
	);
}

