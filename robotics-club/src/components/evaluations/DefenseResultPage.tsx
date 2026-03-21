"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/components/providers/SoundProvider";
import confetti from "canvas-confetti";

interface DefenseResultPageProps {
	defenseId: string;
}

type Stage = "REVEAL" | "VERDICT" | "DETAILS";

export function DefenseResultPage({ defenseId }: DefenseResultPageProps) {
	const router = useRouter();
	const { playSFX } = useSound();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [stage, setStage] = useState<Stage>("REVEAL");
	const [animCount, setAnimCount] = useState(0);
	const animPlayed = useRef(false);
	const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set());

	useEffect(() => {
		const fetchResult = async () => {
			try {
				const res = await fetch(`/api/defenses/${defenseId}/result`);
				const json = await res.json();
				if (json.success) setData(json.data);
				else setError(json.error || "Failed to load results");
			} catch { setError("Network error"); }
			finally { setLoading(false); }
		};
		fetchResult();
	}, [defenseId]);

	// Animated count-up
	useEffect(() => {
		if (stage === "VERDICT" && data && !animPlayed.current) {
			animPlayed.current = true;
			const target = Math.round(data.result.finalScore);
			let current = 0;
			const step = Math.max(1, Math.floor(target / 60));
			const interval = setInterval(() => {
				current = Math.min(current + step, target);
				setAnimCount(current);
				if (current >= target) {
					clearInterval(interval);
					if (data.result.passed && !data.result.provisional) {
						playSFX("achievement");
						confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#FFD700", "#4ADE80", "#CC44FF", "#FF6B00"] });
					} else {
						playSFX("button");
					}
				}
			}, 30);
			return () => clearInterval(interval);
		}
	}, [stage, data, playSFX]);

	if (loading) return <div className="min-h-screen flex items-center justify-center p-12 text-text-muted animate-pulse font-black tracking-widest uppercase text-[10px]">Decrypting Defense Results...</div>;
	if (error) return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-background">
			<Card className="max-w-md w-full p-8 text-center border-accent-urgency/20 bg-accent-urgency/5">
				<h2 className="text-xl font-black uppercase tracking-tighter text-text-primary mb-2">Access Restricted</h2>
				<p className="text-xs text-text-muted uppercase tracking-widest leading-relaxed mb-8">{error}</p>
				<Button variant="ghost" size="sm" onClick={() => router.push("/evaluations")}>← Return to Evaluations</Button>
			</Card>
		</div>
	);
	if (!data) return null;

	const r = data.result;
	const isPassed = r.passed && !r.provisional;
	const isFailed = !r.passed && !r.provisional;
	const isProvisional = r.provisional;

	const nextStage = () => {
		if (stage === "REVEAL") setStage("VERDICT");
		else if (stage === "VERDICT") setStage("DETAILS");
		playSFX("button");
	};

	const statusColor = isPassed ? "emerald" : isProvisional ? "amber" : "red";

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--accent-rgb),0.05),transparent)]" />

			<div className="max-w-3xl w-full relative z-10">
				{/* REVEAL STAGE */}
				{stage === "REVEAL" && (
					<div className="text-center space-y-8 animate-in zoom-in fade-in duration-700">
						<Badge rank={data.project.rank} size="lg" className="mx-auto" />
						<div className="space-y-3">
							<h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Public Defense Results</h2>
							<p className="text-3xl font-black uppercase tracking-widest text-text-primary">{data.project.title}</p>
							<p className="text-xs text-text-muted uppercase tracking-wider">{data.teamName}</p>
						</div>
						<Button variant="primary" size="lg" className="px-12 font-black uppercase tracking-[0.3em]" onClick={nextStage}>
							Reveal Verdict →
						</Button>
					</div>
				)}

				{/* VERDICT STAGE */}
				{stage === "VERDICT" && (
					<div className="text-center space-y-12 animate-in zoom-in-95 fade-in duration-1000">
						{/* Final Score */}
						<div className="space-y-4">
							<div className={`text-8xl font-black tabular-nums ${isPassed ? "text-emerald-400" : isProvisional ? "text-amber-400 animate-pulse" : "text-red-500"}`}>
								{animCount}
							</div>
							<p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">out of 100</p>
						</div>

						{/* Overall Result */}
						<div className={`text-3xl font-black uppercase tracking-[0.2em] ${isPassed ? "text-emerald-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]" : isProvisional ? "text-amber-400" : "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]"}`}>
							{isPassed ? "PASSED" : isProvisional ? "PROVISIONAL" : "NOT YET"}
						</div>
						{isProvisional && (
							<p className="text-xs text-amber-400/60 uppercase tracking-wider">{r.provisionalReason || "Awaiting confirmation"}</p>
						)}

						{/* Gate Summary */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Card className="p-4 bg-panel/30 border-white/5 text-center space-y-2">
								<p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Admin Gate</p>
								<span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${r.adminPassed === true ? "bg-emerald-500/20 text-emerald-400" : r.adminPassed === false ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
									{r.adminPassed === true ? "PASSED" : r.adminPassed === false ? "FAILED" : "PENDING"}
								</span>
								<p className="text-[9px] text-text-muted">{r.adminCount} admin(s)</p>
								{r.adminAverage !== null && <p className="text-xs font-bold text-text-primary">{Math.round(r.adminAverage)}/100</p>}
							</Card>
							<Card className="p-4 bg-panel/30 border-white/5 text-center space-y-2">
								<p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Expert Jury</p>
								<span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${r.expertPassed === true ? "bg-emerald-500/20 text-emerald-400" : r.expertPassed === false ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
									{r.expertPassed === true ? "PASSED" : r.expertPassed === false ? "FAILED" : "PENDING"}
								</span>
								<p className="text-[9px] text-text-muted">{r.expertCount} expert(s)</p>
								{r.expertAverage !== null && <p className="text-xs font-bold text-text-primary">{Math.round(r.expertAverage)}/100</p>}
							</Card>
							<Card className="p-4 bg-panel/30 border-white/5 text-center space-y-2">
								<p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Gallery</p>
								{r.galleryExcluded ? (
									<>
										<span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-gray-500/20 text-gray-400">EXCLUDED</span>
										{r.dispelledNote && <p className="text-[9px] text-text-muted italic">"{r.dispelledNote}"</p>}
									</>
								) : (
									<>
										<p className="text-xs font-bold text-text-primary">{r.galleryWeighted !== null ? `${Math.round(r.galleryWeighted)}/100` : "N/A"}</p>
										<p className="text-[9px] text-text-muted">{r.galleryCount} members</p>
									</>
								)}
							</Card>
						</div>

						<Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-text-primary" onClick={nextStage}>
							View Detailed Feedback ↓
						</Button>
					</div>
				)}

				{/* DETAILS STAGE */}
				{stage === "DETAILS" && (
					<div className="space-y-10 animate-in slide-in-from-bottom-8 fade-in duration-700">
						{/* Evaluator Feedback */}
						{["admin", "expert", "gallery"].map(tier => {
							const feedback = data.evaluatorFeedback.filter((f: any) => f.tier === tier);
							if (feedback.length === 0) return null;
							const tierLabel = tier === "admin" ? "Admin Feedback" : tier === "expert" ? "Expert Jury Feedback" : "Club Gallery Feedback";

							return (
								<div key={tier} className="space-y-4">
									<h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">{tierLabel}</h3>
									{feedback.map((fb: any, idx: number) => {
										const key = `${tier}-${idx}`;
										const isExpanded = expandedFeedback.has(idx);
										return (
											<Card key={key} className="p-6 space-y-4 bg-panel/30 border-white/5">
												<div className="flex items-center justify-between">
													<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{fb.label}</span>
													<span className="text-[10px] font-mono font-bold text-accent">{Math.round(fb.totalScore)}/100</span>
												</div>
												{fb.overallReview && (
													<p className="text-xs text-text-muted leading-relaxed italic">"{fb.overallReview}"</p>
												)}
												<button
													className="text-[9px] font-black uppercase tracking-widest text-accent/60 hover:text-accent transition-colors"
													onClick={() => {
														const next = new Set(expandedFeedback);
														if (isExpanded) next.delete(idx); else next.add(idx);
														setExpandedFeedback(next);
													}}
												>
													{isExpanded ? "Hide Scores ▲" : "Show Scores ▼"}
												</button>
												{isExpanded && fb.criteriaScores.length > 0 && (
													<div className="space-y-2 border-t border-white/5 pt-3">
														{fb.criteriaScores.map((cs: any, i: number) => (
															<div key={i} className="flex items-center justify-between">
																<span className="text-[9px] font-bold text-text-muted truncate">{cs.criteriaName}</span>
																<div className="flex gap-0.5">
																	{Array.from({ length: 5 }, (_, s) => (
																		<span key={s} className={`text-[8px] ${s < cs.score ? "text-accent" : "text-text-muted/20"}`}>★</span>
																	))}
																</div>
															</div>
														))}
													</div>
												)}
											</Card>
										);
									})}
								</div>
							);
						})}

						{/* Dimension Breakdown */}
						{data.criteriaAverages?.length > 0 && (
							<div className="space-y-4">
								<h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Dimension Breakdown</h3>
								<Card className="p-6 bg-panel/30 border-white/5 space-y-3">
									{data.criteriaAverages.map((c: any, idx: number) => (
										<div key={idx} className="space-y-1">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-bold text-text-muted">{c.name}</span>
												<span className="text-[10px] font-mono font-bold text-text-primary">{c.average.toFixed(1)}</span>
											</div>
											<div className="h-1.5 w-full bg-panel2 rounded-full overflow-hidden">
												<div className="h-full bg-accent transition-all duration-1000" style={{ width: `${(c.average / 5) * 100}%` }} />
											</div>
										</div>
									))}
									{data.criteriaAverages.length >= 2 && (
										<div className="pt-3 border-t border-white/5 text-[10px] text-text-muted space-y-1">
											<p>Strongest: <span className="text-emerald-400 font-bold">{data.criteriaAverages[0].name}</span></p>
											<p>Needs work: <span className="text-red-400 font-bold">{data.criteriaAverages[data.criteriaAverages.length - 1].name}</span></p>
										</div>
									)}
								</Card>
							</div>
						)}

						<div className="text-center pt-8">
							<Button variant="primary" size="lg" className="px-12 font-black uppercase tracking-[0.3em]" onClick={() => router.push("/evaluations")}>
								🛡️ Return to Evaluation Hub
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
