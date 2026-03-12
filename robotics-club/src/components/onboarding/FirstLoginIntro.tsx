"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface FirstLoginIntroProps {
	tagline: string;
}

const RANKS = ["E", "D", "C", "B", "A", "S"] as const;
const RANK_COLOURS: Record<string, string> = {
	E: "#888888",
	D: "#44AAFF",
	C: "#44FF88",
	B: "#FFD700",
	A: "#FF6B00",
	S: "#CC44FF",
};
const RING_RADII: Record<string, number> = {
	E: 60,
	D: 110,
	C: 160,
	B: 210,
	A: 260,
	S: 310,
};

export function FirstLoginIntro({ tagline }: FirstLoginIntroProps) {
	const [isVisible, setIsVisible] = useState(true);
	const [phase, setPhase] = useState<"assembly" | "zoom" | "title" | "enter">("assembly");
	const [revealedRanks, setRevealedRanks] = useState<string[]>([]);
	const router = useRouter();

	useEffect(() => {
		// Animation Sequence
		const sequence = async () => {
			// 1. Assembly (1.5s)
			let delay = 0;
			for (const rank of RANKS) {
				setTimeout(() => {
					setRevealedRanks(prev => [...prev, rank]);
				}, delay);
				delay += 250;
			}

			await new Promise(r => setTimeout(r, delay + 500));
			setPhase("zoom");

			// 2. Zoom & Title (1s)
			await new Promise(r => setTimeout(r, 800));
			setPhase("title");

			// 3. Enter button (0.5s)
			await new Promise(r => setTimeout(r, 1000));
			setPhase("enter");

			// 4. Auto-dismiss after 4s total
			setTimeout(() => {
				handleDismiss();
			}, 1500); 
		};

		sequence();
	}, []);

	const handleDismiss = async () => {
		setIsVisible(false);
		try {
			await fetch("/api/user/onboarding", {
				method: "PATCH",
				body: JSON.stringify({ hasSeenIntro: true }),
				headers: { "Content-Type": "application/json" }
			});
			router.refresh();
		} catch (error) {
			console.error("Failed to update onboarding status", error);
		}
	};

	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white">
			<style>{`
				@keyframes pop-in {
					0% { transform: scale(0); opacity: 0; }
					70% { transform: scale(1.1); opacity: 1; }
					100% { transform: scale(1); opacity: 1; }
				}
				@keyframes fade-in {
					from { opacity: 0; transform: translateY(10px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.node-pop { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
				.fade-in { animation: fade-in 0.8s ease forwards; }
				.tree-container {
					transition: transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
				}
			`}</style>

			{/* Skip Button */}
			<button 
				onClick={handleDismiss}
				className="absolute right-8 top-8 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors"
			>
				Skip Intro
			</button>

			<div 
				className="tree-container relative flex items-center justify-center"
				style={{ 
					transform: phase === "assembly" ? "scale(1.2)" : "scale(0.8)",
					opacity: (phase === "title" || phase === "enter") ? 0.3 : 1,
					filter: (phase === "title" || phase === "enter") ? "blur(4px)" : "none"
				}}
			>
				<svg viewBox="-400 -400 800 800" className="h-[600px] w-[600px] overflow-visible">
					{/* Rings */}
					{RANKS.map(rank => {
						if (!revealedRanks.includes(rank)) return null;
						return (
							<circle 
								key={rank}
								cx={0} cy={0} r={RING_RADII[rank]}
								fill="none"
								stroke={RANK_COLOURS[rank]}
								strokeWidth={1}
								strokeDasharray="4 8"
								className="node-pop opacity-20"
							/>
						);
					})}

					{/* Nodes (Representative) */}
					{RANKS.map((rank, rIdx) => {
						if (!revealedRanks.includes(rank)) return null;
						const count = rIdx + 3;
						return Array.from({ length: count }).map((_, nIdx) => {
							const angle = (nIdx * 2 * Math.PI) / count - Math.PI / 2;
							const x = RING_RADII[rank] * Math.cos(angle);
							const y = RING_RADII[rank] * Math.sin(angle);
							return (
								<circle 
									key={`${rank}-${nIdx}`}
									cx={x} cy={y} r={6}
									fill={RANK_COLOURS[rank]}
									className="node-pop"
									style={{ animationDelay: `${nIdx * 50}ms` }}
								/>
							);
						});
					})}

					{/* Center RC */}
					<text 
						x={0} y={0} 
						textAnchor="middle" 
						dominantBaseline="middle" 
						fill="white" 
						fontSize={24} 
						fontWeight="900" 
						className="node-pop"
					>
						RC
					</text>
				</svg>
			</div>

			{/* Overlay Text */}
			<div className="absolute inset-x-0 flex flex-col items-center justify-center text-center pointer-events-none">
				{(phase === "title" || phase === "enter") && (
					<div className="space-y-4 px-6">
						<h1 className="fade-in text-6xl font-black uppercase tracking-tighter text-white">
							Robotics Club
						</h1>
						<p className="fade-in text-lg font-medium text-text-muted" style={{ animationDelay: "0.3s" }}>
							{tagline}
						</p>
					</div>
				)}

				{phase === "enter" && (
					<div className="mt-12 pointer-events-auto">
						<button 
							onClick={handleDismiss}
							className="fade-in group relative overflow-hidden rounded-full bg-white px-10 py-4 font-bold text-black transition-all hover:scale-105 active:scale-95"
							style={{ animationDelay: "0.6s" }}
						>
							<span className="relative z-10 uppercase tracking-widest">Enter</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
