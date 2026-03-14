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
