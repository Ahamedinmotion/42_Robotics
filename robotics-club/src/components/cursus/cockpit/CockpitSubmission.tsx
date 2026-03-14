"use client";

import { useEffect, useState } from "react";
import { AvailabilityPicker } from "./AvailabilityPicker";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface CockpitSubmissionProps {
	team: any;
	isAdmin: boolean;
}

export function CockpitSubmission({ team, isAdmin }: CockpitSubmissionProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [isLoading, setIsLoading] = useState(false);
	const [windows, setWindows] = useState<any[]>([]);
	const [upcoming, setUpcoming] = useState<{ receiving: any[] }>({ receiving: [] });

	const reportsCount = team.weeklyReports?.length || 0;
	const hasRepo = !!team.repoUrl;
	const isEvaluating = team.status === "EVALUATING";

	const checklist = [
		{ id: "reports", label: "Weekly Progress Reports", status: reportsCount > 0, detail: `${reportsCount} reports submitted` },
		{ id: "repo", label: "Repository Linked", status: hasRepo, detail: team.repoUrl || "Pending" },
		{ id: "health", label: "Squad Health", status: true, detail: "Nominal" },
	];

	const allReady = checklist.every(item => item.status);

	const fetchWindows = async () => {
		try {
			const res = await fetch(`/api/evaluations/availability?teamId=${team.id}`);
			const data = await res.json();
			if (data.success) setWindows(data.data);
		} catch (err) {}
	};

	const fetchUpcoming = async () => {
		try {
			const res = await fetch("/api/evaluations/upcoming");
			const data = await res.json();
			if (data.success) setUpcoming(data.data);
		} catch (err) {}
	};

	useEffect(() => {
		if (isEvaluating) {
			fetchWindows();
			fetchUpcoming();
			const interval = setInterval(() => {
				fetchWindows();
				fetchUpcoming();
			}, 30000); // 30s poll
			return () => clearInterval(interval);
		}
	}, [isEvaluating]);

	const closeWindow = async (id: string, claimedCount: number) => {
		if (claimedCount > 0) {
			if (!confirm(`${claimedCount} evaluator(s) have claimed slots. They will be notified of the cancellation. Continue?`)) return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/evaluations/availability/${id}`, { method: "DELETE" });
			const data = await res.json();
			if (data.success) {
				toast("Availability window closed", "success");
				if (data.data.strikeLogged) {
					toast("Late cancellation strike logged against squad", "error");
				}
				fetchWindows();
			}
		} catch (err) {
			toast("Failed to close window", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-12">
			<div className="text-center space-y-4">
				<h3 className="text-3xl font-black tracking-tight text-text-primary uppercase italic">Mission Finalization</h3>
				<p className="text-sm text-text-muted">
					Complete the following checklist to open your squad for peer and staff evaluation.
				</p>
			</div>

			<Card className="p-8 space-y-8 bg-panel-2 border-white/5">
				<div className="space-y-6">
					{checklist.map((item) => (
						<div key={item.id} className="flex items-center gap-6 p-6 rounded-2xl bg-background border border-border">
							<div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
								item.status ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-panel border-border text-text-muted"
							}`}>
								{item.status ? "✓" : ""}
							</div>
							<div className="flex-1">
								<p className={`text-sm font-black uppercase tracking-widest ${item.status ? "text-text-primary" : "text-text-muted"}`}>
									{item.label}
								</p>
								<p className="text-xs text-text-muted/60 font-bold">{item.detail}</p>
							</div>
						</div>
					))}
				</div>

				{isEvaluating ? (
					<div className="space-y-8 animate-in fade-in duration-500">
						<div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
							<h4 className="text-lg font-black text-emerald-400">Mission Evaluating</h4>
							<p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">
								Squad is visible for {team.project.title}
							</p>
						</div>

						{/* Upcoming Evaluators */}
						{upcoming.receiving.length > 0 && (
							<div className="space-y-4 pt-4 border-t border-white/5">
								<h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Incoming Evaluation Claims</h4>
								<div className="grid grid-cols-1 gap-2">
									{upcoming.receiving.map((slot: any) => (
										<div key={slot.id} className="p-4 rounded-xl bg-accent/5 border border-accent/20">
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<div className="h-2 w-2 rounded-full bg-accent animate-ping" />
													<p className="text-[10px] font-bold font-mono text-text-primary">
														{new Date(slot.slotStart).toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
													</p>
												</div>
												{!slot.revealStatus.shouldReveal && (
													<span className="text-[9px] font-black font-mono text-accent">REVEALS IN {slot.revealStatus.remainingMins}m</span>
												)}
											</div>
											<div className="flex items-center gap-2">
												<div className="text-[10px] text-text-muted">└</div>
												<p className="text-xs font-bold text-text-primary">
													Claimed by <span className={slot.revealStatus.shouldReveal ? "text-accent" : "text-text-muted blur-[3px] select-none"}>
														{slot.revealStatus.shouldReveal ? slot.maskedIdentity : "██████████"}
													</span>
													{!slot.revealStatus.shouldReveal && (
														<span className="ml-2 text-[10px] text-text-muted font-medium italic">
															({slot.maskedIdentity})
														</span>
													)}
												</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Availability Manager */}
						<div className="space-y-6">
							<h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Broadcast Availability</h4>
							<AvailabilityPicker teamId={team.id} onSuccess={fetchWindows} />
						</div>

						{/* Active Ranges */}
						{windows.length > 0 && (
							<div className="space-y-6 pt-6 border-t border-white/5">
								<h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Active Broadcasts</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{windows.map(win => (
										<Card key={win.id} className="bg-panel p-4 space-y-4 border-white/5">
											<div className="flex items-center justify-between">
												<div className="space-y-0.5">
													<p className="text-[10px] font-black uppercase tracking-widest text-accent">
														{new Date(win.startTime).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
													</p>
													<p className="text-xs font-bold">
														{new Date(win.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} 
														— 
														{new Date(win.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
													</p>
												</div>
												<Button 
													size="sm" 
													variant="ghost" 
													className="text-accent-urgency hover:bg-accent-urgency/10 h-8 text-[9px] font-black"
													onClick={() => closeWindow(win.id, win.slots.length)}
												>
													Close Window
												</Button>
											</div>

											{/* Slots under this window */}
											<div className="space-y-2">
												{win.slots.length === 0 ? (
													<div className="py-2 px-3 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
														<p className="text-[9px] font-black uppercase tracking-widest opacity-30">No claims yet</p>
													</div>
												) : (
													win.slots.map((s: any) => (
														<div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
															<div className="flex items-center gap-3">
																<div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
																<p className="text-xs font-bold">
																	{new Date(s.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
																	—
																	{new Date(s.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
																</p>
															</div>
															<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
																{s.claimedBy.login}
															</p>
														</div>
													))
												)}
											</div>
										</Card>
									))}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="pt-4">
						<p className="text-center text-xs text-text-muted mb-6">
							Once you initiate, you can define your availability windows.
						</p>
						<Button 
							size="lg" 
							className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] shadow-2xl"
							disabled={!allReady || isLoading}
							onClick={async () => {
								setIsLoading(true);
								try {
									const res = await fetch(`/api/teams/${team.id}`, {
										method: "PATCH",
										body: JSON.stringify({ status: "EVALUATING" }),
									});
									if (res.ok) {
										toast("Phase initiated. Now set your availability.", "success");
										playSFX("achievement");
										window.location.reload();
									}
								} catch (err) {
									toast("Failed", "error");
								} finally {
									setIsLoading(false);
								}
							}}
						>
							{allReady ? "🚀 Initiate Evaluation Phase" : "Checklist Incomplete"}
						</Button>
					</div>
				)}
			</Card>

			<section className="space-y-6">
				<h4 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted text-center italic">Evaluation Protocol</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-6 rounded-2xl bg-panel-2/30 border border-white/5 space-y-2">
						<p className="text-[10px] font-black uppercase tracking-widest text-accent">Peer Review</p>
						<p className="text-xs text-text-muted leading-relaxed">Two other squads must review and approve your hardware and documentation.</p>
					</div>
					<div className="p-6 rounded-2xl bg-panel-2/30 border border-white/5 space-y-2">
						<p className="text-[10px] font-black uppercase tracking-widest text-accent">Staff Review</p>
						<p className="text-xs text-text-muted leading-relaxed">A final sign-off by a lab moderator is required for high-rank missions (A/S).</p>
					</div>
				</div>
			</section>
		</div>
	);
}
