"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/components/providers/SoundProvider";

interface EvaluatorPrepModalProps {
	slot: any;
	onClose: () => void;
	onReady: () => void;
}

export function EvaluatorPrepModal({ slot, onClose, onReady }: EvaluatorPrepModalProps) {
	const [checks, setChecks] = useState({
		readSubject: false,
		reviewedTimeline: false,
		preparedQuestions: false
	});
	const { playSFX } = useSound();

	const allChecked = checks.readSubject && checks.reviewedTimeline && checks.preparedQuestions;

	const toggleCheck = (key: keyof typeof checks) => {
		setChecks(prev => ({ ...prev, [key]: !prev[key] }));
		playSFX("button");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
			<Card className="w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl border-accent/20">
				<div className="p-8">
					<div className="mb-6 text-center">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
							<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-text-primary">Evaluator Prep</h2>
						<p className="text-sm text-text-muted">Complete the mission preparation checklist to begin.</p>
					</div>

					<div className="space-y-4 mb-8">
						<button 
							onClick={() => toggleCheck("readSubject")}
							className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-all ${
								checks.readSubject ? "bg-accent/5 border-accent/40 text-text-primary" : "bg-white/5 border-border/50 text-text-muted hover:bg-white/10"
							}`}
						>
							<div className={`flex h-6 w-6 items-center justify-center rounded border ${checks.readSubject ? "bg-accent border-accent text-white" : "border-border"}`}>
								{checks.readSubject && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
							</div>
							<span className="text-left font-medium">I have read the project subject sheet</span>
						</button>

						<button 
							onClick={() => toggleCheck("reviewedTimeline")}
							className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-all ${
								checks.reviewedTimeline ? "bg-accent/5 border-accent/40 text-text-primary" : "bg-white/5 border-border/50 text-text-muted hover:bg-white/10"
							}`}
						>
							<div className={`flex h-6 w-6 items-center justify-center rounded border ${checks.reviewedTimeline ? "bg-accent border-accent text-white" : "border-border"}`}>
								{checks.reviewedTimeline && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
							</div>
							<span className="text-left font-medium">I have reviewed the team's report timeline</span>
						</button>

						<button 
							onClick={() => toggleCheck("preparedQuestions")}
							className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-all ${
								checks.preparedQuestions ? "bg-accent/5 border-accent/40 text-text-primary" : "bg-white/5 border-border/50 text-text-muted hover:bg-white/10"
							}`}
						>
							<div className={`flex h-6 w-6 items-center justify-center rounded border ${checks.preparedQuestions ? "bg-accent border-accent text-white" : "border-border"}`}>
								{checks.preparedQuestions && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
							</div>
							<span className="text-left font-medium">I have prepared at least 3 questions to ask</span>
						</button>
					</div>

					<div className="flex gap-4">
						<Button variant="ghost" className="flex-1" onClick={onClose}>Close</Button>
						<Button 
							className="flex-1 shadow-lg shadow-accent/20" 
							disabled={!allChecked}
							onClick={() => {
								playSFX("unlock");
								onReady();
							}}
						>
							I'm ready
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
