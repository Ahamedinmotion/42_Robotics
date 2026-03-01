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

	const progress = Math.min(Math.max(elapsedMs / totalMs, 0), 1);

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

	const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

	let colour: string;
	let label: string;
	let pulse = false;

	if (days > 7) {
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
