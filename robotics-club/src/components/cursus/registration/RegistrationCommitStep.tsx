"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface RegistrationCommitStepProps {
	project: any;
	onNext: () => void;
	onBack: () => void;
}

export function RegistrationCommitStep({ project, onNext, onBack }: RegistrationCommitStepProps) {
	const [commits, setCommits] = useState({
		brief: false,
		blackhole: false,
		reports: false,
	});

	const deadline = new Date();
	deadline.setDate(deadline.getDate() + project.blackholeDays);
	const deadlineStr = deadline.toLocaleDateString("en-US", { 
		month: "long", 
		day: "numeric", 
		year: "numeric" 
	});

	const allChecked = Object.values(commits).every(Boolean);

	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			<div className="space-y-4">
				<h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Commitments</h3>
				
				<div className="space-y-3">
					<label className="flex items-start gap-4 p-3 rounded-2xl bg-panel-2 border border-border cursor-pointer hover:bg-panel transition-colors">
						<input 
							type="checkbox" 
							className="mt-1 h-5 w-5 rounded border-border bg-panel text-accent accent-accent"
							checked={commits.brief}
							onChange={(e) => setCommits({ ...commits, brief: e.target.checked })}
						/>
						<span className="text-sm font-bold text-text-primary leading-tight">
							I have read the project brief and objectives.
						</span>
					</label>

					<label className="flex items-start gap-4 p-3 rounded-2xl bg-panel-2 border border-border cursor-pointer hover:bg-panel transition-colors">
						<input 
							type="checkbox" 
							className="mt-1 h-5 w-5 rounded border-border bg-panel text-accent accent-accent"
							checked={commits.blackhole}
							onChange={(e) => setCommits({ ...commits, blackhole: e.target.checked })}
						/>
						<span className="text-sm font-bold text-text-primary leading-tight">
							I understand the blackhole deadline — my team has {project.blackholeDays} days ({deadlineStr}) to complete this project.
						</span>
					</label>

					<label className="flex items-start gap-4 p-3 rounded-2xl bg-panel-2 border border-border cursor-pointer hover:bg-panel transition-colors">
						<input 
							type="checkbox" 
							className="mt-1 h-5 w-5 rounded border-border bg-panel text-accent accent-accent"
							checked={commits.reports}
							onChange={(e) => setCommits({ ...commits, reports: e.target.checked })}
						/>
						<span className="text-sm font-bold text-text-primary leading-tight">
							I commit to submitting weekly reports for the duration of this project.
						</span>
					</label>
				</div>

				<Card className="bg-accent/5 border-accent/20 p-4 flex gap-4 items-center">
					<div className="text-xl">⚖️</div>
					<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted leading-relaxed">
						By checking these boxes, you acknowledge that project registration is a commitment to your team and the club. Unfairly abandoning a project may affect your reputation and rank.
					</p>
				</Card>
			</div>

			<div className="flex gap-4 pt-2">
				<Button variant="ghost" onClick={onBack} className="flex-1">Back</Button>
				<Button 
					variant="primary" 
					className="flex-1" 
					onClick={onNext}
					disabled={!allChecked}
				>
					Confirm & Summary
				</Button>
			</div>
		</div>
	);
}
