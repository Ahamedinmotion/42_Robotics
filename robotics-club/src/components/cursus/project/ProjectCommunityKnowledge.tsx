"use client";

import { Card } from "@/components/ui/Card";
import Image from "next/image";

interface ProjectCommunityKnowledgeProps {
	project: any;
	userId: string;
}

export function ProjectCommunityKnowledge({ project, userId }: ProjectCommunityKnowledgeProps) {
	const allTeams = project.teams || [];
	const completedTeams = allTeams.filter((t: any) => t.status === "COMPLETED");
	
	const postMortems: any[] = [];
	const alumniTips: any[] = [];

	completedTeams.forEach((team: any) => {
		team.evaluations.forEach((evaluation: any) => {
			evaluation.feedback.forEach((f: any) => {
				// Post-mortems from teams
				if (f.fromRole === "TEAM" && f.comment) {
					postMortems.push({
						id: f.id,
						comment: f.comment,
						rating: f.rating,
						date: f.createdAt,
					});
				}
				
				// Alumni Evaluator tips
				if (f.fromRole === "EVALUATOR" && f.comment && evaluation.evaluator?.alumniEvaluatorOptIn) {
					alumniTips.push({
						id: f.id,
						comment: f.comment,
						evaluator: evaluation.evaluator,
						date: f.createdAt,
					});
				}
			});
		});
	});

	const hasUnlocked = completedTeams.some((t: any) => 
		t.members.some((m: any) => m.userId === userId)
	);

	return (
		<section className="space-y-8">
			<div className="space-y-6">
				<h2 className="text-xl font-black uppercase tracking-[0.2em] text-accent">Community Knowledge</h2>
				
				<div className="space-y-4">
					<h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Post-mortems</h3>
					{!hasUnlocked ? (
						<Card className="flex h-32 flex-col items-center justify-center gap-2 border-dashed border-white/10 bg-white/5 p-6 text-center">
							<span className="text-xl">🔒</span>
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted opacity-50">
								Complete this project to read team post-mortems.
							</p>
						</Card>
					) : postMortems.length === 0 ? (
						<p className="py-4 text-center text-xs font-bold uppercase tracking-widest text-text-muted opacity-30">
							No post-mortems yet.
						</p>
					) : (
						<div className="space-y-4">
							{postMortems.map((pm) => (
								<Card key={pm.id} className="bg-panel-2 p-6 border-border italic text-sm text-text-secondary leading-relaxed">
									&ldquo;{pm.comment}&rdquo;
									<div className="mt-4 flex items-center justify-between not-italic">
										<div className="flex gap-1">
											{Array.from({ length: 5 }).map((_, i) => (
												<span key={i} className={`text-[10px] ${i < pm.rating ? "text-accent" : "text-text-muted opacity-20"}`}>★</span>
											))}
										</div>
										<span className="text-[10px] uppercase font-bold text-text-muted">Anonymous Team</span>
									</div>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="space-y-6">
				<h3 className="text-xs font-black uppercase tracking-widest text-text-muted">Alumni Tips</h3>
				{alumniTips.length === 0 ? (
					<p className="py-4 text-center text-xs font-bold uppercase tracking-widest text-text-muted opacity-30">
						No alumni tips yet.
					</p>
				) : (
					<div className="space-y-4">
						{alumniTips.map((tip) => (
							<Card key={tip.id} className="relative overflow-hidden bg-accent/5 p-6 border-accent/20">
								<div className="absolute top-0 right-0 bg-accent/10 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-accent">
									Alumni Verified
								</div>
								<div className="flex gap-4">
									<div className="relative h-10 w-10 shrink-0 rounded-full border border-accent/20 overflow-hidden grayscale opacity-50">
										<Image 
											src={tip.evaluator.image || `https://cdn.intra.42.fr/users/medium_${tip.evaluator.login}.jpg`} 
											alt={tip.evaluator.login}
											fill
											className="object-cover"
										/>
									</div>
									<div className="space-y-2">
										<p className="text-sm font-medium text-text-primary leading-relaxed">
											{tip.comment}
										</p>
										<p className="text-[10px] font-black uppercase tracking-widest text-accent">
											— {tip.evaluator.login}
										</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
