"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityPicker } from "./AvailabilityPicker";
import { PublicDefenseScheduler } from "./PublicDefenseScheduler";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface CockpitSubmissionProps {
	team: any;
	isAdmin: boolean;
}

export function CockpitSubmission({ team, isAdmin }: CockpitSubmissionProps) {
	const router = useRouter();
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [isLoading, setIsLoading] = useState(false);
	const [windows, setWindows] = useState<any[]>([]);
	const [upcoming, setUpcoming] = useState<{ receiving: any[] }>({ receiving: [] });
	const [evaluations, setEvaluations] = useState<any[] | null>(null);
	const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [feedbackRating, setFeedbackRating] = useState(0);
	const [feedbackComment, setFeedbackComment] = useState("");

	const reportsCount = team.weeklyReports?.length || 0;
	const hasRepo = !!team.repoUrl;
	const isEvaluating = team.status === "EVALUATING";
	const isHighRank = team.project?.rank === "A" || team.project?.rank === "S";

	const checklist = [
		{ id: "reports", label: "Weekly Progress Reports", status: reportsCount > 0, detail: `${reportsCount} reports submitted` },
		{ id: "repo", label: "Repository Linked", status: hasRepo, detail: team.repoUrl || "Pending" },
		{ id: "health", label: "Squad Health", status: true, detail: "Nominal" },
	];

	const allReady = checklist.every(item => item.status);

	const completedEvalsCount = team.evaluations?.length || 0;
	const claimedSlotsCount = team.evaluationSlots?.filter((s: any) => s.status === "CLAIMED").length || 0;
	const requiredEvals = 2; // Default to 2
	const canRequestMore = (completedEvalsCount + claimedSlotsCount) < requiredEvals;

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

	const fetchEvaluation = async () => {
		try {
			const res = await fetch(`/api/teams/${team.id}/evaluation`);
			const data = await res.json();
			if (data.success) setEvaluations(data.data);
		} catch (err) {}
	};

	useEffect(() => {
		if (isEvaluating) {
			fetchWindows();
			fetchUpcoming();
			fetchEvaluation();
			const interval = setInterval(() => {
				fetchWindows();
				fetchUpcoming();
				fetchEvaluation();
			}, 30000); // 30s poll
			return () => clearInterval(interval);
		}
	}, [isEvaluating]);

	const closeWindow = async (id: string, claimedCount: number) => {
		if (!confirm("Are you sure you want to abort this availability window? This cannot be undone.")) return;
		
		if (claimedCount > 0) {
			if (!confirm(`CAUTION: ${claimedCount} evaluator(s) have already claimed slots in this window. Aborting now will log a cancellation strike. Proceed anyway?`)) return;
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

				{isEvaluating && isHighRank ? (
					<PublicDefenseScheduler team={team} />
				) : isEvaluating ? (
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
						{canRequestMore ? (
							<div className="space-y-6">
								<h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Broadcast Availability</h4>
								<AvailabilityPicker teamId={team.id} onSuccess={fetchWindows} />
							</div>
						) : (
							<div className="space-y-6">
								<h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Broadcast Availability</h4>
								<div className="p-6 rounded-2xl bg-panel-2 border border-border text-center space-y-2">
									<h4 className="text-sm font-black text-text-primary uppercase tracking-widest">Required Broadcasts Met</h4>
									<p className="text-[10px] uppercase font-bold tracking-widest text-text-muted max-w-md mx-auto leading-relaxed">
										Your squad has completed or has pending evaluations for the required {requiredEvals} assessments. No further availability can be broadcasted.
									</p>
								</div>
							</div>
						)}

						{/* Active Ranges */}
						{windows.length > 0 && (
							<div className="space-y-6 pt-8 pb-4 relative">
								<div className="flex items-center gap-3">
									<div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
										<svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
										</svg>
									</div>
									<h4 className="text-sm font-black uppercase tracking-[0.3em] text-text-primary">Active Broadcasts</h4>
								</div>
								
								<div className="p-1 rounded-[2rem] bg-accent/5 border border-accent/10 shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.05)]">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
										{windows.map(win => {
											const now = new Date();
											const isLive = now >= new Date(win.startTime) && now <= new Date(win.endTime);
											const isPast = now > new Date(win.endTime);
											
											return (
												<Card key={win.id} className={`p-4 space-y-4 transition-all duration-500 bg-panel2/40 backdrop-blur-md border-white/5 group hover:border-accent/30 ${isLive ? 'ring-1 ring-accent/30 shadow-[0_0_25px_rgba(var(--accent-rgb),0.1)]' : ''}`}>
													<div className="flex items-start justify-between">
														<div className="space-y-1">
															<div className="flex items-center gap-2">
																<p className="text-[10px] font-black uppercase tracking-widest text-accent">
																	{new Date(win.startTime).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
																</p>
																{isLive && (
																	<div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
																		<div className="h-1 w-1 rounded-full bg-accent animate-ping" />
																		<span className="text-[8px] font-black text-accent uppercase tracking-tighter">Live</span>
																	</div>
																)}
															</div>
															<p className="text-xs font-black tracking-tight text-text-primary">
																{new Date(win.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} 
																<span className="mx-1 text-text-muted/40">—</span>
																{new Date(win.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
															</p>
														</div>
														{!isPast && (
															<Button 
																size="sm" 
																variant="ghost" 
																className="text-accent-urgency hover:bg-accent-urgency/10 h-7 px-2 text-[8px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity"
																disabled={isLoading}
																onClick={() => closeWindow(win.id, win.slots.length)}
															>
																Abort
															</Button>
														)}
													</div>

													{/* Slots under this window */}
													<div className="space-y-2">
														{win.slots.length === 0 ? (
															<div className="py-2.5 px-3 rounded-xl bg-black/20 border border-dashed border-white/5 text-center">
																<p className="text-[9px] font-black uppercase tracking-widest opacity-20">Awaiting Signals...</p>
															</div>
														) : (
															win.slots.map((s: any) => (
																<div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors">
																	<div className="flex items-center gap-3">
																		<div className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-text-muted'}`} />
																		<p className="text-[10px] font-bold font-mono">
																			{new Date(s.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
																		</p>
																	</div>
																	<div className="flex items-center gap-2">
																		<span className="text-[8px] font-black uppercase text-text-muted/40 tracking-[0.2em]">Source:</span>
																		<p className="text-[10px] font-black uppercase tracking-widest text-text-primary">
																			{s.claimedBy.login}
																		</p>
																	</div>
																</div>
															))
														)}
													</div>
												</Card>
											);
										})}
									</div>
								</div>
							</div>
						)}

						{/* MISSION DEBRIEF SECTION */}
						{evaluations && evaluations.length > 0 && (
							<div className="space-y-8 pt-8 border-t-2 border-accent/20 animate-in slide-in-from-bottom-4 duration-500">
								<div className="flex items-center justify-between">
									<h4 className="text-lg font-black uppercase tracking-widest text-text-primary">Mission Debriefs</h4>
								</div>

								<div className="grid gap-6">
									{evaluations.map((ev: any, idx: number) => (
										<Card key={ev.id} className="p-6 bg-accent/5 border-accent/20 space-y-6">
											<div className="flex items-start justify-between">
												<div className="flex items-start gap-4">
													<div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
														<svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
													</div>
													<div className="space-y-1">
														<p className="text-sm font-black uppercase tracking-widest">Debrief #{evaluations.length - idx}</p>
														<p className="text-xs text-text-muted">Assessed by <span className="font-bold text-accent">{ev.evaluator.name || ev.evaluator.login}</span></p>
													</div>
												</div>
												<div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-500">
													Evaluation Received
												</div>
											</div>

											{!ev.hasSubmittedFeedback ? (
												<div className="space-y-4">
													<div className="p-4 rounded-xl bg-background border border-border">
														<p className="text-xs text-text-muted leading-relaxed">
															To access this mission verdict and detailed breakdown, you must first provide feedback on your session with <span className="text-accent font-bold">{ev.evaluator.name || ev.evaluator.login}</span>.
														</p>
													</div>
													<Button 
														variant="primary" 
														className="w-full font-black uppercase tracking-[0.2em]"
														onClick={() => { setSelectedEvaluation(ev); setShowFeedback(true); }}
													>
														Submit Session Feedback
													</Button>
													{ev.timeToAutoReveal > 0 && (
														<p className="text-[9px] text-center font-black uppercase tracking-[0.2em] text-text-muted">
															OR Wait {Math.floor(ev.timeToAutoReveal / 3600000)}h {Math.floor((ev.timeToAutoReveal % 3600000) / 60000)}m for auto-reveal
														</p>
													)}
												</div>
											) : (
												<Button 
													variant="primary" 
													className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-background font-black uppercase tracking-[0.3em] border-none"
													onClick={() => router.push(`/evaluations/${ev.id}/result`)}
												>
													Decrypt Mission Results 🚀
												</Button>
											)}
										</Card>
									))}
								</div>
							</div>
						)}

						{/* FEEDBACK MODAL OVERLAY */}
						{showFeedback && (
							<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
								<Card className="w-full max-w-lg p-8 space-y-8 bg-panel border-accent/20 shadow-2xl">
									<div className="text-center space-y-2">
										<h2 className="text-xl font-black uppercase tracking-[0.2em] text-text-primary">Session Feedback</h2>
										<p className="text-[10px] text-text-muted uppercase tracking-widest leading-relaxed">
											Assessor: <span className="text-accent">{selectedEvaluation.evaluator.name || selectedEvaluation.evaluator.login}</span>
										</p>
									</div>

									<div className="space-y-4">
										<p className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Session Quality</p>
										<div className="flex justify-center gap-4">
											{[1, 2, 3, 4, 5].map(star => (
												<button 
													key={star} 
													onClick={() => setFeedbackRating(star)}
													className={`text-3xl transition-all ${feedbackRating >= star ? 'text-accent scale-110' : 'text-text-muted/20 hover:text-text-muted/40'}`}
												>
													{feedbackRating >= star ? '★' : '☆'}
												</button>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Session Log (Optional)</p>
										<textarea 
											className="w-full bg-background border border-border rounded-xl p-4 text-xs text-text-primary focus:outline-none focus:border-accent/30 resize-none min-h-[120px]"
											placeholder="Briefly describe your experience with the assessor..."
											value={feedbackComment}
											onChange={e => setFeedbackComment(e.target.value)}
										/>
									</div>

									<div className="flex gap-4 pt-4">
										<Button variant="ghost" className="flex-1 font-black uppercase tracking-[0.2em] text-[10px]" onClick={() => setShowFeedback(false)}>Cancel</Button>
										<Button 
											variant="primary" 
											className="flex-[2] font-black uppercase tracking-[0.2em] text-[10px]"
											disabled={feedbackRating === 0 || isLoading}
											onClick={async () => {
												setIsLoading(true);
												try {
													const res = await fetch(`/api/evaluations/${selectedEvaluation.id}/feedback`, {
														method: "POST",
														headers: { "Content-Type": "application/json" },
														body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment, fromRole: "TEAM" }),
													});
													if (res.ok) {
														toast("Feedback transmitted", "success");
														playSFX("achievement");
														setShowFeedback(false);
														fetchEvaluation();
													}
												} catch (err) {
													toast("Failed to transmit", "error");
												} finally {
													setIsLoading(false);
												}
											}}
										>
											{isLoading ? "Transmitting..." : "Submit Feedback"}
										</Button>
									</div>
								</Card>
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

			<section className="space-y-8 pt-4">
				<div className="flex items-center gap-4 justify-center opacity-40">
					<div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-text-muted" />
					<h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted italic">Evaluation Protocol</h4>
					<div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-text-muted" />
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="group p-6 rounded-2xl bg-panel-2/20 border border-white/5 space-y-3 hover:bg-panel-2/40 transition-all duration-500">
						<div className="flex items-center gap-2">
							<div className="p-1.5 rounded-md bg-accent/10 border border-accent/20 group-hover:scale-110 transition-transform">
								<svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
							</div>
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Peer Review</p>
						</div>
						<p className="text-xs text-text-muted leading-relaxed font-medium">
							Two other squads must review and approve your hardware and documentation before the mission can proceed to finalization.
						</p>
					</div>

					<div className="group p-6 rounded-2xl bg-panel-2/20 border border-white/5 space-y-3 hover:bg-panel-2/40 transition-all duration-500">
						<div className="flex items-center gap-2">
							<div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
								<svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
							</div>
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Staff Review</p>
						</div>
						<p className="text-xs text-text-muted leading-relaxed font-medium">
							A final tactical sign-off by a lab moderator is required for all high-rank missions (A/S) to ensure system integrity.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
