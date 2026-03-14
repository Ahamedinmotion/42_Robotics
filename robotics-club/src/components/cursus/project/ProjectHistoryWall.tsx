"use client";

import { Card } from "@/components/ui/Card";
import Image from "next/image";

interface ProjectHistoryWallProps {
	project: any;
}

export function ProjectHistoryWall({ project }: ProjectHistoryWallProps) {
	const allTeams = project.teams || [];
	const completedTeams = allTeams
		.filter((t: any) => t.status === "COMPLETED")
		.sort((a: any, b: any) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

	const failedTeams = allTeams.filter((t: any) => t.status === "BLACKHOLED");
	
	const completionRate = allTeams.length > 0 
		? Math.round((completedTeams.length / allTeams.length) * 100) 
		: 0;

	if (allTeams.length === 0) {
		return (
			<section className="space-y-6">
				<h2 className="text-xl font-black uppercase tracking-[0.2em] text-accent">History Wall</h2>
				<Card className="flex h-40 items-center justify-center bg-white/5 border-dashed border-white/10">
					<p className="text-sm font-bold uppercase tracking-widest text-text-muted">
						No one has attempted this yet. <span className="text-accent underline cursor-pointer">Be the first.</span>
					</p>
				</Card>
			</section>
		);
	}

	return (
		<section className="space-y-8">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-black uppercase tracking-[0.2em] text-accent">History Wall</h2>
				<div className="flex items-center gap-4">
					<span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Completion Rate</span>
					<div className="relative h-2 w-48 overflow-hidden rounded-full bg-panel-2">
						<div 
							className="absolute inset-y-0 left-0 bg-accent transition-all duration-1000"
							style={{ width: `${completionRate}%` }}
						/>
					</div>
					<span className="text-[10px] font-black text-text-primary">{completionRate}%</span>
				</div>
			</div>

			<div className="space-y-12">
				{/* Completed Teams */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{completedTeams.map((team: any, index: number) => {
						const isPioneer = index === 0;
						const duration = team.activatedAt 
							? Math.round((new Date(team.updatedAt).getTime() - new Date(team.activatedAt).getTime()) / (1000 * 60 * 60 * 24))
							: "—";

						return (
							<Card key={team.id} className="relative overflow-hidden bg-panel-2 p-6 border-border hover:border-accent/40 transition-all">
								{isPioneer && (
									<div className="absolute -top-1 -right-1 bg-amber-400 px-3 py-1 text-[8px] font-black uppercase tracking-tighter text-black rounded-bl-xl shadow-lg">
										★ Pioneer
									</div>
								)}
								
								<div className="flex items-start justify-between">
									<div className="flex -space-x-3 overflow-hidden">
										{team.members.map((m: any) => (
											<div key={m.id} className="relative h-10 w-10 rounded-full border-2 border-panel overflow-hidden bg-panel-2" title={m.user.login}>
												<Image 
													src={m.user.image || `https://cdn.intra.42.fr/users/medium_${m.user.login}.jpg`} 
													alt={m.user.login}
													fill
													className="object-cover"
												/>
											</div>
										))}
									</div>
									<div className="text-right">
										<p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Completed</p>
										<p className="text-xs font-black text-text-primary">{new Date(team.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
									</div>
								</div>

								<div className="mt-6 flex items-center justify-between border-t border-border pt-4">
									<div className="flex items-center gap-2">
										<span className="text-[10px] uppercase tracking-widest text-text-muted">Duration</span>
										<span className="text-sm font-black text-text-primary">{duration}d</span>
									</div>
									<button className="text-[10px] font-black uppercase tracking-widest text-accent/50 hover:text-accent transition-colors">
										Details →
									</button>
								</div>
							</Card>
						);
					})}
				</div>

				{/* Attempted/Blackholed Teams */}
				{failedTeams.length > 0 && (
					<div className="space-y-4 opacity-60">
						<h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Attempts & Casualties</h3>
						<div className="flex flex-wrap gap-3">
							{failedTeams.map((team: any) => (
								<div key={team.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2">
									<div className="flex -space-x-3">
										{team.members.slice(0, 2).map((m: any) => (
											<div key={m.id} className="h-6 w-6 shrink-0 rounded-full border border-panel overflow-hidden grayscale">
												<Image 
													src={m.user.image || `https://cdn.intra.42.fr/users/medium_${m.user.login}.jpg`} 
													alt={m.user.login}
													width={24} height={24}
													className="object-cover"
												/>
											</div>
										))}
									</div>
									<span className="text-[10px] font-bold uppercase tracking-widest text-accent-urgency">Blackholed</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
