"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

function useCountdown(targetDate: string | null) {
	const [timeLeft, setTimeLeft] = useState("");
	const [hasFired, setHasFired] = useState(false); // Moved useState to top level of hook
	useEffect(() => {
		if (!targetDate) return;
		const tick = () => {
			const diff = new Date(targetDate).getTime() - Date.now();
			if (diff <= 0) { setTimeLeft("Now"); return; }
			// ── 42 Hour Firework Logic ─────────────────
			const d = Math.floor(diff / 86400000);
			const h = Math.floor((diff % 86400000) / 3600000);
			const m = Math.floor((diff % 3600000) / 60000);
			setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
		};
		tick();
		const interval = setInterval(tick, 30000);
		return () => clearInterval(interval);
	}, [targetDate]);
	return timeLeft;
}

export function PublicDefenseSection() {
	const router = useRouter();
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [defenses, setDefenses] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
	const [mySubmissions, setMySubmissions] = useState<Set<string>>(new Set());
	const [myTeamId, setMyTeamId] = useState<string | null>(null);

	const fetchDefenses = useCallback(async () => {
		try {
			const res = await fetch("/api/defenses");
			const json = await res.json();
			if (json.success) {
				setDefenses(json.data || []);
			}
		} catch (err) {
			console.error("Failed to fetch defenses", err);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchMyStatus = useCallback(async () => {
		try {
			const res = await fetch("/api/user/me");
			const json = await res.json();
			if (json.success) {
				// Check registrations
				const regSet = new Set<string>();
				const subSet = new Set<string>();
				if (json.data.defenseRegistrations) {
					json.data.defenseRegistrations.forEach((r: any) => regSet.add(r.defenseId));
				}
				if (json.data.defenseEvaluations) {
					json.data.defenseEvaluations.forEach((e: any) => subSet.add(e.defenseId));
				}
				setMyRegistrations(regSet);
				setMySubmissions(subSet);
				// Get team ID
				if (json.data.teams?.length > 0) {
					setMyTeamId(json.data.teams[0].teamId);
				}
			}
		} catch (err) {}
	}, []);

	useEffect(() => {
		fetchDefenses();
		fetchMyStatus();
		const interval = setInterval(() => { fetchDefenses(); fetchMyStatus(); }, 30000);
		return () => clearInterval(interval);
	}, [fetchDefenses, fetchMyStatus]);

	const handleRegister = async (defenseId: string) => {
		setActionLoading(defenseId);
		try {
			const res = await fetch(`/api/defenses/${defenseId}/register`, { method: "POST" });
			const json = await res.json();
			if (json.success) {
				toast("Registered for defense evaluation");
				playSFX("achievement");
				fetchDefenses();
				fetchMyStatus();
			} else {
				toast(json.error || "Failed to register", "error");
			}
		} catch { toast("Network error", "error"); }
		finally { setActionLoading(null); }
	};

	const handleCancel = async (defenseId: string) => {
		if (!confirm("Cancel your registration for this defense?")) return;
		setActionLoading(defenseId);
		try {
			const res = await fetch(`/api/defenses/${defenseId}/register`, { method: "DELETE" });
			const json = await res.json();
			if (json.success) {
				toast("Registration cancelled");
				fetchDefenses();
				fetchMyStatus();
			} else {
				toast(json.error || "Failed to cancel", "error");
			}
		} catch { toast("Network error", "error"); }
		finally { setActionLoading(null); }
	};

	if (loading) return null;
	if (defenses.length === 0) return null;

	const upcoming = defenses.filter(d => d.status === "SCHEDULED" || d.status === "MINIMUM_NOT_MET");
	const open = defenses.filter(d => d.status === "OPEN");

	if (upcoming.length === 0 && open.length === 0) return null;

	return (
		<div className="space-y-6 mb-8">
			<div className="flex items-center gap-3">
				<div className="h-6 w-1 bg-accent rounded-full" />
				<h2 className="text-lg font-black uppercase tracking-[0.2em] text-text-primary">Public Defenses</h2>
			</div>

			{/* Open for Scoring */}
			{open.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Open for Scoring</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{open.map(d => {
							const isRegistered = myRegistrations.has(d.id);
							const hasSubmitted = mySubmissions.has(d.id);
							const tiers = d.registrationTiers || {};

							return (
								<Card key={d.id} className="p-6 space-y-4 border-emerald-500/20 bg-emerald-500/5 ring-1 ring-emerald-500/10">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<Badge rank={d.team?.project?.rank || "A"} size="sm" />
											<div>
												<h4 className="text-sm font-black text-text-primary">{d.team?.project?.title}</h4>
												<p className="text-[10px] text-text-muted">{d.team?.name || "Team"}</p>
											</div>
										</div>
										<div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
											<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
											<span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Live</span>
										</div>
									</div>

									<div className="text-[10px] text-text-muted uppercase tracking-wider">
										{d._count?.registrations || 0} registered evaluators
									</div>

									{isRegistered && !hasSubmitted ? (
										<Button
											variant="primary"
											className="w-full font-black uppercase tracking-[0.2em]"
											onClick={() => router.push(`/evaluations/defense/${d.id}/evaluate`)}
										>
											Submit Evaluation →
										</Button>
									) : hasSubmitted ? (
										<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
											<span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">✓ Submitted</span>
										</div>
									) : (
										<div className="p-3 rounded-xl bg-panel2/50 border border-white/5 text-center">
											<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Evaluation in progress</span>
										</div>
									)}
								</Card>
							);
						})}
					</div>
				</div>
			)}

			{/* Upcoming Defenses */}
			{upcoming.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Upcoming Defenses</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{upcoming.map(d => (
							<UpcomingDefenseCard
								key={d.id}
								defense={d}
								myTeamId={myTeamId}
								actionLoading={actionLoading}
								handleRegister={handleRegister}
								handleCancel={handleCancel}
								isRegistered={myRegistrations.has(d.id)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function UpcomingDefenseCard({ defense, myTeamId, actionLoading, handleRegister, handleCancel, isRegistered }: any) {
	const countdown = useCountdown(defense.scheduledAt);
	const isMyTeam = defense.teamId === myTeamId;
	const tiers = defense.registrationTiers || { admin: 0, expert: 0, gallery: 0 };

	return (
		<Card key={defense.id} className="p-6 space-y-4 hover:border-accent/30 transition-colors">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<Badge rank={defense.team?.project?.rank || "A"} size="sm" />
					<div>
						<h4 className="text-sm font-black text-text-primary">{defense.team?.project?.title}</h4>
						<p className="text-[10px] text-text-muted">{defense.team?.name || "Team"}</p>
					</div>
				</div>
				{defense.minimumMet ? (
					<div className="h-2 w-2 rounded-full bg-emerald-500" title="Minimum met" />
				) : (
					<div className="h-2 w-2 rounded-full bg-red-500" title="Minimum not met" />
				)}
			</div>

			<div className="flex items-center justify-between text-[10px] text-text-muted">
				<span>{new Date(defense.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
				<span className="font-mono font-bold text-accent">{countdown}</span>
			</div>

			<div className="flex gap-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
				<span>Admins: {tiers.admin}</span>
				<span className="text-white/10">|</span>
				<span>A/S: {tiers.expert}</span>
				<span className="text-white/10">|</span>
				<span>Gallery: {tiers.gallery}</span>
			</div>

			{isRegistered ? (
				<div className="flex items-center justify-between">
					<span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">✓ Registered</span>
					<Button
						variant="ghost"
						size="sm"
						className="text-[9px] font-black uppercase tracking-widest text-accent-urgency opacity-50 hover:opacity-100"
						disabled={actionLoading === defense.id}
						onClick={() => handleCancel(defense.id)}
					>
						Cancel
					</Button>
				</div>
			) : (
				<Button
					variant="secondary"
					size="sm"
					className="w-full font-black uppercase tracking-[0.15em] text-[10px]"
					disabled={actionLoading === defense.id || isMyTeam}
					onClick={() => handleRegister(defense.id)}
				>
					{isMyTeam ? "Your Team's Defense" : actionLoading === defense.id ? "Registering..." : "Register to Evaluate"}
				</Button>
			)}
		</Card>
	);
}
