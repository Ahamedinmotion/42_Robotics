"use client";

import { useState } from "react";
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

	const reportsCount = team.weeklyReports?.length || 0;
	const hasRepo = !!team.repoUrl;
	const isEvaluating = team.status === "EVALUATING";

	const checklist = [
		{ id: "reports", label: "Weekly Progress Reports", status: reportsCount > 0, detail: `${reportsCount} reports submitted` },
		{ id: "repo", label: "Repository Linked", status: hasRepo, detail: team.repoUrl || "Pending" },
		{ id: "health", label: "Squad Health", status: true, detail: "Nominal" },
	];

	const allReady = checklist.every(item => item.status);

	const handleOpenEval = async () => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}`, {
				method: "PATCH",
				body: JSON.stringify({ status: "EVALUATING" }),
			});
			if (res.ok) {
				toast("Evaluation phase initiated!", "success");
				playSFX("achievement");
				window.location.reload();
			}
		} catch (err) {
			toast("Failed to initiate evaluation", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto space-y-12">
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
					<div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
						<div className="flex justify-center">
							<div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
								<span className="text-2xl">📡</span>
							</div>
						</div>
						<h4 className="text-xl font-black text-emerald-400">Mission Evaluating</h4>
						<p className="text-sm text-emerald-400/70 font-medium">
							Your squad is visible to evaluators. Check the Dashboard for scheduled slots.
						</p>
					</div>
				) : (
					<div className="pt-4">
						<Button 
							size="lg" 
							className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] shadow-2xl"
							disabled={!allReady || isLoading}
							onClick={handleOpenEval}
						>
							{allReady ? "🚀 Initiate Evaluation Phase" : "Checklist Incomplete"}
						</Button>
						{!allReady && (
							<p className="text-[10px] text-center mt-4 text-text-muted font-black uppercase tracking-widest">
								All criteria must be MET before launch
							</p>
						)}
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
