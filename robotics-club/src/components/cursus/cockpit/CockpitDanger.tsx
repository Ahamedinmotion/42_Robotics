"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface CockpitDangerProps {
	team: any;
	isAdmin: boolean;
	currentUser: any;
}

export function CockpitDanger({ team, isAdmin, currentUser }: CockpitDangerProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [isLoading, setIsLoading] = useState(false);
	const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
	const [disputeReason, setDisputeReason] = useState("");
	const [disputeEvidence, setDisputeEvidence] = useState("");
	const [extensionReason, setExtensionReason] = useState("");

	const member = team.members.find((m: any) => m.userId === currentUser.id);
	const hasConfirmedAbandon = member?.abandonConfirmed;
	const confirmedCount = team.members.filter((m: any) => m.abandonConfirmed).length;

	const handleAction = async (action: string, payload: any = {}) => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/actions`, {
				method: "POST",
				body: JSON.stringify({ action, ...payload }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Action failed");
			
			toast(data.data.message || "Action successful", "success");
			playSFX("achievement");
			window.location.reload();
		} catch (err: any) {
			toast(err.message, "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-12 pb-20">
			{/* Deadline Extension */}
			<section className="space-y-6">
				<h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent-urgency/50">Tactical Extension</h3>
				<Card className="p-8 bg-panel-2/20 border-white/5 space-y-6">
					<div>
						<h4 className="text-xl font-black text-text-primary">Request Blackhole Extension</h4>
						<p className="text-sm text-text-muted mt-2">
							Running out of time? Squads can request a ONE-TIME extension for 30 days. Requires a solid reason and moderator approval.
						</p>
					</div>
					
					{team.isExtensionGranted ? (
						<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
							Extension already granted. Max capacity reached for this mission.
						</div>
					) : team.extensionRequests?.length > 0 ? (
						<div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold">
							Extension request under review by Command.
						</div>
					) : (
						<div className="space-y-4">
							<textarea 
								placeholder="Why does your squad need more time?"
								value={extensionReason}
								onChange={(e) => setExtensionReason(e.target.value)}
								className="w-full bg-background border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-accent/20 h-24 resize-none"
							/>
							<Button 
								variant="primary" 
								disabled={isLoading || !extensionReason}
								onClick={() => handleAction("request-extension", { reason: extensionReason })}
							>
								Request 30-Day Extension
							</Button>
						</div>
					)}
				</Card>
			</section>

			{/* Disputes */}
			<section className="space-y-6">
				<h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted">Conflict Resolution</h3>
				<Card className="p-8 bg-panel-2/20 border-white/5 space-y-6">
					<div>
						<h4 className="text-xl font-black text-text-primary">Evaluation Dispute</h4>
						<p className="text-sm text-text-muted mt-2">
							Believe an evaluation was unfair? Raise a formal dispute. Provide clear evidence.
						</p>
					</div>
					<div className="space-y-4">
						<textarea 
							placeholder="Reason for dispute..."
							value={disputeReason}
							onChange={(e) => setDisputeReason(e.target.value)}
							className="w-full bg-background border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-accent/20 h-20 resize-none"
						/>
						<textarea 
							placeholder="Evidence (links to repo, diffs, etc)..."
							value={disputeEvidence}
							onChange={(e) => setDisputeEvidence(e.target.value)}
							className="w-full bg-background border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-accent/20 h-20 resize-none"
						/>
						<Button 
							variant="secondary" 
							disabled={isLoading || !disputeReason || !disputeEvidence}
							onClick={() => handleAction("raise-dispute", { reason: disputeReason, evidence: disputeEvidence })}
						>
							Raise Formal Dispute
						</Button>
					</div>
				</Card>
			</section>

			{/* Abandonment */}
			<section className="space-y-6 pt-12 border-t border-white/5">
				<div className="space-y-2">
					<h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent-urgency">Emergency Abort</h3>
					<p className="text-xs text-text-muted uppercase tracking-widest font-black">Requires 100% squad confirmation</p>
				</div>
				<Card className="p-8 bg-accent-urgency/5 border-accent-urgency/20 space-y-8">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="text-xl font-black text-accent-urgency italic">Collective Abandonment</h4>
							<span className="text-2xl font-black text-accent-urgency">{confirmedCount}/{team.members.length}</span>
						</div>
						<p className="text-sm text-accent-urgency/70 font-medium">
							Abandoning a project results in a permanent FAILURE on your record and immediate disqualification for current rank awards. All members must confirm before the mission is aborted.
						</p>
						<div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
							<div 
								className="h-full bg-accent-urgency transition-all duration-1000"
								style={{ width: `${(confirmedCount / team.members.length) * 100}%` }}
							/>
						</div>
					</div>

					{hasConfirmedAbandon ? (
						<div className="p-4 rounded-xl bg-accent-urgency/20 border border-accent-urgency/30 text-accent-urgency text-center font-black uppercase tracking-widest text-xs">
							Confirmation Received. Waiting for Teammates.
						</div>
					) : (
						<div className="flex flex-col gap-4">
							{!showAbandonConfirm ? (
								<Button 
									variant="ghost" 
									className="text-accent-urgency hover:bg-accent-urgency/10 border-accent-urgency/20"
									onClick={() => setShowAbandonConfirm(true)}
								>
									Initiate Abort Sequence
								</Button>
							) : (
								<>
									<div className="p-6 rounded-2xl bg-background border border-accent-urgency/40 animate-pulse text-center">
										<p className="text-sm font-black text-accent-urgency uppercase tracking-[0.2em] mb-2">Are you absolutely sure?</p>
										<p className="text-xs text-text-muted">This action is irreversible and affects your entire squad.</p>
									</div>
									<div className="flex gap-4">
										<Button 
											variant="ghost" 
											className="flex-1" 
											onClick={() => setShowAbandonConfirm(false)}
										>
											Negate
										</Button>
										<Button 
											variant="primary" 
											className="flex-1 bg-accent-urgency hover:bg-red-600 border-none" 
											disabled={isLoading}
											onClick={() => handleAction("confirm-abandon")}
										>
											Confirm Abort
										</Button>
									</div>
								</>
							)}
						</div>
					)}
				</Card>
			</section>
		</div>
	);
}
