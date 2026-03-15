"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function ClientLogo() {
	const [clicks, setClicks] = useState(0);
	const [isCracked, setIsCracked] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		if (clicks >= 10) {
			setIsCracked(true);
			const timer = setTimeout(() => {
				setIsCracked(false);
				setClicks(0);
			}, 8000); // Reset after 8s
			return () => clearTimeout(timer);
		}
	}, [clicks]);

	const handleClick = (e: React.MouseEvent) => {
		setClicks((prev) => prev + 1);
	};

	return (
		<div
			className="relative isolate"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<button
				onClick={handleClick}
				className={`relative text-xl font-bold text-accent transition-all duration-300 ${isHovered && clicks < 10 ? "scale-110" : "scale-100"
					} ${isCracked ? "opacity-0 pointer-events-none" : ""}`}
				style={{
					animation: clicks > 0 && clicks < 10 ? `shake ${0.2 - clicks * 0.01}s infinite` : "none",
					transform: clicks > 0 && clicks < 10 ? `scale(${1 + clicks * 0.05})` : "none"
				}}
			>
				<span className="relative z-10">RC</span>

				{/* SVG Shatter Lines */}
				{clicks > 0 && Array.from({ length: clicks }).map((_, i) => (
					<svg
						key={i}
						className="absolute inset-0 h-full w-full pointer-events-none overflow-visible"
						viewBox="0 0 100 100"
					>
						<line
							x1="50" y1="50"
							x2={50 + Math.cos(i * 137.5) * 60}
							y2={50 + Math.sin(i * 137.5) * 60}
							stroke="currentColor"
							strokeWidth="0.5"
							opacity={0.3 + (clicks * 0.05)}
							className="animate-in fade-in zoom-in duration-300"
						/>
					</svg>
				))}
			</button>

			{isCracked && (
				<div className="absolute left-0 top-full mt-4 min-w-[320px] z-[100] pointer-events-none">
					<div className="animate-glitch-in">
						<div className="flex flex-col gap-1 rounded border border-accent/40 bg-background/95 p-5 font-mono shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)] backdrop-blur-xl transition-all">
							<div className="flex items-center gap-2 text-[10px] font-bold text-accent">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
									<span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
								</span>
								<span className="tracking-[0.2em]">OVERRIDE_ESTABLISHED</span>
							</div>

							<div className="mt-3 text-sm leading-relaxed text-text-primary">
								<span className="text-secondary opacity-50">&gt; </span>
								"Structure is a lie. The only constant is motion. Keep building, ghost."
							</div>

							<div className="mt-5 flex flex-wrap gap-1.5">
								{["RECOVERY", "NULL_STATE", "ROBOTICS_42", "STABILITY_ERR"].map((tag) => (
									<span key={tag} className="bg-accent/10 border border-accent/20 px-1.5 py-0.5 text-[9px] uppercase tracking-tighter text-accent/80 font-bold">
										{tag}
									</span>
								))}
							</div>

							<div className="mt-3 pt-3 border-t border-accent/10 flex items-center justify-between opacity-40">
								<div className="text-[8px] tracking-widest uppercase">Seed_{Math.random().toString(36).substring(7).toUpperCase()}</div>
								<div className="text-[8px]">V1.4.2_AUTH</div>
							</div>
						</div>

						{/* ASCII Particles */}
						<div className="absolute -left-12 -top-12 h-40 w-40 overflow-visible opacity-40">
							{Array.from({ length: 20 }).map((_, i) => (
								<div
									key={i}
									className="absolute inline-block text-[10px] text-accent animate-out fade-out zoom-out"
									style={{
										left: `${Math.random() * 100}%`,
										top: `${Math.random() * 100}%`,
										animationDuration: `${0.5 + Math.random() * 2}s`,
										animationDelay: `${Math.random() * 0.5}s`,
										animationFillMode: "forwards"
									}}
								>
									{["/", "\\", "|", "_", "*", "@"][Math.floor(Math.random() * 6)]}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			<style dangerouslySetInnerHTML={{
				__html: `
				@keyframes shake {
					0%, 100% { transform: translate(0, 0); }
					25% { transform: translate(-1px, 1px); }
					75% { transform: translate(1px, -1px); }
				}
				@keyframes glitch-in {
					0% { opacity: 0; transform: translateY(-10px) skewX(-10deg); filter: blur(5px); }
					20% { opacity: 1; transform: translateY(0) skewX(0); filter: blur(0); }
					30% { transform: skewX(5deg); }
					40% { transform: skewX(-5deg); }
					50% { transform: skewX(0); }
				}
				.animate-glitch-in {
					animation: glitch-in 0.6s ease-out forwards;
				}
			` }} />
		</div>
	);
}
