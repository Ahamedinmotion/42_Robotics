"use client";

import { useState } from "react";

interface WaitlistWelcomeModalProps {
	position: number;
}

export function WaitlistWelcomeModal({ position }: WaitlistWelcomeModalProps) {
	const [isOpen, setIsOpen] = useState(true);

	const handleDismiss = async () => {
		setIsOpen(false);
		try {
			await fetch("/api/user/onboarding", {
				method: "PATCH",
				body: JSON.stringify({ hasSeenWaitlistModal: true }),
				headers: { "Content-Type": "application/json" }
			});
		} catch (error) {
			console.error("Failed to update waitlist modal status", error);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

			{/* Modal */}
			<div className="relative w-full max-w-lg animate-in fade-in zoom-in duration-500 rounded-[2.5rem] border border-white/10 bg-panel/40 p-10 shadow-2xl backdrop-blur-xl text-center">
				<div className="absolute -top-12 left-1/2 -translate-x-1/2 overflow-hidden rounded-3xl border border-white/20 bg-accent p-4 shadow-xl shadow-accent/20">
					<span className="text-4xl font-black text-white">RC</span>
				</div>

				<div className="mt-4 space-y-6">
					<h2 className="text-3xl font-black text-white tracking-tight">
						Welcome to Robotics Club
					</h2>

					<div className="py-4">
						<p className="text-sm text-text-muted uppercase tracking-widest font-bold">Your Status</p>
						<p className="text-6xl font-black text-accent mt-2 drop-shadow-glow">#{position}</p>
						<p className="text-xs text-text-muted mt-1">Global Queue Position</p>
					</div>

					<div className="space-y-4 text-left border-y border-white/5 py-8">
						<p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4 opacity-50">What to expect</p>
						
						<div className="flex gap-4 items-start">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">1</div>
							<p className="text-sm text-text-secondary leading-relaxed">Wait for a spot to open in the lab (Max capacity reached).</p>
						</div>

						<div className="flex gap-4 items-start">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">2</div>
							<p className="text-sm text-text-secondary leading-relaxed">Get notified via email and platform when promoted to <span className="font-bold text-accent">Active</span>.</p>
						</div>

						<div className="flex gap-4 items-start">
							<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">3</div>
							<p className="text-sm text-text-secondary leading-relaxed">Complete the 42 Robotics Cursus from E to S rank.</p>
						</div>
					</div>

					<button 
						onClick={handleDismiss}
						className="group relative w-full overflow-hidden rounded-2xl bg-white py-4 font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
					>
						<span className="relative z-10 text-sm">I&apos;m ready.</span>
					</button>
				</div>
			</div>

			<style>{`
				.drop-shadow-glow {
					filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.4));
				}
			`}</style>
		</div>
	);
}
