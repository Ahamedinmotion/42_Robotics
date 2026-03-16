"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";
import { useRouter } from "next/navigation";

interface ActiveMissionsProps {
	teams: any[];
	currentUserId: string;
}

export function ActiveMissions({ teams, currentUserId }: ActiveMissionsProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState<string | null>(null);
	const [confirmAbandonId, setConfirmAbandonId] = useState<string | null>(null);

	const handleAbandon = async (teamId: string) => {
		setIsLoading(teamId);
		try {
			const res = await fetch(`/api/teams/${teamId}/actions`, {
				method: "POST",
				body: JSON.stringify({ action: "confirm-abandon" }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Abandonment failed");

			toast(data.data?.message || "Abandonment confirmed", "success");
			playSFX("achievement");
			router.refresh();
			setConfirmAbandonId(null);
		} catch (err: any) {
			toast(err.message, "error");
		} finally {
			setIsLoading(null);
		}
	};

	return (
		<div className="space-y-6">
			<h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent-urgency/70">
				Active Deployments
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{teams.map((team) => {
					const member = team.members.find((m: any) => m.userId === currentUserId);
					const hasConfirmed = member?.abandonConfirmed;

					return (
						<Card key={team.id} className="p-6 bg-panel-2/20 border-white/5 space-y-4 hover:border-accent-urgency/20 transition-all group">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<h4 className="text-lg font-black text-text-primary group-hover:text-accent-urgency transition-colors">
										{team.project.title}
									</h4>
									<div className="flex items-center gap-2">
										<Badge rank={team.project.rank} size="sm" />
										<span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
											{team.status}
										</span>
									</div>
								</div>
								<Button 
									variant="ghost" 
									size="sm"
									className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={() => router.push(`/cursus/projects/${team.id}/cockpit`)}
								>
									Open Cockpit
								</Button>
							</div>

							<div className="pt-2">
								{hasConfirmed ? (
									<div className="p-3 rounded-lg bg-accent-urgency/10 border border-accent-urgency/20 text-center">
										<p className="text-[10px] font-black uppercase tracking-widest text-accent-urgency">
											Awaiting Squad Consensus
										</p>
									</div>
								) : confirmAbandonId === team.id ? (
									<div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
										<p className="text-[10px] font-black text-accent-urgency uppercase tracking-widest text-center">
											This will mark a permanent failure. Confirm?
										</p>
										<div className="flex gap-2">
											<Button 
												variant="ghost" 
												size="sm" 
												className="flex-1 text-[10px]" 
												onClick={() => setConfirmAbandonId(null)}
											>
												Safe
											</Button>
											<Button 
												variant="primary" 
												size="sm" 
												className="flex-1 bg-accent-urgency hover:bg-red-600 border-none text-[10px]" 
												disabled={isLoading === team.id}
												onClick={() => handleAbandon(team.id)}
											>
												Confirm Abort
											</Button>
										</div>
									</div>
								) : (
									<Button 
										variant="ghost" 
										className="w-full text-accent-urgency/60 hover:text-accent-urgency hover:bg-accent-urgency/10 border-accent-urgency/10 text-[10px] font-black uppercase tracking-[0.2em]"
										onClick={() => setConfirmAbandonId(team.id)}
									>
										Initiate Abort
									</Button>
								)}
							</div>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
