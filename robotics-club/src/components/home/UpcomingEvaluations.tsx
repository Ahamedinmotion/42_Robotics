"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function UpcomingEvaluations() {
	const [data, setData] = useState<{ giving: any[], receiving: any[] }>({ giving: [], receiving: [] });
	const [defenses, setDefenses] = useState<any[]>([]);

	const fetchUpcoming = async () => {
		try {
			const res = await fetch("/api/evaluations/upcoming");
			const d = await res.json();
			if (d.success) {
				setData(d.data);
			}
		} catch (error) {
			console.error("Failed to fetch dashboard evaluations", error);
		}
	};

	const fetchDefenses = async () => {
		try {
			const res = await fetch("/api/defenses");
			const json = await res.json();
			if (json.success) setDefenses(json.data || []);
		} catch (err) {}
	};

	useEffect(() => {
		fetchUpcoming();
		fetchDefenses();
		const interval = setInterval(() => { fetchUpcoming(); fetchDefenses(); }, 60000);
		return () => clearInterval(interval);
	}, []);

	const allUpcoming = [...data.giving, ...data.receiving].sort((a, b) => 
		new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
	);

	const activeDefenses = defenses.filter(d => d.status === "SCHEDULED" || d.status === "OPEN");

	if (allUpcoming.length === 0 && activeDefenses.length === 0) return null;

	const topOne = allUpcoming.length > 0 ? allUpcoming[0] : null;
	const isGiving = topOne ? data.giving.some(s => s.id === topOne.id) : false;

	return (
		<div className="space-y-3">
			{/* Public Defense Cards */}
			{activeDefenses.map(d => (
				<Link key={d.id} href="/evaluations">
					<Card className="group relative overflow-hidden transition-all hover:border-accent/40 active:scale-[0.98] border-accent/20">
						<div className="flex items-center gap-4 p-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
							</div>
							<div className="flex-1 overflow-hidden">
								<div className="flex items-center gap-2">
									<h4 className="text-sm font-bold text-text-primary">Public Defense</h4>
									<Badge rank={d.team?.project?.rank || "A"} size="sm" />
								</div>
								<p className="truncate text-xs text-text-muted">
									<span className="text-accent">{d.team?.project?.title}</span> — {d.status === "OPEN" ? "Evaluation Open" : new Date(d.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</p>
							</div>
							<div className={`text-[10px] font-mono font-bold ${d.status === "OPEN" ? "text-emerald-400 animate-pulse" : "text-accent"}`}>
								{d.status === "OPEN" ? "LIVE" : "UPCOMING"}
							</div>
						</div>
						<div className="absolute bottom-0 left-0 h-0.5 w-full bg-panel2">
							<div className={`h-full ${d.status === "OPEN" ? "bg-emerald-500 w-full animate-pulse" : "bg-accent w-1/3"}`} />
						</div>
					</Card>
				</Link>
			))}

			{/* Original Evaluation Slot */}
			{topOne && (
				<Link href="/evaluations">
					<Card className="group relative overflow-hidden transition-all hover:border-accent/40 active:scale-[0.98]">
						<div className="flex items-center gap-4 p-4">
							<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
								isGiving ? "bg-accent/10 text-accent" : "bg-blue-500/10 text-blue-500"
							}`}>
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{isGiving ? (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									) : (
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
									)}
								</svg>
							</div>

							<div className="flex-1 overflow-hidden">
								<h4 className="text-sm font-bold text-text-primary">
									{isGiving ? "You are evaluating" : "You will be evaluated by"}
								</h4>
								<p className="truncate text-xs text-text-muted">
									{topOne.maskedIdentity} on <span className="text-accent">{topOne.team.project.title}</span> {
										topOne.revealStatus.remainingMins > 0 
											? `in ${topOne.revealStatus.remainingMins}m` 
											: `started ${Math.abs(topOne.revealStatus.remainingMins)}m ago`
									}
								</p>
							</div>

							<div className="text-[10px] font-mono font-bold text-accent animate-pulse">
								TACTICAL ALERT
							</div>
						</div>

						<div className="absolute bottom-0 left-0 h-0.5 w-full bg-panel2">
							<div 
								className={`h-full transition-all duration-1000 ${isGiving ? "bg-accent" : "bg-blue-500"}`}
								style={{ width: `${Math.max(0, Math.min(100, (1 - topOne.revealStatus.remainingMins / 60) * 100))}%` }}
							/>
						</div>
					</Card>
				</Link>
			)}
		</div>
	);
}

