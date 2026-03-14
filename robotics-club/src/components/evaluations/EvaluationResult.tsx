"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSound } from "@/components/providers/SoundProvider";
import confetti from "canvas-confetti";

interface EvaluationResultProps {
	evaluationId: string;
}

type Stage = "REVEAL_EVALUATOR" | "WEATHER_REPORT" | "VERDICT" | "DETAILS";

export function EvaluationResult({ evaluationId }: EvaluationResultProps) {
	const router = useRouter();
	const { playSFX } = useSound();
	
	const [loading, setLoading] = useState(true);
	const [evaluation, setEvaluation] = useState<any>(null);
	const [stage, setStage] = useState<Stage>("REVEAL_EVALUATOR");
	const [animationPlayed, setAnimationPlayed] = useState(false);

	useEffect(() => {
		const fetchResult = async () => {
			try {
				const res = await fetch(`/api/evaluations/${evaluationId}/result`);
				const json = await res.json();
				if (json.success) {
					setEvaluation(json.data);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		fetchResult();
	}, [evaluationId]);

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
	if (!evaluation) return <div className="p-12 text-center text-text-muted">Mission data corrupted or unavailable.</div>;

	const nextStage = () => {
		if (stage === "REVEAL_EVALUATOR") setStage("WEATHER_REPORT");
		else if (stage === "WEATHER_REPORT") setStage("VERDICT");
		else if (stage === "VERDICT") setStage("DETAILS");
		playSFX("button");
	};

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
							<h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-4">Tactical Weather Report</h3>
							<p className="text-lg font-bold text-text-primary leading-relaxed italic font-serif">
								{evaluation.totalScore === 100 ? (
									"\"The performance was statistically impossible. Zero friction in logic, zero anomalies in execution. This is the gold standard for future mission parameters.\""
								) : evaluation.attemptCount >= 6 ? (
									"\"Intermittent failures have only reinforced the squad's resolve. The mission data shows extreme resilience despite the current setback.\""
								) : (
									"\"The squad demonstrated high adaptability during the stress test. Code modularity was the primary highlight, though documentation coverage appeared fragmented in the final quadrant.\""
								)}
							</p>
							<p className="text-[10px] text-text-muted mt-4 uppercase tracking-widest">— AI Generated Synthesis</p>
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

						<div className="flex justify-center pt-8">
							<Button variant="primary" size="lg" className="px-12 font-black uppercase tracking-[0.3em]" onClick={() => router.push("/cursus")}>Back to Headquarters</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
