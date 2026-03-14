"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

export function EvaluationHistory() {
	const [history, setHistory] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchHistory = async () => {
			try {
				const res = await fetch("/api/evaluations/history");
				const data = await res.json();
				if (data.success) {
					setHistory(data.data);
				}
			} catch (error) {
				console.error("Failed to fetch history", error);
			} finally {
				setLoading(false);
			}
		};
		fetchHistory();
	}, []);

	if (loading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="h-24 animate-pulse rounded-xl bg-panel" />
				))}
			</div>
		);
	}

	if (history.length === 0) {
		return (
			<Card className="flex flex-col items-center justify-center p-12 text-center">
				<div className="mb-4 text-4xl">📚</div>
				<h3 className="text-xl font-bold text-text-primary">No mission history</h3>
				<p className="max-w-xs text-text-muted">You haven't completed any evaluations yet. Your tactical record will appear here.</p>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{history.map((slot: any) => (
				<Card key={slot.id} className="p-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<div className="flex items-center gap-2 mb-1">
								<span className="text-[10px] font-bold text-accent uppercase tracking-widest">{slot.team.project.title}</span>
								<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
									slot.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
								}`}>
									{slot.status}
								</span>
							</div>
							<h4 className="text-lg font-bold text-text-primary">Evaluation of {slot.team.leader.login}'s squad</h4>
							<p className="text-xs text-text-muted">
								Completed on {new Date(slot.slotStart).toLocaleDateString()} at {new Date(slot.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</p>
						</div>

						{slot.evaluations?.[0]?.feedback && (
							<div className="max-w-md rounded-lg bg-panel2 p-4 border border-border/50 italic text-sm text-text-muted">
								"{slot.evaluations[0].feedback.content}"
								<div className="mt-2 text-[10px] font-bold text-text-primary not-italic uppercase tracking-widest">
									Feedback from Mission Subject
								</div>
							</div>
						)}
					</div>
				</Card>
			))}
		</div>
	);
}
