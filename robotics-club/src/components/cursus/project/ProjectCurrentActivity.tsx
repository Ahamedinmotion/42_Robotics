"use client";

import { Card } from "@/components/ui/Card";
import Image from "next/image";

interface ProjectCurrentActivityProps {
	project: any;
}

export function ProjectCurrentActivity({ project }: ProjectCurrentActivityProps) {
	const activeTeams = (project.teams || []).filter((t: any) => 
		["FORMING", "ACTIVE", "EVALUATING"].includes(t.status)
	);

	return (
		<section className="space-y-6">
			<h2 className="text-xl font-black uppercase tracking-[0.2em] text-accent">Current Activity</h2>
			
			{activeTeams.length === 0 ? (
				<Card className="flex h-32 items-center justify-center bg-white/5 border-dashed border-white/10">
					<p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted opacity-50">
						No active teams right now.
					</p>
				</Card>
			) : (
				<div className="space-y-4">
					{activeTeams.map((team: any) => {
						const daysIn = team.activatedAt 
							? Math.round((Date.now() - new Date(team.activatedAt).getTime()) / (1000 * 60 * 60 * 24))
							: 0;
						
						return (
							<Card key={team.id} className="group overflow-hidden bg-panel-2 p-4 border-border hover:bg-panel hover:border-accent/40 transition-all">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="flex -space-x-2">
											{team.members.map((m: any) => (
												<div key={m.id} className="h-8 w-8 rounded-full border border-panel overflow-hidden bg-panel-2 ring-2 ring-panel">
													<Image 
														src={m.user.image || `https://cdn.intra.42.fr/users/medium_${m.user.login}.jpg`} 
														alt={m.user.login}
														width={32} height={32}
														className="object-cover"
													/>
												</div>
											))}
										</div>
										<div>
											<p className="text-xs font-black text-text-primary">{team.members[0]?.user.login}&apos;s Team</p>
											<p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">{team.status}</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-lg font-black text-text-primary">{daysIn}d</p>
										<p className="text-[10px] uppercase tracking-widest text-text-muted">Elapsed</p>
									</div>
								</div>

								{/* Progress Bar (Visual only for now) */}
								<div className="mt-4 relative h-1 w-full overflow-hidden rounded-full bg-panel">
									<div 
										className="absolute inset-y-0 left-0 bg-accent/40 group-hover:bg-accent transition-all duration-500"
										style={{ width: `${Math.min((daysIn / project.blackholeDays) * 100, 100)}%` }}
									/>
								</div>
							</Card>
						);
					})}
				</div>
			)}
		</section>
	);
}
