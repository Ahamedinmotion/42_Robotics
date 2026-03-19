"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/components/providers/SoundProvider";

interface EvaluationFormProps {
	slotId: string;
}

export function EvaluationForm({ slotId }: EvaluationFormProps) {
	const router = useRouter();
	const { toast } = useToast();
	const { playSFX } = useSound();
	
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [slot, setSlot] = useState<any>(null);
	const [sheet, setSheet] = useState<any>(null);
	const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
	const [responses, setResponses] = useState<Record<string, any>>({});
	const [writtenFeedback, setWrittenFeedback] = useState("");
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [newEvalId, setNewEvalId] = useState<string | null>(null);
	const [showConfirm, setShowConfirm] = useState(false);
	
	const startTimeRef = useRef<number>(Date.now());

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(`/api/evaluations/slots/${slotId}`);
				const json = await res.json();
				if (json.success) {
					setSlot(json.data);
					
					// Fetch sheet for this project
					const sheetRes = await fetch(`/api/admin/eval-sheets/${json.data.team.projectId}`);
					const sheetJson = await sheetRes.json();
					if (sheetJson.success) {
						setSheet(sheetJson.data);
					} else {
						toast("Evaluation sheet not found for this project", "error");
					}
				} else {
					toast(json.error || "Failed to load evaluation data", "error");
				}
			} catch (error) {
				toast("Network error", "error");
			} finally {
				setLoading(false);
			}
		};
		fetchData();

		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, [slotId, toast]);

	// Timing Gate Calculation
	useEffect(() => {
		if (slot?.slotStart) {
			const start = new Date(slot.slotStart).getTime();
			const now = currentTime.getTime();
			const diff = Math.max(0, start - now);
			setTimeLeft(diff);
		}
	}, [slot, currentTime]);

	const currentSection = sheet?.sections?.[currentSectionIdx];
	const isLastSection = currentSectionIdx === (sheet?.sections?.length || 0) - 1;
	const isLocked = timeLeft > 0;

	const formatTimeLeft = (ms: number) => {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const handleNext = () => {
		if (isLocked) {
			toast("Mission parameters not yet active. Wait for slot start.", "error");
			return;
		}

		// Validate current section
		const missingRequired = currentSection.questions.some((q: any) => 
			q.required && (responses[q.id] === undefined || (Array.isArray(responses[q.id]) ? responses[q.id].length === 0 : responses[q.id] === ""))
		);

		if (missingRequired) {
			toast("Please answer all required questions", "error");
			return;
		}

		setCurrentSectionIdx(currentSectionIdx + 1);
		window.scrollTo({ top: 0, behavior: "smooth" });
		playSFX("button");
	};

	const submitEvaluation = async () => {
		if (writtenFeedback.length < 100) {
			toast("Feedback must be at least 100 characters", "error");
			return;
		}

		setShowConfirm(true);
	};

	const performFinalSubmission = async () => {
		setShowConfirm(false);
		setSubmitting(true);
		const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

		try {
			const res = await fetch(`/api/evaluations/slots/${slotId}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					responses,
					writtenFeedback,
					durationSeconds,
					sheetVersion: sheet.version,
				}),
			});

			const json = await res.json();
			if (json.success) {
				toast("Evaluation submitted successfully", "success");
				playSFX("achievement");
				setNewEvalId(json.data.id);
				setIsSubmitted(true);
			} else {
				toast(json.error || "Failed to submit", "error");
			}
		} catch (error) {
			toast("Network error", "error");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="text-center space-y-6">
				<div className="w-16 h-16 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
				<div className="font-mono uppercase tracking-[0.4em] text-[10px] text-accent animate-pulse">Syncing Mission Parameters...</div>
			</div>
		</div>
	);

	if (!sheet || !slot) return <div className="p-12 text-center text-text-muted">Error loading mission parameters.</div>;

	const isFinalFeedbackStep = currentSectionIdx === sheet.sections.length;

	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			{/* Tactical Background Elements */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--accent-rgb),0.05),transparent)]" />
			<div className="absolute inset-0 bg-[url('/grid.svg')] bg-[size:40px_40px] opacity-[0.03] pointer-events-none" />
			<div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
			
			<div className="max-w-4xl mx-auto py-12 px-6 relative z-10">
				{/* Progress Header */}
				<div className="mb-12 space-y-6">
					<div className="flex items-center justify-between gap-8">
						<div className="flex items-center gap-6">
							<Badge rank={slot.team.project.rank} size="lg" />
							<div className="space-y-1">
								<h1 className="text-3xl font-black uppercase tracking-tighter text-text-primary">
									{slot.team.project.title}
								</h1>
								<div className="flex items-center gap-3">
									<p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-2 py-0.5 border border-border/20 rounded bg-panel2/50">
										Target: <span className="text-accent">{slot.team?.name || "The Squad"}</span>
									</p>
									<span className="h-1 w-1 rounded-full bg-white/20" />
									<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
										Member: <span className="text-text-primary">{slot.claimedBy?.login || "Evaluator"}</span>
									</p>
								</div>
							</div>
						</div>

						{isLocked && (
							<div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-center group">
								<p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-1 group-hover:animate-pulse">Pre-Flight Lock</p>
								<p className="text-xl font-mono font-black text-red-500 tabular-nums">{formatTimeLeft(timeLeft)}</p>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-end">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 italic">Assessments Synced: {currentSectionIdx}/{sheet.sections.length + 1}</p>
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">System Integrity: 100%</p>
						</div>
						<div className="h-1 w-full bg-panel2 rounded-full overflow-hidden border border-border/10">
							<div 
								className="h-full bg-gradient-to-r from-accent/40 to-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] transition-all duration-1000 ease-out"
								style={{ width: `${((currentSectionIdx) / (sheet.sections.length)) * 100}%` }}
							/>
						</div>
					</div>
				</div>

				{/* Locked Overlay */}
				{isLocked ? (
					<Card className="p-16 text-center space-y-8 bg-panel/30 backdrop-blur-3xl border-red-500/10 relative overflow-hidden group">
						<div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
						<div className="relative z-10 space-y-6">
							<div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 animate-pulse">
								<svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0zM12 5V3m0 0V1m0 2h2m-2 0H10" />
								</svg>
							</div>
							<div className="space-y-2">
								<h2 className="text-2xl font-black uppercase tracking-tight text-text-primary">System Locked</h2>
								<p className="text-xs text-text-muted uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
									Mission access is restricted until scheduled start time. Use the countdown above to prepare your assessment parameters.
								</p>
							</div>
							<div className="pt-4">
								<Button 
									variant="ghost" 
									size="sm" 
									onClick={() => {
										if (confirm("Are you sure you want to abort this evaluation session? You will be returned to mission control.")) {
											router.push('/evaluations');
										}
									}} 
									className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100"
								>
									← Abort Session
								</Button>
							</div>
						</div>
					</Card>
				) : (
					<div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
						{!isFinalFeedbackStep ? (
							<Card className="p-0 overflow-hidden bg-panel/40 backdrop-blur-2xl border-border/10 shadow-2xl">
								<div className="bg-panel2/30 border-b border-border/10 p-6 flex items-center justify-between">
									<div className="space-y-1">
										<h2 className="text-xl font-black uppercase tracking-tighter text-accent">{currentSection.title}</h2>
										<p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Operational Section Evaluation</p>
									</div>
									<div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded text-accent text-[10px] font-black uppercase tracking-[0.2em]">
										Weight: {currentSection.weight}%
									</div>
								</div>

								<div className="p-8 space-y-12">
									{currentSection.questions.map((q: any) => (
										<div key={q.id} className="space-y-6 group/q">
											<div className="space-y-2">
												<div className="flex items-center justify-between gap-4">
													<div className="flex items-center gap-3">
														<div className="h-6 w-1 bg-accent group-hover/q:h-8 transition-all duration-300 rounded-full" />
														<h3 className="text-sm font-black text-text-primary uppercase tracking-wide">{q.label}</h3>
													</div>
													{q.isHardRequirement && (
														<span className="flex items-center gap-1.5 text-[8px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-sm uppercase tracking-widest border border-red-500/20">
															<span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
															Critical Parameter
														</span>
													)}
												</div>
												{q.description && <p className="text-[10px] text-text-muted leading-relaxed uppercase tracking-wider pl-4">{q.description}</p>}
											</div>

											{/* Question Input Based on Type */}
											<div className="pl-4">
												{q.type === "STAR_RATING" && (
													<div className="flex items-center gap-3">
														{[1, 2, 3, 4, 5].map((star) => (
															<button
																key={star}
																onClick={() => {
																	setResponses({ ...responses, [q.id]: star });
																	playSFX('button');
																}}
																className={`text-3xl transition-all duration-300 hover:scale-125 ${
																	(responses[q.id] || 0) >= star 
																	? 'text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]' 
																	: 'text-text-muted/20 hover:text-text-muted/40'
																}`}
															>
																{(responses[q.id] || 0) >= star ? '★' : '☆'}
															</button>
														))}
														{(responses[q.id] || 0) > 0 && <span className="text-[10px] font-mono font-black text-accent/60 ml-4 tracking-tighter">[{responses[q.id]}/5 MARKED]</span>}
													</div>
												)}

												{q.type === "CHECKBOX" && (
													<label className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
														responses[q.id] ? 'bg-accent/10 border-accent/40' : 'bg-panel2/50 border-border/10 hover:bg-panel2'
													}`}>
														<div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${responses[q.id] ? 'bg-accent border-accent' : 'bg-transparent border-border/40'}`}>
															{responses[q.id] && <svg className="w-3 h-3 text-white font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
														</div>
														<input
															type="checkbox"
															className="hidden"
															checked={!!responses[q.id]}
															onChange={(e) => {
																setResponses({ ...responses, [q.id]: e.target.checked });
																playSFX('button');
															}}
														/>
														<span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">Requirement Satisfied</span>
													</label>
												)}

												{q.type === "LINEAR_SCALE" && (
													<div className="space-y-6 pt-2">
														<div className="relative h-2 w-full">
															<input
																type="range"
																min={q.scaleMin || 0}
																max={q.scaleMax || 10}
																className="absolute inset-0 w-full h-full appearance-none bg-panel2 rounded-full outline-none cursor-pointer accent-accent"
																value={responses[q.id] || q.scaleMin || 0}
																onChange={(e) => setResponses({ ...responses, [q.id]: Number(e.target.value) })}
															/>
														</div>
														<div className="flex justify-between items-center bg-panel2/50 p-3 rounded-lg border border-border/10">
															<span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{q.scaleMinLabel || "MIN"}</span>
															<span className="text-xl font-mono font-black text-accent drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]">{responses[q.id] || q.scaleMin || 0}</span>
															<span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{q.scaleMaxLabel || "MAX"}</span>
														</div>
													</div>
												)}

												{q.type === "MULTIPLE_CHOICE" && (
													<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
														{q.options?.map((opt: any) => {
															const label = typeof opt === 'string' ? opt : opt.label;
															const isSelected = responses[q.id] === label;

															return (
																<button
																	key={label}
																	onClick={() => {
																		setResponses({ ...responses, [q.id]: label });
																		playSFX('button');
																	}}
																	className={`text-left p-4 rounded-xl border transition-all duration-300 relative group/opt ${
																		isSelected 
																		? 'bg-accent/10 border-accent/40 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]' 
																		: 'bg-panel2/50 border-border/10 hover:bg-panel2 hover:border-border/20'
																	}`}
																>
																	<div className="flex items-center justify-between">
																		<span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-accent' : 'text-text-muted group-hover/opt:text-text-primary'}`}>
																			{label}
																		</span>
																		{isSelected && <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
																	</div>
																</button>
															);
														})}
													</div>
												)}
												
												{(q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") && (
													<div className="relative">
														<textarea
															className="w-full bg-panel2 border border-border/20 rounded-2xl p-4 text-[11px] font-medium text-text-primary focus:outline-none focus:border-accent/40 transition-all resize-none placeholder:text-text-muted/30 uppercase tracking-wide leading-relaxed"
															rows={q.type === "LONG_TEXT" ? 4 : 2}
															placeholder="INPUT ASSESSMENT OBSERVATIONS..."
															value={responses[q.id] || ""}
															onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
														/>
														<div className="absolute top-0 right-0 p-2 opacity-10">
															<svg className="w-8 h-8 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
														</div>
													</div>
												)}
											</div>
										</div>
									))}
								</div>

								<div className="p-8 border-t border-border/10 bg-accent/5 flex justify-between items-center">
									<p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted/60">
										End of Sector Assessment
									</p>
									<Button size="lg" className="px-10 h-14 font-black uppercase tracking-[0.3em] rounded-xl shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]" onClick={handleNext}>
										{isLastSection ? "Mission Debrief →" : "Next Protocol →"}
									</Button>
								</div>
							</Card>
						) : (
							<Card className="p-0 overflow-hidden bg-panel/60 backdrop-blur-3xl border-accent/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
								<div className="p-12 text-center space-y-4 border-b border-border/10 relative bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.1),transparent)]">
									<div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
										<svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.243 3.243a3.003 3.003 0 014.242 4.242L10.828 17.172a4 4 0 01-1.414.828l-3.232.969.97-3.232a4 4 0 01.828-1.414l7.686-7.686z" />
										</svg>
									</div>
									<h2 className="text-3xl font-black uppercase tracking-tighter text-text-primary">Mission Debrief</h2>
									<p className="text-[10px] font-bold text-accent uppercase tracking-widest">Mandatory Qualitative Feedback Protocol</p>
									<p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed mt-2 italic">
										Finalize the evaluation by providing a comprehensive summary of student performance, technical strengths, and required focus areas.
									</p>
								</div>

								<div className="p-12 space-y-6">
									<div className="relative group">
										<textarea
											className="w-full bg-panel2/50 border-2 border-border/10 rounded-3xl p-8 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all min-h-[250px] leading-relaxed shadow-inner font-medium placeholder:text-text-muted/20"
											placeholder="TYPE FEEDBACK HERE... MINIMUM 100 CHARACTERS REQUIRED FOR CLEARANCE."
											value={writtenFeedback}
											onChange={(e) => setWrittenFeedback(e.target.value)}
										/>
										<div className="absolute top-4 right-4 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
											<span className="text-[8px] font-black uppercase tracking-[0.5em] [writing-mode:vertical-lr]">FEEDBACK_BUFFER</span>
										</div>
									</div>

									<div className="flex justify-between items-center px-4 bg-panel2/50 py-4 rounded-2xl border border-border/10">
										<div className="flex items-center gap-3">
											<div className={`h-2 w-2 rounded-full ${writtenFeedback.length >= 100 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
											<p className="text-[11px] font-mono font-black uppercase tracking-widest text-text-muted">
												Character Count: <span className={writtenFeedback.length >= 100 ? 'text-emerald-500' : 'text-red-500'}>{writtenFeedback.length}</span> / 100
											</p>
										</div>
										<p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.2em]">Transmission Size Optimized</p>
									</div>

									<div className="pt-6">
										<Button 
											variant="primary" 
											size="lg" 
											className="w-full h-20 text-md font-black uppercase tracking-[0.4em] shadow-[0_15px_40px_-10px_rgba(var(--accent-rgb),0.5)] border-t border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
											disabled={submitting || writtenFeedback.length < 100}
											onClick={submitEvaluation}
										>
											{submitting ? (
												<span className="flex items-center gap-4">
													<svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
													TRANSMITTING DATA...
												</span>
											) : "🚀 Finalize Mission Assessment"}
										</Button>
									</div>
								</div>
							</Card>
						)}
					</div>
				)}

				{showConfirm && (
					<div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-300">
						<div className="absolute inset-0 bg-black/60" />
						<Card className="max-w-md w-full p-0 overflow-hidden relative z-10 border-accent/40 shadow-[0_0_50px_rgba(var(--accent-rgb),0.4)] animate-in zoom-in-95 duration-300">
							<div className="p-10 text-center space-y-8 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.1),transparent)]">
								<div className="w-16 h-16 bg-accent-urgency/10 border border-accent-urgency/20 rounded-full flex items-center justify-center mx-auto">
									<svg className="w-8 h-8 text-accent-urgency" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
									</svg>
								</div>

								<div className="space-y-3">
									<h2 className="text-2xl font-black uppercase tracking-tighter text-text-primary">Final Confirmation</h2>
									<p className="text-[10px] text-text-muted uppercase tracking-[0.2em] leading-relaxed">
										Once submitted, these mission parameters cannot be altered. System state will be locked. Proceed?
									</p>
								</div>

								<div className="flex flex-col gap-3 pt-4">
									<Button 
										variant="primary"
										size="lg"
										className="h-14 font-black uppercase tracking-[0.3em] bg-accent-urgency hover:bg-accent-urgency/90 text-white"
										onClick={performFinalSubmission}
									>
										Finalize & Lock
									</Button>
									<Button 
										variant="ghost"
										size="lg"
										className="h-14 text-[10px] font-black uppercase tracking-[0.3em] opacity-60 hover:opacity-100"
										onClick={() => setShowConfirm(false)}
									>
										Abort Finalization
									</Button>
								</div>
							</div>
						</Card>
					</div>
				)}

				{isSubmitted && (
					<div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500">
						<div className="absolute inset-0 bg-background/80" />
						<Card className="max-w-lg w-full p-0 overflow-hidden relative z-10 border-accent/20 shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] animate-in zoom-in-95 duration-500 delay-150">
							<div className="p-12 text-center space-y-8 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.15),transparent)]">
								<div className="w-24 h-24 bg-accent/10 border-2 border-accent/20 rounded-full flex items-center justify-center mx-auto relative">
									<div className="absolute inset-0 rounded-full bg-accent/20 animate-ping opacity-20" />
									<svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
									</svg>
								</div>
								
								<div className="space-y-4">
									<h2 className="text-4xl font-black uppercase tracking-tighter text-text-primary">Mission Complete</h2>
									<p className="text-xs text-text-muted uppercase tracking-[0.2em] leading-relaxed px-8">
										Assessment parameters successfully uplinked to the central command node. System integrity validated.
									</p>
								</div>

								<div className="grid grid-cols-1 gap-4 pt-4">
									<Button 
										size="lg" 
										className="h-16 text-xs font-black uppercase tracking-[0.3em] shadow-[0_8px_30px_rgb(var(--accent-rgb)/0.3)]"
										onClick={() => router.push('/evaluations')}
									>
										🚀 Return to Mission Control
									</Button>

								</div>
							</div>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}
