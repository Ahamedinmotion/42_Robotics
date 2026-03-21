"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface PublicDefenseSchedulerProps {
	team: any;
}

function useCountdown(targetDate: string | null) {
	const [timeLeft, setTimeLeft] = useState("");
	const [isExpired, setIsExpired] = useState(false);

	useEffect(() => {
		if (!targetDate) return;
		const tick = () => {
			const now = Date.now();
			const target = new Date(targetDate).getTime();
			const diff = target - now;
			if (diff <= 0) {
				setTimeLeft("Now");
				setIsExpired(true);
				return;
			}
			const days = Math.floor(diff / 86400000);
			const hours = Math.floor((diff % 86400000) / 3600000);
			const mins = Math.floor((diff % 3600000) / 60000);
			const secs = Math.floor((diff % 60000) / 1000);
			setTimeLeft(days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`);
			setIsExpired(false);
		};
		tick();
		const interval = setInterval(tick, 1000);
		return () => clearInterval(interval);
	}, [targetDate]);

	return { timeLeft, isExpired };
}

export function PublicDefenseScheduler({ team }: PublicDefenseSchedulerProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [defense, setDefense] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [scheduledDate, setScheduledDate] = useState("");
	const [scheduledTime, setScheduledTime] = useState("");

	const fetchDefense = useCallback(async () => {
		try {
			const res = await fetch(`/api/defenses`);
			const json = await res.json();
			if (json.success && json.data) {
				const myDefense = json.data.find((d: any) => d.teamId === team.id);
				setDefense(myDefense || null);
			}
		} catch (err) {
			console.error("Failed to fetch defense", err);
		} finally {
			setLoading(false);
		}
	}, [team.id]);

	useEffect(() => {
		fetchDefense();
		const interval = setInterval(fetchDefense, 30000);
		return () => clearInterval(interval);
	}, [fetchDefense]);

	const { timeLeft, isExpired } = useCountdown(defense?.scheduledAt || null);

	const handleSchedule = async () => {
		if (!scheduledDate || !scheduledTime) {
			toast("Please select both a date and time", "error");
			return;
		}
		const dateTime = new Date(`${scheduledDate}T${scheduledTime}`);
		if (dateTime <= new Date()) {
			toast("Scheduled time must be in the future", "error");
			return;
		}

		setActionLoading(true);
		try {
			const res = await fetch("/api/defenses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scheduledAt: dateTime.toISOString() }),
			});
			const json = await res.json();
			if (json.success) {
				toast("Public Defense scheduled");
				playSFX("achievement");
				fetchDefense();
			} else {
				toast(json.error || "Failed to schedule", "error");
			}
		} catch (err) {
			toast("Network error", "error");
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="p-12 text-center text-text-muted animate-pulse font-black tracking-widest uppercase text-[10px]">
				Loading Defense Status...
			</div>
		);
	}

	// ── STATE: No defense scheduled ──
	if (!defense) {
		return (
			<div className="space-y-8">
				<Card className="p-8 space-y-8 bg-panel-2 border-white/5">
					<div className="text-center space-y-3">
						<div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto">
							<svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<h3 className="text-xl font-black uppercase tracking-tight text-text-primary">Public Defense</h3>
						<p className="text-xs text-text-muted leading-relaxed max-w-lg mx-auto">
							A and S rank projects are evaluated through a Public Defense — a live pitch to the club followed by open evaluation. Schedule your defense to begin the process.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Date</label>
							<input
								type="date"
								value={scheduledDate}
								onChange={(e) => setScheduledDate(e.target.value)}
								className="w-full rounded-xl border border-border-color bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent/40"
							/>
						</div>
						<div>
							<label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Time</label>
							<input
								type="time"
								value={scheduledTime}
								onChange={(e) => setScheduledTime(e.target.value)}
								className="w-full rounded-xl border border-border-color bg-background p-3 text-sm text-text-primary focus:outline-none focus:border-accent/40"
							/>
						</div>
					</div>

					<Button
						size="lg"
						className="w-full h-14 font-black uppercase tracking-[0.3em]"
						disabled={actionLoading || !scheduledDate || !scheduledTime}
						onClick={handleSchedule}
					>
						{actionLoading ? "Scheduling..." : "🛡️ Schedule Defense"}
					</Button>
				</Card>

				<Card className="p-6 bg-panel/30 border-accent/10 space-y-4">
					<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Before Your Defense Can Proceed</h4>
					<div className="space-y-3">
						{[
							{ label: "At least 1 admin must register as evaluator", icon: "🛡️" },
							{ label: "At least 2 A or S rank members must register as expert evaluators", icon: "⭐" },
							{ label: "These must be confirmed before your scheduled time", icon: "⏰" },
						].map((req, i) => (
							<div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/50">
								<span className="text-sm">{req.icon}</span>
								<p className="text-xs text-text-muted leading-relaxed">{req.label}</p>
							</div>
						))}
					</div>
				</Card>
			</div>
		);
	}

	const status = defense.status;
	const tiers = defense.registrationTiers || { admin: 0, expert: 0, gallery: 0 };
	const minimumMet = defense.minimumMet;
	const hoursAway = defense.scheduledAt ? (new Date(defense.scheduledAt).getTime() - Date.now()) / 3600000 : 0;

	// ── STATE: Defense scheduled, not open ──
	if (status === "SCHEDULED" || status === "MINIMUM_NOT_MET") {
		return (
			<Card className="p-8 space-y-8 bg-panel-2 border-white/5">
				<div className="text-center space-y-3">
					<div className="flex items-center justify-center gap-3">
						<Badge rank={team.project.rank} size="lg" />
						<h3 className="text-xl font-black uppercase tracking-tight text-text-primary">Defense Scheduled</h3>
					</div>
					<p className="text-xs text-text-muted">
						{new Date(defense.scheduledAt).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
					</p>
				</div>

				{/* Countdown */}
				<div className="p-6 rounded-2xl bg-accent/5 border border-accent/20 text-center">
					<p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-2">Time Until Defense</p>
					<p className="text-3xl font-mono font-black text-text-primary tabular-nums">{timeLeft}</p>
				</div>

				{/* Registration Breakdown */}
				<div className="space-y-4">
					<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Evaluator Registration</h4>
					<div className="grid grid-cols-3 gap-3">
						<div className="p-4 rounded-xl bg-background border border-border/50 text-center">
							<p className="text-2xl font-black text-text-primary">{tiers.admin}</p>
							<p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">Admins</p>
							<div className={`h-1 w-full mt-2 rounded-full ${tiers.admin >= 1 ? "bg-emerald-500" : "bg-red-500/30"}`} />
						</div>
						<div className="p-4 rounded-xl bg-background border border-border/50 text-center">
							<p className="text-2xl font-black text-text-primary">{tiers.expert}</p>
							<p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">A/S Rank</p>
							<div className={`h-1 w-full mt-2 rounded-full ${tiers.expert >= 2 ? "bg-emerald-500" : "bg-red-500/30"}`} />
						</div>
						<div className="p-4 rounded-xl bg-background border border-border/50 text-center">
							<p className="text-2xl font-black text-text-primary">{tiers.gallery}</p>
							<p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">Gallery</p>
							<div className="h-1 w-full mt-2 rounded-full bg-accent/20" />
						</div>
					</div>
				</div>

				{/* Minimum Met Indicator */}
				<div className={`p-4 rounded-xl border text-center ${minimumMet ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
					<div className="flex items-center justify-center gap-2">
						<div className={`h-2 w-2 rounded-full ${minimumMet ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
						<p className={`text-[10px] font-black uppercase tracking-widest ${minimumMet ? "text-emerald-400" : "text-red-400"}`}>
							{minimumMet ? "Minimum Requirements Met" : "Minimum Requirements Not Met"}
						</p>
					</div>
					{!minimumMet && (
						<p className="text-[9px] text-red-400/60 mt-1 uppercase tracking-wider">
							Your defense cannot proceed without meeting minimums.
						</p>
					)}
				</div>

				{/* Actions */}
				{hoursAway > 2 && (
					<div className="flex gap-3">
						<Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100" disabled={actionLoading}>
							Reschedule
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-accent-urgency text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100"
							disabled={actionLoading}
							onClick={() => {
								if (confirm("Are you sure you want to cancel this defense? This cannot be undone.")) {
									toast("Cancellation not yet implemented", "error");
								}
							}}
						>
							Cancel Defense
						</Button>
					</div>
				)}
			</Card>
		);
	}

	// ── STATE: Defense open (evaluation live) ──
	if (status === "OPEN") {
		const totalRegistered = (defense._count?.registrations || tiers.admin + tiers.expert + tiers.gallery);
		const submitted = defense.evaluationCount || 0;

		return (
			<Card className="p-8 space-y-8 bg-panel-2 border-emerald-500/20 ring-1 ring-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
				<div className="text-center space-y-3">
					<div className="flex items-center justify-center gap-3">
						<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
							<div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
							<span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Evaluation Open</span>
						</div>
					</div>
					<h3 className="text-xl font-black uppercase tracking-tight text-text-primary">Defense In Progress</h3>
				</div>

				{/* Live Submission Tracker */}
				<div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
					<p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 text-center">
						{submitted} of {totalRegistered} registered evaluators have submitted
					</p>
					<div className="h-2 w-full bg-panel2 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-500 transition-all duration-1000"
							style={{ width: totalRegistered > 0 ? `${(submitted / totalRegistered) * 100}%` : "0%" }}
						/>
					</div>
				</div>

				<p className="text-[10px] text-text-muted text-center uppercase tracking-wider">
					The admin will close evaluation when ready. Results will appear here.
				</p>
			</Card>
		);
	}

	// ── STATE: Defense closed, result pending ──
	if (status === "CLOSED") {
		return (
			<Card className="p-12 text-center space-y-6 bg-panel-2 border-white/5">
				<div className="w-16 h-16 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
				<div className="space-y-2">
					<h3 className="text-lg font-black uppercase tracking-tight text-text-primary">Evaluation Closed</h3>
					<p className="text-xs text-text-muted uppercase tracking-widest">Results being calculated...</p>
				</div>
			</Card>
		);
	}

	// ── STATE: Result available (PASSED / FAILED / PROVISIONAL) ──
	if (status === "PASSED" || status === "FAILED" || status === "PROVISIONAL") {
		const isPassed = status === "PASSED";
		const isProvisional = status === "PROVISIONAL";

		return (
			<Card className={`p-8 text-center space-y-6 bg-panel-2 border ${isPassed ? "border-emerald-500/20" : isProvisional ? "border-amber-500/20" : "border-red-500/20"}`}>
				<div className={`text-4xl font-black uppercase tracking-tighter ${isPassed ? "text-emerald-400" : isProvisional ? "text-amber-400" : "text-red-500"}`}>
					{isPassed ? "PASSED" : isProvisional ? "PROVISIONAL" : "NOT YET"}
				</div>
				<p className="text-xs text-text-muted uppercase tracking-widest">
					{isPassed ? "Your defense was successful." : isProvisional ? "Awaiting President confirmation." : "Your defense did not meet requirements."}
				</p>
				<Button
					variant="primary"
					className="font-black uppercase tracking-[0.2em]"
					href={`/evaluations/defense/${defense.id}/result`}
				>
					View Full Results →
				</Button>
			</Card>
		);
	}

	// Fallback
	return null;
}
