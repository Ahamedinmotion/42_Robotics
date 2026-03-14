"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface ClaimSlotModalProps {
	window: any;
	onClose: () => void;
	onClaimed: () => void;
}

export function ClaimSlotModal({ window, onClose, onClaimed }: ClaimSlotModalProps) {
	const [selectedStart, setSelectedStart] = useState<Date | null>(null);
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const { playSFX } = useSound();

	const start = new Date(window.startTime);
	const end = new Date(window.endTime);
	const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

	// Generate 30-min steps
	const steps = [];
	for (let i = 0; i <= durationHours * 2 - 4; i++) { // -4 because slot must be 2h (4 steps)
		steps.push(new Date(start.getTime() + i * 30 * 60 * 1000));
	}

	const handleClaim = async () => {
		if (!selectedStart) return;
		setLoading(true);
		playSFX("claim");

		try {
			const slotEnd = new Date(selectedStart.getTime() + 2 * 60 * 60 * 1000);
			const res = await fetch(`/api/evaluations/windows/${window.id}/claim`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					slotStart: selectedStart.toISOString(),
					slotEnd: slotEnd.toISOString(),
				})
			});

			const data = await res.json();
			if (data.success) {
				toast("Mission claimed successfully!", "success");
				onClaimed();
			} else {
				toast(data.error || "Failed to claim mission", "error");
			}
		} catch (error) {
			toast("Connection error", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			<Card className="w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl">
				<div className="p-8">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold text-text-primary">Claim Evaluation Slot</h2>
							<p className="text-text-muted">Select your preferred 2-hour window for {window.project.title}</p>
						</div>
						<button onClick={onClose} className="rounded-full p-2 hover:bg-white/5 transition-colors">
							<svg className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Visual Timeline */}
					<div className="mb-8 p-4 rounded-xl bg-panel2 border border-border/50">
						<div className="mb-4 flex items-center justify-between text-[10px] font-mono text-text-muted uppercase tracking-widest">
							<span>Start: {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
							<span>Range Duration: {durationHours}h</span>
							<span>End: {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
						</div>

						<div className="relative h-24 w-full overflow-x-auto pb-4 custom-scrollbar">
							<div className="flex min-w-max gap-1 px-1 h-12 items-end">
								{steps.map((step, idx) => {
									const isSelected = selectedStart?.getTime() === step.getTime();
									return (
										<button
											key={idx}
											onClick={() => {
												setSelectedStart(step);
												playSFX("button");
											}}
											className={`group relative w-12 rounded-t-lg transition-all ${
												isSelected 
													? "h-12 bg-accent shadow-[0_0_20px_rgba(255,107,0,0.3)]" 
													: "h-8 bg-white/5 hover:bg-white/10 hover:h-10"
											}`}
										>
											{/* Highlight the full 2h block visually */}
											{isSelected && (
												<div className="absolute left-0 top-0 h-full w-[204px] bg-accent/20 border-x border-accent pointer-events-none rounded-t-lg z-0" />
											)}
											
											<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-text-muted pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
												{step.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</div>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{selectedStart && (
						<div className="mb-8 animate-in slide-in-from-bottom-2 duration-300">
							<p className="text-center text-sm font-medium text-text-primary">
								You will evaluate the squad from{" "}
								<span className="text-accent underline decoration-accent/30">
									{selectedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>{" "}
								to{" "}
								<span className="text-accent underline decoration-accent/30">
									{new Date(selectedStart.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</p>
						</div>
					)}

					<div className="flex gap-4">
						<Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
						<Button 
							className="flex-1 shadow-lg shadow-accent/20" 
							disabled={!selectedStart || loading}
							onClick={handleClaim}
						>
							{loading ? "Transmitting..." : "Confirm Claim"}
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
