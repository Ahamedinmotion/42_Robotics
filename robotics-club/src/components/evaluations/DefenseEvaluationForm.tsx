"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface DefenseEvaluationFormProps {
	defenseId: string;
}

export function DefenseEvaluationForm({ defenseId }: DefenseEvaluationFormProps) {
	const router = useRouter();
	const { toast } = useToast();
	const { playSFX } = useSound();

	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [defense, setDefense] = useState<any>(null);
	const [criteria, setCriteria] = useState<any[]>([]);
	const [settings, setSettings] = useState<any>(null);
	const [scores, setScores] = useState<Record<string, number>>({});
	const [notes, setNotes] = useState<Record<string, string>>({});
	const [overallReview, setOverallReview] = useState("");
	const [hoverStars, setHoverStars] = useState<Record<string, number>>({});
	const [showConfirm, setShowConfirm] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [packageOpen, setPackageOpen] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [defRes, critRes] = await Promise.all([
					fetch(`/api/defenses/${defenseId}`),
					fetch("/api/defenses/criteria"),
				]);
				const defJson = await defRes.json();
				const critJson = await critRes.json();

				if (defJson.success) setDefense(defJson.data);
				else { toast(defJson.error || "Failed to load defense", "error"); return; }

				if (critJson.success) {
					setCriteria(critJson.data.criteria || []);
					setSettings(critJson.data.settings || null);
				}
			} catch (err) {
				toast("Network error", "error");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [defenseId, toast]);

	const ratingScale = settings?.ratingScale || 5;
	const overallMinChars = settings?.overallMinChars || 150;

	// Validation checks
	const allScored = criteria.length > 0 && criteria.every(c => scores[c.id] && scores[c.id] > 0);
	const allNotesMet = criteria.every(c => (notes[c.id]?.length || 0) >= (c.minChars || 100));
	const overallMet = overallReview.length >= overallMinChars;
	const canSubmit = allScored && allNotesMet && overallMet;

	// Calculate average score
	const scoredCount = Object.values(scores).filter(s => s > 0).length;
	const avgScore = scoredCount > 0
		? Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / (scoredCount * ratingScale)) * 100)
		: 0;

	const handleSubmit = async () => {
		setShowConfirm(false);
		setSubmitting(true);
		try {
			const payload = {
				scores: criteria.map(c => ({
					criteriaId: c.id,
					score: scores[c.id] || 0,
					note: notes[c.id] || "",
				})),
				overallReview,
			};

			const res = await fetch(`/api/defenses/${defenseId}/evaluate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (json.success) {
				playSFX("achievement");
				setIsSubmitted(true);
			} else {
				toast(json.error || "Failed to submit", "error");
			}
		} catch (err) {
			toast("Network error", "error");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<div className="text-center space-y-6">
					<div className="w-16 h-16 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
					<div className="font-mono uppercase tracking-[0.4em] text-[10px] text-accent animate-pulse">Loading Defense Protocol...</div>
				</div>
			</div>
		);
	}

	if (!defense || !settings) {
		return (
			<div className="min-h-screen flex items-center justify-center p-6 bg-background">
				<Card className="max-w-md w-full p-8 text-center border-accent-urgency/20 bg-accent-urgency/5">
					<h2 className="text-xl font-black uppercase tracking-tighter text-text-primary mb-2">Access Restricted</h2>
					<p className="text-xs text-text-muted uppercase tracking-widest leading-relaxed mb-8">Defense data unavailable or you are not registered.</p>
					<Button variant="ghost" size="sm" onClick={() => router.push("/evaluations")}>← Return to Evaluations</Button>
				</Card>
			</div>
		);
	}

	// ── SUCCESS STATE ──
	if (isSubmitted) {
		return (
			<div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-500">
				<div className="absolute inset-0 bg-background/80" />
				<Card className="max-w-lg w-full p-0 overflow-hidden relative z-10 border-accent/20 shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] animate-in zoom-in-95 duration-500">
					<div className="p-12 text-center space-y-8 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--accent-rgb),0.15),transparent)]">
						<div className="w-24 h-24 bg-accent/10 border-2 border-accent/20 rounded-full flex items-center justify-center mx-auto relative">
							<div className="absolute inset-0 rounded-full bg-accent/20 animate-ping opacity-20" />
							<svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<div className="space-y-4">
							<h2 className="text-3xl font-black uppercase tracking-tighter text-text-primary">Evaluation Submitted</h2>
							<p className="text-xs text-text-muted uppercase tracking-[0.2em] leading-relaxed px-8">
								Thank you for contributing to the defense of <span className="text-accent">{defense.team?.project?.title}</span>.
							</p>
						</div>
						<Button size="lg" className="h-14 text-xs font-black uppercase tracking-[0.3em]" onClick={() => router.push("/evaluations")}>
							🛡️ Return to Evaluation Hub
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--accent-rgb),0.05),transparent)]" />
			<div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

			<div className="max-w-4xl mx-auto py-12 px-6 relative z-10">
				{/* Header */}
				<div className="mb-12 space-y-4">
					<div className="flex items-center gap-6">
						<Badge rank={defense.team?.project?.rank || "A"} size="lg" />
						<div className="space-y-1">
							<h1 className="text-3xl font-black uppercase tracking-tighter text-text-primary">
								Public Defense Evaluation
							</h1>
							<div className="flex items-center gap-3">
								<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
									{defense.team?.project?.title}
								</p>
								<span className="h-1 w-1 rounded-full bg-white/20" />
								<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
									{defense.team?.name || "Team"}
								</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
						<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
						<span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Evaluation Open</span>
					</div>
				</div>

				{/* Submission Package */}
				<Card className="mb-8 p-0 overflow-hidden bg-panel/40 border-border/10">
					<button
						className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
						onClick={() => setPackageOpen(!packageOpen)}
					>
						<span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Submission Package</span>
						<span className="text-text-muted text-xs">{packageOpen ? "▲" : "▼"}</span>
					</button>
					{packageOpen && (
						<div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
							<p className="text-[10px] text-text-muted uppercase tracking-wider">Review the submission materials before scoring.</p>
							{defense.team?.project?.subjectSheetUrl && (
								<a href={defense.team.project.subjectSheetUrl} target="_blank" rel="noopener" className="block text-xs text-accent underline">Project Subject Sheet →</a>
							)}
						</div>
					)}
				</Card>

				{/* Criteria Sections */}
				<div className="space-y-8">
					{criteria.map((c, idx) => (
						<Card key={c.id} className="p-8 space-y-6 bg-panel/40 backdrop-blur-2xl border-border/10">
							<div className="space-y-2">
								<h3 className="text-lg font-black text-text-primary">{c.name}</h3>
								<p className="text-xs text-text-muted leading-relaxed">{c.description}</p>
							</div>

							{/* Star Rating */}
							<div className="flex items-center gap-3">
								{Array.from({ length: ratingScale }, (_, i) => i + 1).map(star => (
									<button
										key={star}
										onMouseEnter={() => setHoverStars(prev => ({ ...prev, [c.id]: star }))}
										onMouseLeave={() => setHoverStars(prev => ({ ...prev, [c.id]: 0 }))}
										onClick={() => {
											setScores(prev => ({ ...prev, [c.id]: star }));
											playSFX("button");
										}}
										className={`text-3xl transition-all duration-300 hover:scale-125 ${
											(hoverStars[c.id] || scores[c.id] || 0) >= star
												? "text-accent drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]"
												: "text-text-muted/20 hover:text-text-muted/40"
										}`}
									>
										{(hoverStars[c.id] || scores[c.id] || 0) >= star ? "★" : "☆"}
									</button>
								))}
								{scores[c.id] > 0 && (
									<span className="text-[10px] font-mono font-black text-accent/60 ml-4">{scores[c.id]} / {ratingScale}</span>
								)}
							</div>

							{/* Note Textarea */}
							<div className="space-y-2">
								<textarea
									className="w-full bg-panel2 border border-border/20 rounded-2xl p-4 text-xs text-text-primary focus:outline-none focus:border-accent/40 transition-all resize-none min-h-[100px] leading-relaxed placeholder:text-text-muted/30"
									placeholder="What specifically did you observe that informs this score?"
									value={notes[c.id] || ""}
									onChange={(e) => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
								/>
								<div className="flex justify-between items-center px-2">
									<p className={`text-[10px] font-mono font-black ${
										(notes[c.id]?.length || 0) >= (c.minChars || 100) ? "text-emerald-500" : "text-red-500"
									}`}>
										{notes[c.id]?.length || 0} / {c.minChars || 100} minimum
									</p>
								</div>
							</div>

							{idx < criteria.length - 1 && <div className="h-[1px] bg-white/5" />}
						</Card>
					))}
				</div>

				{/* Overall Review */}
				<Card className="mt-8 p-8 space-y-6 bg-panel/60 backdrop-blur-3xl border-accent/20">
					<div className="text-center space-y-2">
						<h2 className="text-2xl font-black uppercase tracking-tighter text-text-primary">Overall Review</h2>
						<p className="text-[10px] font-bold text-accent uppercase tracking-widest">Your comprehensive assessment</p>
					</div>

					<textarea
						className="w-full bg-panel2/50 border-2 border-border/10 rounded-3xl p-8 text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-all min-h-[200px] leading-relaxed placeholder:text-text-muted/20"
						placeholder="Your overall assessment of this project and team..."
						value={overallReview}
						onChange={(e) => setOverallReview(e.target.value)}
					/>

					<div className="flex justify-between items-center px-4 bg-panel2/50 py-3 rounded-2xl border border-border/10">
						<p className={`text-[10px] font-mono font-black ${overallMet ? "text-emerald-500" : "text-red-500"}`}>
							{overallReview.length} / {overallMinChars} minimum
						</p>
						<p className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest">
							Your overall score: {avgScore} / 100
						</p>
					</div>

					{/* Score Summary */}
					{scoredCount > 0 && (
						<div className="grid grid-cols-2 md:grid-cols-5 gap-2">
							{criteria.map(c => (
								<div key={c.id} className="p-2 rounded-lg bg-panel2/30 border border-white/5 text-center">
									<p className="text-[8px] font-black uppercase tracking-widest text-text-muted truncate">{c.name}</p>
									<div className="flex justify-center gap-0.5 mt-1">
										{Array.from({ length: ratingScale }, (_, i) => (
											<span key={i} className={`text-[8px] ${i < (scores[c.id] || 0) ? "text-accent" : "text-text-muted/20"}`}>★</span>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</Card>

				{/* Pre-Submit Checklist */}
				<Card className="mt-8 p-8 space-y-6 bg-panel/40 border-border/10">
					<h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Submission Checklist</h3>
					<div className="space-y-3">
						{[
							{ label: "All criteria scored", met: allScored },
							{ label: "All notes meet minimum length", met: allNotesMet },
							{ label: "Overall review meets minimum length", met: overallMet },
						].map((item, i) => (
							<div key={i} className="flex items-center gap-3">
								<div className={`h-5 w-5 rounded flex items-center justify-center border ${
									item.met ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-panel border-red-500/30 text-red-500"
								}`}>
									{item.met ? "✓" : "✕"}
								</div>
								<span className={`text-xs font-bold ${item.met ? "text-text-primary" : "text-text-muted"}`}>{item.label}</span>
							</div>
						))}
					</div>

					<Button
						variant="primary"
						size="lg"
						className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] shadow-[0_15px_40px_-10px_rgba(var(--accent-rgb),0.5)]"
						disabled={!canSubmit || submitting}
						onClick={() => setShowConfirm(true)}
					>
						{submitting ? "Submitting..." : "🛡️ Submit Evaluation"}
					</Button>
				</Card>
			</div>

			{/* Confirmation Dialog */}
			{showConfirm && (
				<div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in duration-300">
					<div className="absolute inset-0 bg-black/60" />
					<Card className="max-w-md w-full p-10 text-center space-y-8 relative z-10 border-accent/40 shadow-[0_0_50px_rgba(var(--accent-rgb),0.4)] animate-in zoom-in-95 duration-300">
						<h2 className="text-2xl font-black uppercase tracking-tighter text-text-primary">Final Confirmation</h2>
						<p className="text-[10px] text-text-muted uppercase tracking-[0.2em] leading-relaxed">
							Once submitted, this evaluation cannot be changed. Are you sure?
						</p>
						<div className="flex flex-col gap-3">
							<Button variant="primary" size="lg" className="h-14 font-black uppercase tracking-[0.3em]" onClick={handleSubmit}>
								Confirm & Submit
							</Button>
							<Button variant="ghost" size="lg" className="h-14 text-[10px] font-black uppercase tracking-[0.3em] opacity-60 hover:opacity-100" onClick={() => setShowConfirm(false)}>
								Go Back
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
