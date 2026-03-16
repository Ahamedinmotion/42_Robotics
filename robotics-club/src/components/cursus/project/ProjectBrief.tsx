"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSound } from "@/components/providers/SoundProvider";

interface ProjectBriefProps {
	project: any;
}

export function ProjectBrief({ project }: ProjectBriefProps) {
	const { playSFX } = useSound();
	const [showSubject, setShowSubject] = useState(false);

	const objectives = project.objectives && project.objectives.length > 0 
		? project.objectives 
		: [
			"Master basic sensor integration and data processing.",
			"Implement a robust PID control loop for stability.",
			"Optimize power consumption for extended mission duration.",
		];
	
	const deliverables = project.deliverables && project.deliverables.length > 0
		? project.deliverables
		: [
			"Functional prototype demonstrating target behavior.",
			"Technical documentation (PDF) including circuit diagrams.",
			"Source code repository with clear build instructions.",
		];

	// Calculating stats for duration
	const completedTeams = (project.teams || []).filter((t: any) => t.status === "COMPLETED" && t.activatedAt && t.updatedAt);
	const durations = completedTeams.map((t: any) => (t.updatedAt.getTime() - t.activatedAt.getTime()) / (1000 * 60 * 60 * 24));
	
	const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : project.blackholeDays / 2;
	const fastest = durations.length > 0 ? Math.round(Math.min(...durations)) : null;
	const slowest = durations.length > 0 ? Math.round(Math.max(...durations)) : null;

	return (
		<div className="space-y-8">
			<section className="space-y-4">
				<h2 className="text-xl font-black uppercase tracking-[0.2em] text-accent">The Brief</h2>
				<p className="text-lg leading-relaxed text-text-secondary">
					{project.description}
				</p>
			</section>

			<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
				<section className="space-y-4">
					<h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Learning Objectives</h3>
					<ul className="space-y-3">
						{objectives.map((obj: string, i: number) => (
							<li key={i} className="flex gap-3 text-sm text-text-secondary">
								<span className="text-accent">▹</span>
								{obj}
							</li>
						))}
					</ul>
				</section>

				<section className="space-y-4">
					<h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Deliverables</h3>
					<ul className="space-y-3">
						{deliverables.map((del: string, i: number) => (
							<li key={i} className="flex gap-3 text-sm text-text-secondary">
								<span className="text-emerald-400">✓</span>
								{del}
							</li>
						))}
					</ul>
				</section>
			</div>

			<Card className="grid grid-cols-2 gap-8 bg-panel-2 p-8 md:grid-cols-4">
				<div className="space-y-1">
					<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">Team Size</p>
					<p className="text-lg font-black text-text-primary">{project.teamSizeMin}–{project.teamSizeMax}</p>
				</div>
				<div className="space-y-1">
					<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">Avg. Duration</p>
					<p className="text-lg font-black text-text-primary">{avgDuration} Days</p>
				</div>
				<div className="space-y-1">
					<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">Fastest</p>
					<p className="text-lg font-black text-emerald-400">{fastest ?? "—"} Days</p>
				</div>
				<div className="space-y-1">
					<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">Slowest</p>
					<p className="text-lg font-black text-accent-urgency">{slowest ?? "—"} Days</p>
				</div>
			</Card>

			{project.subjectSheetUrl && (
				<div className="flex justify-center pt-4">
					<Button 
						variant="ghost" 
						size="lg"
						onClick={() => { playSFX("button"); setShowSubject(true); }}
						className="group h-14 border-border bg-panel-2 px-12 text-sm font-black uppercase tracking-[0.2em] transition-all hover:bg-text-primary hover:text-background"
					>
						View Subject Sheet
						<span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
					</Button>
				</div>
			)}

			{/* Inline PDF Modal */}
			{showSubject && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
					<div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setShowSubject(false)} />
					
					<div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-border bg-panel shadow-2xl animate-in fade-in zoom-in duration-300">
						<div className="flex items-center justify-between border-b border-white/5 p-6">
							<h3 className="font-black uppercase tracking-widest text-text-primary">{project.title} — Subject</h3>
							<button 
								onClick={() => setShowSubject(false)}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-panel-2 text-xl font-bold text-text-primary transition-colors hover:bg-panel"
							>
								✕
							</button>
						</div>
						
						<div className="flex-1 bg-panel-2 p-4">
							<iframe 
								src={project.subjectSheetUrl} 
								className="h-full w-full rounded-2xl bg-white"
								title="Subject Sheet"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
