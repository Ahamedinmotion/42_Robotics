"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function ClientLogo() {
	const [clicks, setClicks] = useState(0);
	const [isCracked, setIsCracked] = useState(false);

	useEffect(() => {
		if (clicks >= 10) {
			setIsCracked(true);
			const timer = setTimeout(() => {
				setIsCracked(false);
				setClicks(0);
			}, 5000); // Reset after 5s
			return () => clearTimeout(timer);
		}
	}, [clicks]);

	const handleClick = (e: React.MouseEvent) => {
		setClicks((prev) => prev + 1);
	};

	return (
		<div className="relative">
			<button
				onClick={handleClick}
				className={`text-xl font-bold text-accent transition-transform duration-300 ${
					clicks > 0 && clicks < 10 ? "animate-bounce" : ""
				} ${isCracked ? "opacity-0 pointer-events-none" : ""}`}
				style={{
					animationIterationCount: 1,
					transform: clicks > 0 && clicks < 10 ? `scale(${1 + clicks * 0.05})` : "none"
				}}
			>
				RC
			</button>

			{isCracked && (
				<div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
					<div className="flex flex-col items-center">
						<span className="text-[10px] whitespace-nowrap font-mono text-accent italic">
							"You found it. Keep building. — RC"
						</span>
						<div className="text-[8px] text-text-muted mt-0.5">LOGO CRACKED!</div>
					</div>
				</div>
			)}

			<style dangerouslySetInnerHTML={{ __html: `
				@keyframes wobble {
					0%, 100% { transform: translateX(0); }
					25% { transform: translateX(-2px) rotate(-2deg); }
					75% { transform: translateX(2px) rotate(2deg); }
				}
				.animate-wobble {
					animation: wobble 0.1s linear infinite;
				}
			` }} />
		</div>
	);
}
