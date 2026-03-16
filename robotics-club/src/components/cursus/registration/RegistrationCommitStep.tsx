"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface RegistrationCommitStepProps {
	project: any;
	commits: any;
	setCommits: (c: any) => void;
}

export function RegistrationCommitStep({ project, commits, setCommits }: RegistrationCommitStepProps) {

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
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="h-8 w-1.5 rounded-full bg-accent" />
					<h3 className="text-2xl font-black uppercase tracking-tighter text-text-primary">Mission Commitments</h3>
				</div>
				<p className="text-xs font-bold leading-relaxed text-text-muted bg-panel-2 p-4 rounded-2xl border border-white/5 uppercase tracking-widest leading-loose opacity-80">
					Before you proceed to initialization, you must acknowledge the core facets of the club mission for {project.title.toUpperCase()}.
				</p>
				
				<div className="space-y-4 pt-4">
					<label className="group flex items-center gap-6 p-6 rounded-[2rem] bg-panel-2 border border-white/5 cursor-pointer hover:bg-white/5 hover:border-accent/40 transition-all">
						<div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
							<input 
								type="checkbox" 
								className="peer h-8 w-8 cursor-pointer rounded-xl border-2 border-white/10 bg-black/20 text-accent accent-accent transition-all hover:border-accent"
								checked={commits.brief}
								onChange={(e) => setCommits({ ...commits, brief: e.target.checked })}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-sm font-black text-text-primary uppercase tracking-tight">I have read the brief</span>
							<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest underline decoration-accent/20">I fully understand the mission objectives and expectations.</span>
						</div>
					</label>

					<label className="group flex items-center gap-6 p-6 rounded-[2rem] bg-panel-2 border border-white/5 cursor-pointer hover:bg-white/5 hover:border-accent/40 transition-all">
						<div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
							<input 
								type="checkbox" 
								className="peer h-8 w-8 cursor-pointer rounded-xl border-2 border-white/10 bg-black/20 text-accent accent-accent transition-all hover:border-accent"
								checked={commits.blackhole}
								onChange={(e) => setCommits({ ...commits, blackhole: e.target.checked })}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-sm font-black text-text-primary uppercase tracking-tight">I accept the blackhole</span>
							<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest underline decoration-accent/20">My squad has {project.blackholeDays} days until {deadlineStr} to deliver.</span>
						</div>
					</label>

					<label className="group flex items-center gap-6 p-6 rounded-[2rem] bg-panel-2 border border-white/5 cursor-pointer hover:bg-white/5 hover:border-accent/40 transition-all">
						<div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
							<input 
								type="checkbox" 
								className="peer h-8 w-8 cursor-pointer rounded-xl border-2 border-white/10 bg-black/20 text-accent accent-accent transition-all hover:border-accent"
								checked={commits.reports}
								onChange={(e) => setCommits({ ...commits, reports: e.target.checked })}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-sm font-black text-text-primary uppercase tracking-tight">I commit to reporting</span>
							<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest underline decoration-accent/20">I will submit weekly progress reports without fail.</span>
						</div>
					</label>
				</div>

				<Card className="bg-red-500/5 border-red-500/20 p-6 flex gap-6 items-center rounded-[2rem] mt-8">
					<div className="text-2xl animate-pulse">⚖️</div>
					<p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500/60 leading-relaxed">
						Project registration is a binding contract. Unfairly abandoning a mission will result in rank degradation and inclusion in the restricted list.
					</p>
				</Card>
			</div>

			<div className="flex gap-4 pt-2">
				{/* Buttons removed from here, moved to Modal footer */}
			</div>
		</div>
	);
}
