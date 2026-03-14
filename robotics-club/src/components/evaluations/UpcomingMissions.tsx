"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EvaluatorPrepModal } from "./EvaluatorPrepModal";

export function UpcomingMissions() {
	const [data, setData] = useState<{ giving: any[], receiving: any[] }>({ giving: [], receiving: [] });
	const [loading, setLoading] = useState(true);
	const [prepSlot, setPrepSlot] = useState<any | null>(null);
	const { toast } = useToast();

	const fetchUpcoming = async () => {
		try {
			const res = await fetch("/api/evaluations/upcoming");
			const d = await res.json();
			if (d.success) {
				setData(d.data);
			}
		} catch (error) {
			console.error("Failed to fetch upcoming", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUpcoming();
		const interval = setInterval(fetchUpcoming, 30000); // 30s polling
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return <div className="space-y-6 animate-pulse">
			<div className="h-40 rounded-2xl bg-panel" />
			<div className="h-40 rounded-2xl bg-panel" />
		</div>;
	}

	const noMissions = data.giving.length === 0 && data.receiving.length === 0;

	if (noMissions) {
		return (
			<Card className="flex flex-col items-center justify-center p-12 text-center">
				<div className="mb-4 text-4xl">🗓️</div>
				<h3 className="text-xl font-bold text-text-primary">Your mission calendar is clear</h3>
				<p className="max-w-xs text-text-muted">You have no upcoming evaluations to give or receive. Head to Available to claim some!</p>
			</Card>
		);
	}

	return (
		<div className="space-y-8">
			{/* Giving Evaluations */}
			{data.giving.length > 0 && (
				<section className="space-y-4">
					<h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Missions to Evaluate</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{data.giving.map((slot) => (
							<Card key={slot.id} className="border-l-4 border-l-accent p-6">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">RANK {slot.team.project.rank}</span>
											<h4 className="font-bold text-text-primary">{slot.team.project.title}</h4>
										</div>
										<Countdown target={new Date(slot.slotStart)} />
									</div>

									<p className="text-sm text-text-muted">
										You are evaluating <span className="text-text-primary font-medium">{slot.maskedIdentity}</span>
									</p>

									<div className="flex items-center justify-between gap-4">
										<div className="text-xs font-mono text-text-muted">
											{new Date(slot.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											{" - "}
											{new Date(slot.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</div>
										{slot.revealStatus.isImminent ? (
											<Button size="sm" onClick={() => setPrepSlot(slot)}>Start Prep</Button>
										) : (
											<span className="text-[10px] text-accent uppercase font-bold animate-pulse">Waiting for Imminent window</span>
										)}
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Receiving Evaluations */}
			{data.receiving.length > 0 && (
				<section className="space-y-4">
					<h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Your Incoming Evaluations</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{data.receiving.map((slot) => (
							<Card key={slot.id} className="border-l-4 border-l-blue-500 p-6">
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-bold text-text-primary">{slot.team.project.title}</h4>
										<Countdown target={new Date(slot.slotStart)} />
									</div>

									<p className="text-sm text-text-muted">
										Evaluated by <span className="text-text-primary font-medium">{slot.maskedIdentity}</span>
									</p>

									<div className="text-xs font-mono text-text-muted">
										{new Date(slot.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										{" - "}
										{new Date(slot.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{prepSlot && (
				<EvaluatorPrepModal 
					slot={prepSlot} 
					onClose={() => setPrepSlot(null)} 
					onReady={() => {
						toast("Prep complete. Opening evaluation form...", "success");
						import("next/navigation").then(({ useRouter }) => {
							// Using window.location for simplicity if router isn't available in this context,
							// but the component already uses 'use client' and we can add useRouter to it.
							window.location.href = `/evaluations/${prepSlot.id}/evaluate`;
						});
					}}
				/>
			)}
		</div>
	);
}

function Countdown({ target }: { target: Date }) {
	const [timeLeft, setTimeLeft] = useState("");

	useEffect(() => {
		const update = () => {
			const now = new Date();
			const diff = target.getTime() - now.getTime();
			if (diff <= 0) {
				setTimeLeft("IN PROGRESS");
				return;
			}
			const hours = Math.floor(diff / (1000 * 60 * 60));
			const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const secs = Math.floor((diff % (1000 * 60)) / 1000);
			setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${mins}m ${secs}s`);
		};
		update();
		const t = setInterval(update, 1000);
		return () => clearInterval(t);
	}, [target]);

	return <span className="text-[10px] font-mono font-bold text-accent px-2 py-0.5 rounded border border-accent/20">{timeLeft}</span>;
}
