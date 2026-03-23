"use client";

import { useState, useEffect } from "react";

interface BlackholeTimerProps {
	deadline: Date | string;
	activatedAt: Date | string;
	className?: string;
}

export function BlackholeTimer({ deadline, activatedAt, className = "" }: BlackholeTimerProps) {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 60_000);
		return () => clearInterval(interval);
	}, []);

	const deadlineDate = new Date(deadline);
	const activatedDate = new Date(activatedAt);
	const totalMs = deadlineDate.getTime() - activatedDate.getTime();
	const elapsedMs = now.getTime() - activatedDate.getTime();
	const remainingMs = deadlineDate.getTime() - now.getTime();

	const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

	const progress = Math.min(Math.max(elapsedMs / totalMs, 0), 1);

	// ── 42 Hour Firework Logic ─────────────────
	const [hasFired, setHasFired] = useState(false);
	useEffect(() => {
		const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
		if (totalHours === 42 && !hasFired) {
			import("canvas-confetti").then((confetti) => {
				const duration = 3 * 1000;
				const animationEnd = Date.now() + duration;
				const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
				const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

				const interval: any = setInterval(function() {
					const timeLeft = animationEnd - Date.now();
					if (timeLeft <= 0) return clearInterval(interval);
					const particleCount = 50 * (timeLeft / duration);
					confetti.default({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500'] });
					confetti.default({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#FFD700', '#FFA500'] });
				}, 250);
			});
			setHasFired(true);
		}
	}, [remainingMs, hasFired]);

	if (remainingMs <= 0) {
		return (
			<div className={`${className}`}>
				<span className="text-sm font-bold text-accent-urgency">BLACKHOLED</span>
				<div className="mt-1 h-1 w-full rounded-full bg-panel2">
					<div className="h-full rounded-full bg-accent-urgency" style={{ width: "100%" }} />
				</div>
			</div>
		);
	}

	let colour: string;
	let label: string;
	let pulse = false;
	let isFireworkTime = Math.floor(remainingMs / (1000 * 60 * 60)) === 42;

	if (isFireworkTime) {
		colour = "#FFD700"; // Gold
		label = `42 HOURS REMAINING`;
		pulse = true;
	} else if (days > 7) {
		colour = "#44FF88";
		label = `${days} days remaining`;
	} else if (days >= 3) {
		colour = "#FFD700";
		label = `${days} days remaining`;
	} else if (days >= 1) {
		colour = "var(--accent)";
		label = `${days}d ${hours}h remaining`;
	} else {
		colour = "var(--accent-urgency)";
		label = `${hours}h ${minutes}m remaining`;
		pulse = true;
	}

	return (
		<div className={`${className}`}>
			<span
				className={`text-sm font-semibold ${pulse ? "animate-pulse" : ""}`}
				style={{ color: colour }}
			>
				{label}
			</span>
			<div className="mt-1 h-1 w-full rounded-full bg-panel2">
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${progress * 100}%`, backgroundColor: colour }}
				/>
			</div>
		</div>
	);
}
