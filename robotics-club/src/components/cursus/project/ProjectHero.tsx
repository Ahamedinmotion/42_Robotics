"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/components/providers/SoundProvider";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { RegistrationModal } from "../registration/RegistrationModal";

interface ProjectHeroProps {
	project: any;
	isEligible: boolean;
	eligibilityError: string | null;
	isCurrentlyActive: boolean;
	stats: {
		completionRate: number;
		avgTime: number | null;
		activeTeamsCount: number;
	};
}

export function ProjectHero({ 
	project, 
	isEligible, 
	eligibilityError, 
	isCurrentlyActive,
	stats 
}: ProjectHeroProps) {
	const { playSFX } = useSound();
	const { toast } = useToast();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleStart = () => {
		playSFX("button");
		if (isCurrentlyActive) {
			toast("You are already working on this project!", "success");
			return;
		}
		setIsModalOpen(true);
	};

	return (
		<div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-panel p-10 shadow-2xl backdrop-blur-xl">
			{/* Project Registration Modal */}
			<RegistrationModal 
				isOpen={isModalOpen} 
				onClose={() => setIsModalOpen(false)} 
				project={project} 
			/>

			{/* Unsolved Banner */}
			{!project.hasBeenCompleted && (
				<div className="absolute -right-12 top-8 rotate-45 bg-gradient-to-r from-amber-400 to-yellow-600 px-16 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-black shadow-lg">
					Unsolved
				</div>
			)}

			<div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
				<div className="space-y-6">
					<div className="flex flex-wrap items-center gap-4">
						<Badge rank={project.rank} size="lg" />
						<span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
							project.status === "ACTIVE" ? "bg-accent/20 text-accent" :
							project.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400" :
							"bg-text-muted/20 text-text-muted"
						}`}>
							{project.status}
						</span>
					</div>

					<h1 className="text-5xl font-black tracking-tight text-text-primary md:text-7xl">
						{project.title}
					</h1>

					{project.isRequired && (
						<div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 max-w-2xl shadow-[0_0_30px_rgba(249,115,22,0.1)] group transition-all duration-500 hover:border-orange-500/50 hover:bg-orange-500/10">
							<div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]" />
							<div className="flex items-center gap-4">
								<div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[inset_0_0_15px_rgba(249,115,22,0.2)]">
									<svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
								</div>
								<div className="space-y-0.5">
									<h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
										Mandatory Mission
									</h3>
									<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted leading-relaxed opacity-80">
										You must pass this project to advance beyond Rank {project.rank}
									</p>
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-wrap gap-2">
						{project.skillTags.map((tag: string) => (
							<span 
								key={tag}
								className="rounded-lg bg-panel-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted border border-border"
							>
								{tag}
							</span>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-6 md:items-end">
					{/* Quick Stats */}
					<div className="flex gap-8 border-l border-border pl-8 md:border-l-0 md:border-r md:pl-0 md:pr-8">
						<div className="text-center md:text-right">
							<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Completion</p>
							<p className="text-2xl font-black text-text-primary">{stats.completionRate}%</p>
						</div>
						<div className="text-center md:text-right">
							<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Avg. Time</p>
							<p className="text-2xl font-black text-text-primary">{stats.avgTime ?? "—"}d</p>
						</div>
						<div className="text-center md:text-right">
							<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Active</p>
							<p className="text-2xl font-black text-text-primary">{stats.activeTeamsCount}</p>
						</div>
					</div>

					<div className="space-y-3 md:text-right">
						<div className="group relative">
							<Button 
								size="lg" 
								variant={isEligible ? "primary" : "ghost"}
								disabled={!isEligible || isCurrentlyActive}
								onClick={handleStart}
								className="h-14 px-10 text-sm font-black uppercase tracking-[0.2em]"
							>
								{isCurrentlyActive ? "Currently Working" : project.hasBeenCompleted ? "Improve Score" : "Start this project"}
							</Button>
							
							{!isEligible && (
								<div className="absolute bottom-full right-0 mb-4 w-48 scale-0 bg-panel border border-border p-3 text-center transition-all group-hover:scale-100 rounded-xl shadow-2xl z-20">
									<p className="text-[10px] font-black uppercase tracking-widest text-accent-urgency">
										{eligibilityError || "Requirements not met"}
									</p>
								</div>
							)}
						</div>
						
						{isCurrentlyActive && (
							<p className="text-[10px] font-bold uppercase tracking-wider text-accent">
								You have an active squad on this project
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
