"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/components/providers/SoundProvider";
import { useToast } from "@/components/ui/Toast";
import confetti from "canvas-confetti";

interface EvaluationResultProps {
	evaluationId: string;
}

type Stage = "REVEAL_EVALUATOR" | "WEATHER_REPORT" | "VERDICT" | "DETAILS";

export function EvaluationResult({ evaluationId }: EvaluationResultProps) {
	const router = useRouter();
	const { playSFX } = useSound();
	const { toast } = useToast();
	
	const [loading, setLoading] = useState(true);
	const [evaluation, setEvaluation] = useState<any>(null);
	const [stage, setStage] = useState<Stage>("REVEAL_EVALUATOR");
	const [animationPlayed, setAnimationPlayed] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [verdictLoading, setVerdictLoading] = useState(false);
	const [verdictResult, setVerdictResult] = useState<{ passed: boolean, newRank: string | null } | null>(null);
	const [showRankAnim, setShowRankAnim] = useState(false);

	useEffect(() => {
		const fetchResult = async () => {
			try {
				const res = await fetch(`/api/evaluations/${evaluationId}/result`);
				const json = await res.json();
				if (json.success) {
					// Redirect evaluators away - they don't need the report
					if (!json.data.isEvaluatee) {
						router.push("/evaluations");
						return;
					}
					setEvaluation(json.data);
				} else {
					setError(json.error || "Failed to retrieve mission data.");
				}
			} catch (error) {
				console.error(error);
				setError("Network disturbance detected. Data uplink failed.");
			} finally {
				setLoading(false);
			}
		};
		fetchResult();
	}, [evaluationId, router]);

	useEffect(() => {
		if (stage === "VERDICT" && evaluation && !animationPlayed) {
			if (evaluation.passed) {
				playSFX("achievement");
				confetti({
					particleCount: 150,
					spread: 70,
					origin: { y: 0.6 },
					colors: ["#FFD700", "#C0C0C0", "#CD7F32", "#4ADE80"]
				});
			} else {
				playSFX("button");
			}
			setAnimationPlayed(true);
		}
	}, [stage, evaluation, playSFX, animationPlayed]);

	if (loading) return <div className="p-12 text-center text-text-muted animate-pulse font-mono uppercase tracking-[0.2em] text-[10px]">Processing Mission Output...</div>;
	
	if (error) return (
		<div className="min-h-screen flex items-center justify-center p-6 bg-background">
			<Card className="max-w-md w-full p-8 text-center border-accent-urgency/20 bg-accent-urgency/5">
				<div className="w-16 h-16 bg-accent-urgency/10 border border-accent-urgency/20 rounded-full flex items-center justify-center mx-auto mb-6">
					<svg className="w-8 h-8 text-accent-urgency" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<h2 className="text-xl font-black uppercase tracking-tighter text-text-primary mb-2">Access Restricted</h2>
				<p className="text-xs text-text-muted uppercase tracking-widest leading-relaxed mb-8">
					{error}
				</p>
				<Button 
					variant="ghost" 
					size="sm" 
					className="text-[10px] uppercase font-black opacity-60 hover:opacity-100"
					onClick={() => router.push("/evaluations")}
				>
					← Return to Mission Control
				</Button>
			</Card>
		</div>
	);

	if (!evaluation) return <div className="p-12 text-center text-text-muted">Mission data corrupted or unavailable.</div>;

	const nextStage = () => {
		if (stage === "REVEAL_EVALUATOR") setStage("WEATHER_REPORT");
		else if (stage === "WEATHER_REPORT") setStage("VERDICT");
		else if (stage === "VERDICT") setStage("DETAILS");
		playSFX("button");
	};

	const handleFinalVerdict = async () => {
		setVerdictLoading(true);
		try {
			const res = await fetch(`/api/evaluations/${evaluationId}/final-verdict`, { method: "POST" });
			const json = await res.json();
			if (json.ok) {
				setVerdictResult({ passed: json.passed, newRank: json.newRank });
				if (json.newRank) {
					setTimeout(() => setShowRankAnim(true), 3000); // Wait for pass anim to finish
				}
			} else {
				toast(json.error || "Failed to calculate verdict");
			}
		} catch {
			toast("Network error");
		} finally {
			setVerdictLoading(false);
		}
	};

	if (verdictResult) {
		if (showRankAnim && verdictResult.newRank) {
			return (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-3xl animate-in fade-in duration-1000 p-6">
					<div className="text-center space-y-8 animate-in slide-in-from-bottom-12 duration-1000 delay-300">
						<h1 className="text-7xl md:text-9xl font-black uppercase tracking-[0.5em] text-accent animate-pulse">RANK UP</h1>
						<p className="text-2xl md:text-3xl font-bold text-text-primary tracking-widest leading-relaxed">
							Welcome to Rank <span className="text-accent underline decoration-4 underline-offset-8">{verdictResult.newRank}</span>
						</p>
						<div className="pt-12">
							<Button variant="primary" size="lg" className="px-12 py-6 text-sm" onClick={() => router.push("/cursus")}>
								Return to Base →
							</Button>
						</div>
					</div>
				</div>
			);
		}

		if (verdictResult.passed) {
			return (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-green-500/5 backdrop-blur-xl animate-in fade-in duration-500 p-6">
					<div className="text-center space-y-6">
						<h2 className="text-5xl md:text-7xl font-black uppercase tracking-[0.2em] text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all">Mission Accomplished</h2>
						<p className="text-lg md:text-xl text-text-primary uppercase tracking-widest font-bold opacity-80">All requirements met successfully.</p>
						{!verdictResult.newRank && (
							<div className="pt-8">
								<Button variant="ghost" className="border border-green-500/50 text-green-400 hover:bg-green-500/20" onClick={() => router.push("/cursus")}>
									Return to Base →
								</Button>
							</div>
						)}
					</div>
				</div>
			);
		} else {
			return (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-red-500/5 backdrop-blur-xl animate-in fade-in duration-500 p-6">
					<div className="text-center space-y-6">
						<h2 className="text-5xl md:text-7xl font-black uppercase tracking-[0.2em] text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">Mission Failed</h2>
						<p className="text-lg md:text-xl text-text-primary uppercase tracking-widest font-bold opacity-80">Requirements were not met across evaluations.</p>
						<div className="pt-8">
							<Button variant="ghost" className="border border-red-500/50 text-red-500 hover:bg-red-500/20" onClick={() => router.push("/cursus")}>
								Return to Base →
							</Button>
						</div>
					</div>
				</div>
			);
		}
	}

	return (
		<div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-1000 ${evaluation.totalScore === 42 ? "bg-accent/5" : "bg-background"}`}>
			{/* HUD Overlays */}
			<div className="absolute top-8 left-8 border-l border-t border-white/10 p-4 opacity-50">
				<p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">Mission Identifier</p>
				<p className="text-xs font-mono text-text-primary">{evaluationId.toUpperCase()}</p>
			</div>
			
			<div className="max-w-xl w-full">
				{stage === "REVEAL_EVALUATOR" && (
					<div className="text-center space-y-8 animate-in zoom-in fade-in duration-700">
						<div className="relative">
							<div className="w-32 h-32 mx-auto rounded-2xl bg-panel2 border-2 border-accent/20 flex items-center justify-center relative shadow-2xl overflow-hidden group">
								{evaluation.evaluator.image ? (
									<img src={evaluation.evaluator.image} alt={evaluation.evaluator.login} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
								) : (
									<span className="text-3xl font-black text-accent/40">{evaluation.evaluator.login[0].toUpperCase()}</span>
								)}
								<div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
							</div>
							<div className="absolute -top-2 -right-2">
								<Badge rank={evaluation.evaluator.currentRank} size="sm" />
							</div>
						</div>
						<div className="space-y-2">
							<h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Mission Assessor Identified</h2>
							<p className="text-2xl font-black uppercase tracking-widest text-text-primary">{evaluation.evaluator.name || evaluation.evaluator.login}</p>
						</div>
						<Button variant="primary" size="lg" className="px-12 font-black uppercase tracking-[0.3em]" onClick={nextStage}>Decrypt Report →</Button>
					</div>
				)}



				{stage === "WEATHER_REPORT" && (
					<div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
						<div className="border-l-2 border-accent pl-6 py-2">
							<h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4">Assessor's Tactical Summary</h3>
							<p className="text-lg font-bold text-text-primary leading-relaxed italic font-serif">
								"{evaluation.writtenFeedback.slice(0, 300)}{evaluation.writtenFeedback.length > 300 ? '...' : ''}"
							</p>
							<p className="text-[10px] text-text-muted mt-4 uppercase tracking-widest">— {evaluation.evaluator.name || evaluation.evaluator.login}</p>
						</div>
						<div className="pt-4 flex justify-center">
							<Button variant="primary" size="lg" className="px-12 font-black uppercase tracking-[0.3em] bg-accent text-background border-none hover:bg-accent/90" onClick={nextStage}>Final Verdict →</Button>
						</div>
					</div>
				)}

				{stage === "VERDICT" && (
					<div className="text-center space-y-12 animate-in zoom-in-95 fade-in duration-1000">
						<div className="relative">
							{evaluation.passed ? (
								<div className="space-y-6">
									<div className={`text-8xl font-black drop-shadow-[0_0_50px_rgba(16,185,129,0.3)] filter animate-pulse ${evaluation.totalScore === 100 ? "text-accent animate-bounce" : "text-emerald-500"}`}>
										{evaluation.totalScore === 100 ? "FLAWLESS" : "PASS"}
									</div>
									<div className="text-xs font-black uppercase tracking-[0.5em] text-emerald-500/60 flex items-center justify-center gap-3">
										{evaluation.isMidnightEval && <span className="text-accent animate-pulse">🌙 MIDNIGHT OPS</span>}
										<span>{evaluation.totalScore === 100 ? "MISSION PERFECTION ACHIEVED" : "Mission Objectives Accomplished"}</span>
									</div>
								</div>
							) : (
								<div className="space-y-6">
									<div className={`text-8xl font-black drop-shadow-[0_0_50px_rgba(239,68,68,0.3)] filter ${evaluation.totalScore === 42 ? "text-accent animate-pulse" : "text-red-500"}`}>
										FAIL
									</div>
									<div className="text-xs font-black uppercase tracking-[0.5em] text-red-500/60 flex flex-col items-center gap-2">
										{evaluation.isMidnightEval && <span className="text-accent animate-pulse">🌙 LATE NIGHT ANOMALY</span>}
										<span>{evaluation.totalScore === 42 ? "THE ANSWER TO EVERYTHING, BUT NOT THIS" : evaluation.attemptCount >= 6 ? "SIX ATTEMPTS. THAT'S NOT FAILURE — THAT'S COMMITMENT." : "Mission Parameters Not Met"}</span>
									</div>
								</div>
							)}
						</div>
						
						<div className={`bg-white/5 border rounded-2xl p-6 backdrop-blur-xl transition-all duration-1000 ${evaluation.totalScore === 42 ? "border-accent shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]" : evaluation.totalScore === 100 ? "border-accent bg-accent/10" : "border-white/10"}`}>
							<div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Calculated Aptitude</div>
							<div className={`text-4xl font-black ${evaluation.totalScore === 100 || evaluation.totalScore === 42 ? "text-accent" : "text-text-primary"}`}>{evaluation.totalScore}%</div>
						</div>

						<Button variant="ghost" className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted hover:text-text-primary" onClick={nextStage}>View Detailed Analysis ↓</Button>
					</div>
				)}

				{stage === "DETAILS" && (
					<div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
						<div className="flex items-center justify-between">
							<h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-primary">Performance Breakdown</h3>
							<Button variant="ghost" size="sm" className="text-[10px] uppercase font-black" onClick={() => window.print()}>Export PDF</Button>
						</div>
						
						<Card className="p-6 bg-panel/30 border-white/5 space-y-6">
							<div className="space-y-4">
								<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent border-b border-accent/20 pb-2">Assessor Feedback</h4>
								<p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{evaluation.writtenFeedback}</p>
							</div>

							{!evaluation.passed && (
								<div className="space-y-4 pt-4 border-t border-white/5">
									<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 border-b border-red-500/20 pb-2">Improvement Roadmap</h4>
									<ul className="space-y-2">
										<li className="text-[10px] text-text-primary font-bold uppercase flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Refactor documentation for better readability
										</li>
										<li className="text-[10px] text-text-primary font-bold uppercase flex items-center gap-2">
											<span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Optimize resource usage in main project loops
										</li>
									</ul>
								</div>
							)}
						</Card>

						<div className="flex flex-col items-center gap-4 pt-8">
							<Button 
								variant="primary" 
								size="lg" 
								disabled={verdictLoading}
								className="px-12 font-black uppercase tracking-[0.3em]" 
								onClick={() => {
									if (evaluation.isFinal && evaluation.isEvaluatee) {
										handleFinalVerdict();
									} else {
										router.push("/cursus");
									}
								}}
							>
								{verdictLoading ? "Calculating..." : (evaluation.isFinal && evaluation.isEvaluatee ? "View Final Verdict →" : "Back to Headquarters")}
							</Button>
							
							{evaluation.passed && (
								<p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent animate-pulse">
									Outstanding performance, candidate. Keep pushing boundaries.
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
