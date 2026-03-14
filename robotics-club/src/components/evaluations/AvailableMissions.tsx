"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ClaimSlotModal } from "./ClaimSlotModal";

export function AvailableMissions() {
	const [missions, setMissions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedWindow, setSelectedWindow] = useState<any | null>(null);
	const { toast } = useToast();

	const fetchMissions = async () => {
		try {
			const res = await fetch("/api/evaluations/available");
			const data = await res.json();
			if (data.success) {
				setMissions(data.data);
			}
		} catch (error) {
			console.error("Failed to fetch available missions", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMissions();
	}, []);

	if (loading) {
		return (
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-48 animate-pulse rounded-2xl bg-panel" />
				))}
			</div>
		);
	}

	if (missions.length === 0) {
		return (
			<Card className="flex flex-col items-center justify-center p-12 text-center">
				<div className="mb-4 text-4xl">📡</div>
				<h3 className="text-xl font-bold text-text-primary">No mission broadcasts detected</h3>
				<p className="max-w-xs text-text-muted">There are currently no squads requesting evaluations at your rank. Check back later.</p>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{missions.map((mission) => (
				<Card key={mission.id} className="relative overflow-hidden group hover:border-accent/40 transition-colors">
					<div className="flex flex-col h-full p-6">
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent uppercase tracking-wider">
								Rank {mission.project.rank}
							</span>
							<div className="text-[10px] font-mono text-text-muted uppercase">
								{new Date(mission.startTime).toLocaleDateString()}
							</div>
						</div>

						<h3 className="mb-1 text-lg font-bold text-text-primary group-hover:text-accent transition-colors">
							{mission.project.title}
						</h3>
						<p className="mb-6 text-sm italic text-text-muted">Evaluating {mission.maskedSquad}</p>

						<div className="mt-auto space-y-4">
							<div className="flex items-center gap-2 text-xs text-text-muted">
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{new Date(mission.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(mission.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</div>

							<Button 
								className="w-full" 
								onClick={() => setSelectedWindow(window)}
							>
								Claim a Slot
							</Button>
						</div>
					</div>
				</Card>
			))}

			{selectedWindow && (
				<ClaimSlotModal 
					window={selectedWindow} 
					onClose={() => setSelectedWindow(null)} 
					onClaimed={() => {
						setSelectedWindow(null);
						fetchMissions();
					}}
				/>
			)}
		</div>
	);
}
