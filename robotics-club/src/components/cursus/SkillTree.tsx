"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

import { useSound } from "@/components/providers/SoundProvider";

// ── Types ────────────────────────────────────────────

export interface ProjectNode {
	id: string;
	title: string;
	rank: string;
	skillTags: string[];
	blackholeDays: number;
	teamSizeMin: number;
	teamSizeMax: number;
	activeTeamCount: number;
	isUnique: boolean;
	userState: "locked" | "available" | "active" | "completed";
}

interface SkillTreeProps {
	projects: Record<string, ProjectNode[]>;
	userRank: string;
	activeTeamProjectId: string | null;
}

// ── Constants ────────────────────────────────────────

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
	E: 70,
	D: 130,
	C: 190,
	B: 250,
	A: 310,
	S: 370,
};

const RANK_VALUES: Record<string, number> = {
	E: 1, D: 2, C: 3, B: 4, A: 5, S: 6,
};

const CX = 0;
const CY = 0;

// ── Component ────────────────────────────────────────

export function SkillTree({ projects, userRank, activeTeamProjectId }: SkillTreeProps) {
	const { playSFX } = useSound();
	const [hovered, setHovered] = useState<ProjectNode | null>(null);
	const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const [scale, setScale] = useState(0.85);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

	const userRankVal = RANK_VALUES[userRank] ?? 1;
	const sRankRevealed = userRankVal >= RANK_VALUES.A;

	// Compute node positions
	const nodePositions = new Map<string, { x: number; y: number }>();

	RANKS.forEach((rank, rankIdx) => {
		const nodes = projects[rank] || [];
		const radius = RING_RADII[rank] * 1.25; // Scale up for better spacing
		nodes.forEach((node, nodeIdx) => {
			const total = nodes.length || 1;
			const angle = (2 * Math.PI * nodeIdx) / total - Math.PI / 2 + rankIdx * 0.25;
			const x = CX + radius * Math.cos(angle);
			const y = CY + radius * Math.sin(angle);
			nodePositions.set(node.id, { x, y });
		});
	});

	// Connection lines between rings
	const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
	for (let i = 0; i < RANKS.length - 1; i++) {
		const currentNodes = projects[RANKS[i]] || [];
		const nextNodes = projects[RANKS[i + 1]] || [];
		if (currentNodes.length > 0 && nextNodes.length > 0) {
			const lastNode = currentNodes[currentNodes.length - 1];
			const firstNode = nextNodes[0];
			const p1 = nodePositions.get(lastNode.id);
			const p2 = nodePositions.get(firstNode.id);
			if (p1 && p2) connections.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
		}
	}

	const handleNodeHover = (node: ProjectNode, x: number, y: number) => {
		if (node.userState === "locked") return;
		setHovered(node);
		setHoveredPos({ x, y });
	};

	const nodeRadius = (state: string) => {
		switch (state) {
			case "completed": return 10;
			case "active": return 11;
			case "available": return 9;
			default: return 7;
		}
	};

	// ── Pan & Zoom Handlers ─────────
	const handleWheel = useCallback((e: WheelEvent) => {
		e.preventDefault();
		const zoomSensitivity = 0.0015;
		const delta = -e.deltaY * zoomSensitivity;
		setScale((s) => Math.min(Math.max(0.4, s + delta), 4));
	}, []);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => el.removeEventListener("wheel", handleWheel);
	}, [handleWheel]);

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setLastPos({ x: e.clientX, y: e.clientY });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		const dx = e.clientX - lastPos.x;
		const dy = e.clientY - lastPos.y;
		setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
		setLastPos({ x: e.clientX, y: e.clientY });
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// ── Touch handlers ──
	const handleTouchStart = (e: React.TouchEvent) => {
		const t = e.touches[0];
		setLastPos({ x: t.clientX, y: t.clientY });
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		const t = e.touches[0];
		const dx = t.clientX - lastPos.x;
		const dy = t.clientY - lastPos.y;
		setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
		setLastPos({ x: t.clientX, y: t.clientY });
	};

	const handleReset = () => {
		setScale(0.85);
		setPan({ x: 0, y: 0 });
		playSFX("button");
	};

	// ── Background Particles ──────
	const particles = useRef(
		Array.from({ length: 40 }).map((_, i) => ({
			id: i,
			x: Math.random() * 2000 - 1000,
			y: Math.random() * 2000 - 1000,
			size: Math.random() * 2 + 1,
			opacity: Math.random() * 0.4 + 0.1,
			duration: Math.random() * 20 + 20,
			delay: Math.random() * -20,
		}))
	).current;

	return (
		<div
			ref={containerRef}
			className="relative w-full overflow-hidden border border-border-color bg-panel/30 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
			style={{
				height: "calc(100vh - 200px)",
				cursor: isDragging ? "grabbing" : "grab",
			}}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={() => {}}
		>
			<style>{`
				@keyframes orbit-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
				@keyframes node-pulse { 0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px var(--glow-col)); } 50% { opacity: 0.7; filter: drop-shadow(0 0 16px var(--glow-col)); } }
				@keyframes ring-drift { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -22; } }
				@keyframes bg-drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 10px); } }
				.node-active-ring { animation: orbit-spin 3s linear infinite; transform-origin: center; transform-box: fill-box; }
				.node-completed { animation: node-pulse 3s ease-in-out infinite; }
				.node-available { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
				.node-available:hover { transform: scale(1.5); transform-origin: center; transform-box: fill-box; }
				.ring-orbit { animation: ring-drift 6s linear infinite; }
				.s-ring-hidden { opacity: 0.05; transition: opacity 1.5s ease; }
				.s-ring-revealed { opacity: 1; transition: opacity 1.5s ease; }
				.particle { animation: bg-drift var(--dur) ease-in-out infinite; animation-delay: var(--del); }
			`}</style>

			{/* Controls */}
			<div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
				<button
					onClick={handleReset}
					className="flex h-10 w-10 items-center justify-center rounded-full border border-border-color bg-panel shadow-lg hover:border-accent hover:text-accent transition-all"
					title="Recenter View"
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
					</svg>
				</button>
				<button
					onClick={() => setScale(s => Math.min(s + 0.2, 4))}
					className="flex h-10 w-10 items-center justify-center rounded-full border border-border-color bg-panel shadow-lg hover:border-accent hover:text-accent transition-all"
				>
					<span className="text-xl font-bold">+</span>
				</button>
				<button
					onClick={() => setScale(s => Math.max(s - 0.2, 0.4))}
					className="flex h-10 w-10 items-center justify-center rounded-full border border-border-color bg-panel shadow-lg hover:border-accent hover:text-accent transition-all"
				>
					<span className="text-xl font-bold">-</span>
				</button>
			</div>

			<div
				className="absolute inset-0 flex items-center justify-center"
				style={{
					transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
					transition: isDragging ? 'none' : 'transform 100ms ease-out',
				}}
			>
				<svg viewBox="-500 -500 1000 1000" className="h-[1000px] w-[1000px] pointer-events-none overflow-visible">
					<defs>
						<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="4" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						{RANKS.map((rank) => (
							<radialGradient key={`rg-${rank}`} id={`ring-glow-${rank}`} cx="50%" cy="50%" r="50%">
								<stop offset="0%" stopColor={RANK_COLOURS[rank]} stopOpacity="0.1" />
								<stop offset="100%" stopColor={RANK_COLOURS[rank]} stopOpacity="0" />
							</radialGradient>
						))}
					</defs>

					{/* Background Space Dust */}
					<g className="pointer-events-none opacity-40">
						{particles.map((p) => (
							<circle
								key={`p-${p.id}`}
								cx={p.x}
								cy={p.y}
								r={p.size}
								fill="white"
								fillOpacity={p.opacity}
								className="particle"
								style={{
									// @ts-ignore
									"--dur": `${p.duration}s`,
									"--del": `${p.delay}s`,
								}}
							/>
						))}
					</g>

					{/* Background connections */}
					{connections.map((c, i) => (
						<line
							key={`conn-${i}`}
							x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
							stroke="var(--text-muted)" opacity={0.12} strokeWidth={1}
							strokeDasharray="4 8"
						/>
					))}

					{/* Rings */}
					{RANKS.map((rank) => {
						const isSRank = rank === "S";
						const radius = RING_RADII[rank] * 1.25;
						if (isSRank && !sRankRevealed) return null;

						return (
							<g key={`ring-group-${rank}`}>
								<circle
									cx={CX} cy={CY} r={radius + 20}
									fill={`url(#ring-glow-${rank})`}
									className={isSRank ? "s-ring-revealed" : ""}
								/>
								<circle
									cx={CX} cy={CY} r={radius}
									fill="none"
									stroke={RANK_COLOURS[rank]}
									strokeWidth={1.5}
									strokeDasharray="5 10"
									className={`ring-orbit ${isSRank ? "s-ring-revealed" : ""}`}
									opacity={isSRank ? 1 : 0.4}
								/>
							</g>
						);
					})}

					{/* Nodes */}
					{RANKS.map((rank) => {
						const nodes = projects[rank] || [];
						if (rank === "S" && !sRankRevealed) return null;

						return nodes.map((node) => {
							const pos = nodePositions.get(node.id);
							if (!pos) return null;
							const colour = RANK_COLOURS[rank];
							const r = nodeRadius(node.userState);

							return (
								<g
									key={node.id}
									onMouseEnter={() => handleNodeHover(node, pos.x, pos.y)}
									onMouseLeave={() => setHovered(null)}
									onClick={(e) => {
										e.stopPropagation();
										if (node.userState !== "locked") {
											playSFX("button");
											router.push(`/cursus/projects/${node.id}`);
										}
									}}
									style={{
										cursor: node.userState === "locked" ? "default" : "pointer",
										// @ts-ignore
										"--glow-col": colour,
										pointerEvents: "auto",
									}}
								>
									{/* Node drawing logic */}
									{node.userState === "completed" && (
										<>
											<circle cx={pos.x} cy={pos.y} r={r + 4} fill={colour} fillOpacity={0.2} filter="url(#glow)" />
											<circle cx={pos.x} cy={pos.y} r={r} fill={colour} className="node-completed" />
											<circle cx={pos.x} cy={pos.y} r={r / 2} fill="white" />
										</>
									)}
									{node.userState === "active" && (
										<>
											<circle
												cx={pos.x} cy={pos.y} r={r + 4}
												fill="none" stroke={colour} strokeWidth={2}
												strokeDasharray="6 4"
												className="node-active-ring"
											/>
											<circle cx={pos.x} cy={pos.y} r={r} fill={colour} />
											<circle cx={pos.x} cy={pos.y} r={3} fill="white" fillOpacity={0.5} />
										</>
									)}
									{node.userState === "available" && (
										<circle
											cx={pos.x} cy={pos.y} r={r}
											fill={colour} fillOpacity={0.4}
											stroke={colour} strokeWidth={2}
											className="node-available"
										/>
									)}
									{node.userState === "locked" && (
										<circle
											cx={pos.x} cy={pos.y} r={r}
											fill="none" stroke={colour} strokeOpacity={0.25} strokeWidth={1}
										/>
									)}
									{node.activeTeamCount > 0 && node.userState !== "locked" && (
										<circle cx={pos.x + r} cy={pos.y - r} r={3} fill="var(--accent)" filter="url(#glow)" />
									)}
								</g>
							);
						});
					})}

					{/* Center Sun */}
					<g className="filter drop-shadow-lg">
						<circle cx={CX} cy={CY} r={40} fill="var(--panel)" stroke={RANK_COLOURS[userRank] || "#888"} strokeWidth={2} />
						<text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle" fill="var(--accent)" fontSize={18} fontWeight="900">RC</text>
						<text x={CX} y={CY + 15} textAnchor="middle" dominantBaseline="middle" fill={RANK_COLOURS[userRank] || "#888"} fontSize={12} fontWeight="bold">{userRank}</text>
					</g>
				</svg>

				{/* Tooltip */}
				{hovered && (
					<div
						className="pointer-events-none fixed z-[60] w-64 rounded-2xl border border-border-color bg-panel/90 p-4 shadow-2xl backdrop-blur-md transition-opacity duration-200"
						style={{
							left: `${hoveredPos.x * scale + pan.x + (containerRef.current?.offsetWidth || 0) / 2}px`,
							top: `${hoveredPos.y * scale + pan.y + (containerRef.current?.offsetHeight || 0) / 2}px`,
							transform: `translate(${hoveredPos.x > 0 ? "-110%" : "10%"}, ${hoveredPos.y > 0 ? "-110%" : "10%"})`,
						}}
					>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-base font-black text-text-primary tracking-tight">{hovered.title}</span>
							<Badge rank={hovered.rank as any} size="sm" />
						</div>
						<div className="mb-3 flex flex-wrap gap-1.5">
							{hovered.skillTags.map((tag) => (
								<span key={tag} className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
									{tag}
								</span>
							))}
						</div>
						<div className="flex items-center justify-between text-[11px] text-text-muted">
							<span>{hovered.teamSizeMin}–{hovered.teamSizeMax} Users</span>
							<span>{hovered.blackholeDays}d Limit</span>
						</div>
						{hovered.isUnique && <div className="mt-2 text-[10px] font-bold text-accent-secondary uppercase tracking-widest text-center border-t border-border-color/30 pt-2">★ Unique Achievement</div>}
					</div>
				)}
			</div>
		</div>
	);
}

