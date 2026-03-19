"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function UpcomingEvaluations() {
	const [data, setData] = useState<{ giving: any[], receiving: any[] }>({ giving: [], receiving: [] });

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

	useEffect(() => {
		fetchUpcoming();
		const interval = setInterval(fetchUpcoming, 60000); // 1-minute polling
		return () => clearInterval(interval);
	}, []);

	const allUpcoming = [...data.giving, ...data.receiving].sort((a, b) => 
		new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()
	);

	if (allUpcoming.length === 0) return null;

	const topOne = allUpcoming[0];
	const isGiving = data.giving.some(s => s.id === topOne.id);

	return (
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

				{/* Progress scale */}
				<div className="absolute bottom-0 left-0 h-0.5 w-full bg-panel2">
					<div 
						className={`h-full transition-all duration-1000 ${isGiving ? "bg-accent" : "bg-blue-500"}`}
						style={{ width: `${Math.max(0, Math.min(100, (1 - topOne.revealStatus.remainingMins / 60) * 100))}%` }}
					/>
				</div>
			</Card>
		</Link>
	);
}
