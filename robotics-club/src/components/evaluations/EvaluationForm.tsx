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
	}, [slotId, toast]);

	const currentSection = sheet?.sections?.[currentSectionIdx];
	const isLastSection = currentSectionIdx === (sheet?.sections?.length || 0) - 1;

	const handleNext = () => {
		// Validate current section
		const missingRequired = currentSection.questions.some((q: any) => 
			q.required && (responses[q.id] === undefined || responses[q.id] === "")
		);

		if (missingRequired) {
			toast("Please answer all required questions", "error");
			return;
		}

		if (isLastSection) {
			// Move to written feedback
			setCurrentSectionIdx(currentSectionIdx + 1);
		} else {
			setCurrentSectionIdx(currentSectionIdx + 1);
		}
		window.scrollTo(0, 0);
		playSFX("button");
	};

	const submitEvaluation = async () => {
		if (writtenFeedback.length < 100) {
			toast("Feedback must be at least 100 characters", "error");
			return;
		}

		if (!confirm("Once submitted this cannot be changed. Are you sure?")) return;

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
				router.push("/evaluations");
			} else {
				toast(json.error || "Failed to submit", "error");
			}
		} catch (error) {
			toast("Network error", "error");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return <div className="p-12 text-center text-text-muted animate-pulse font-mono uppercase tracking-[0.2em] text-[10px]">Initializing Assessment Link...</div>;
	if (!sheet || !slot) return <div className="p-12 text-center text-text-muted">Error loading mission parameters.</div>;

	const isFinalFeedbackStep = currentSectionIdx === sheet.sections.length;

	return (
		<div className="max-w-4xl mx-auto py-12 px-4">
			{/* Progress Header */}
			<div className="mb-8 space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Badge rank={slot.team.project.rank} size="lg" />
						<div>
							<h1 className="text-xl font-black uppercase tracking-widest text-text-primary">{slot.team.project.title}</h1>
							<p className="text-xs text-text-muted uppercase tracking-wider">Evaluating: <span className="text-accent font-bold">{slot.claimedBy?.login || "Unknown"}</span></p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Mission Progress</p>
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold text-accent">{currentSectionIdx + 1}</span>
							<span className="text-[10px] text-text-muted">/</span>
							<span className="text-xs font-bold text-text-primary">{sheet.sections.length + 1}</span>
						</div>
					</div>
				</div>
				<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
					<div 
						className="h-full bg-accent transition-all duration-500 ease-out"
						style={{ width: `${((currentSectionIdx + 1) / (sheet.sections.length + 1)) * 100}%` }}
					/>
				</div>
			</div>

			{/* Form Body */}
			<Card className="p-8 space-y-8 bg-panel/50 border-white/5">
				{!isFinalFeedbackStep ? (
					<div className="space-y-8">
						<div className="border-b border-white/5 pb-4">
							<h2 className="text-lg font-black uppercase tracking-widest text-accent">{currentSection.title}</h2>
							<p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Please assess the squad based on the criteria below.</p>
						</div>

						<div className="space-y-12">
							{currentSection.questions.map((q: any) => (
								<div key={q.id} className="space-y-4">
									<div className="space-y-1">
										<div className="flex items-baseline gap-2">
											<h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">{q.label}</h3>
											{q.isHardRequirement && <span className="text-[8px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-red-500/20">Critical Requirement</span>}
										</div>
										{q.description && <p className="text-xs text-text-muted leading-relaxed">{q.description}</p>}
									</div>

									{/* Question Input Based on Type */}
									<div className="pt-2">
										{q.type === "STAR_RATING" && (
											<div className="flex items-center gap-4">
												{[1, 2, 3, 4, 5].map((star) => (
													<button
														key={star}
														onClick={() => setResponses({ ...responses, [q.id]: star })}
														className={`text-2xl transition-all ${responses[q.id] >= star ? 'text-accent scale-110' : 'text-white/10 hover:text-white/30'}`}
													>
														★
													</button>
												))}
												{responses[q.id] && <span className="text-[10px] font-black uppercase tracking-widest text-accent ml-2">{responses[q.id]}/5 POINTS</span>}
											</div>
										)}

										{q.type === "CHECKBOX" && (
											<label className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
												responses[q.id] ? 'bg-accent/5 border-accent/30' : 'bg-white/5 border-white/5'
											}`}>
												<input
													type="checkbox"
													className="accent-accent scale-125"
													checked={!!responses[q.id]}
													onChange={(e) => setResponses({ ...responses, [q.id]: e.target.checked })}
												/>
												<span className="text-xs font-bold uppercase tracking-widest text-text-primary">Condition Met</span>
											</label>
										)}

										{q.type === "LINEAR_SCALE" && (
											<div className="space-y-4">
												<input
													type="range"
													min={q.scaleMin || 0}
													max={q.scaleMax || 10}
													className="w-full accent-accent"
													value={responses[q.id] || q.scaleMin || 0}
													onChange={(e) => setResponses({ ...responses, [q.id]: Number(e.target.value) })}
												/>
												<div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
													<span>{q.scaleMinLabel || "Minimum"}</span>
													<span className="text-accent">{responses[q.id] || q.scaleMin || 0}</span>
													<span>{q.scaleMaxLabel || "Maximum"}</span>
												</div>
											</div>
										)}

										{q.type === "MULTIPLE_CHOICE" && (
											<div className="grid grid-cols-1 gap-2">
												{q.options?.map((opt: string) => (
													<button
														key={opt}
														onClick={() => setResponses({ ...responses, [q.id]: opt })}
														className={`text-left p-4 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
															responses[q.id] === opt ? 'bg-accent/5 border-accent/40 text-accent' : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'
														}`}
													>
														{opt}
													</button>
												))}
											</div>
										)}
										
										{(q.type === "SHORT_TEXT" || q.type === "LONG_TEXT") && (
											<textarea
												className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all resize-none"
												rows={q.type === "LONG_TEXT" ? 4 : 2}
												placeholder="Type your assessment here..."
												value={responses[q.id] || ""}
												onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
											/>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="pt-8 border-t border-white/5 flex justify-end">
							<Button size="lg" className="px-8 font-black uppercase tracking-[0.2em]" onClick={handleNext}>
								{isLastSection ? "Final Feedback →" : "Next Section →"}
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
						<div className="border-b border-white/5 pb-4">
							<h2 className="text-lg font-black uppercase tracking-widest text-accent">Overall Evaluation</h2>
							<p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Write your summary. Be specific, be honest, be kind.</p>
						</div>

						<div className="space-y-4">
							<textarea
								className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all min-h-[200px] leading-relaxed"
								placeholder="What did the squad do well? Where could they improve?..."
								value={writtenFeedback}
								onChange={(e) => setWrittenFeedback(e.target.value)}
							/>
							<div className="flex justify-between items-center px-2">
								<p className={`text-[10px] font-black uppercase tracking-widest ${writtenFeedback.length >= 100 ? 'text-emerald-500' : 'text-text-muted'}`}>
									{writtenFeedback.length} / 100 characters minimum
								</p>
							</div>
						</div>

						<div className="pt-8 border-t border-white/5">
							<Button 
								variant="primary" 
								size="lg" 
								className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] shadow-2xl"
								disabled={submitting || writtenFeedback.length < 100}
								onClick={submitEvaluation}
							>
								{submitting ? "Transmitting..." : "🚀 Submit Final Evaluation"}
							</Button>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
