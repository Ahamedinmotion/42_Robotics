"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

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
	userState: "completed" | "active" | "available" | "locked";
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

const CX = 300;
const CY = 300;

// ── Component ────────────────────────────────────────

export function SkillTree({ projects, userRank, activeTeamProjectId }: SkillTreeProps) {
	const [hovered, setHovered] = useState<ProjectNode | null>(null);
	const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const [scale, setScale] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

	const userRankVal = RANK_VALUES[userRank] ?? 1;
	const sRankRevealed = userRankVal >= RANK_VALUES.A;

	// Compute node positions
	const nodePositions = new Map<string, { x: number; y: number }>();

	RANKS.forEach((rank, rankIdx) => {
		const nodes = projects[rank] || [];
		const radius = RING_RADII[rank];
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
			case "completed": return 8;
			case "active": return 9;
			case "available": return 7;
			default: return 5;
		}
	};

	// ── Pan & Zoom Handlers ─────────
	const handleWheel = (e: React.WheelEvent) => {
		e.preventDefault();
		const zoomSensitivity = 0.001;
		const delta = -e.deltaY * zoomSensitivity;
		setScale((s) => Math.min(Math.max(0.5, s + delta), 3));
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	return (
		<div 
			ref={containerRef} 
			className="relative mx-auto w-full overflow-hidden rounded-2xl border border-border-color bg-panel2/30" 
			style={{ aspectRatio: "1" }}
			onWheel={handleWheel}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
		>
			{/* CSS animations */}
			<style>{`
        @keyframes orbit-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .node-active-ring { animation: orbit-spin 3s linear infinite; transform-origin: center; transform-box: fill-box; }
        .s-ring-hidden { opacity: 0.08; transition: opacity 1.5s ease-in; }
        .s-ring-revealed { opacity: 1; transition: opacity 1.5s ease-in; }
      `}</style>

			<div 
				className="absolute inset-0 origin-center transition-transform" 
				style={{ 
					transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
					transitionDuration: isDragging ? '0ms' : '150ms'
				}}
			>
				<svg viewBox="0 0 600 600" width="100%" height="100%">
				{/* Glow filter */}
				<defs>
					<filter id="glow">
						<feGaussianBlur stdDeviation="3" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* Ring circles */}
				{RANKS.map((rank) => {
					const isSRank = rank === "S";
					return (
						<circle
							key={`ring-${rank}`}
							cx={CX}
							cy={CY}
							r={RING_RADII[rank]}
							fill="none"
							stroke={RANK_COLOURS[rank]}
							strokeWidth={0.5}
							strokeDasharray="3 8"
							className={isSRank ? (sRankRevealed ? "s-ring-revealed" : "s-ring-hidden") : ""}
							opacity={isSRank ? undefined : 0.3}
						/>
					);
				})}

				{/* Connection lines between rings */}
				{connections.map((c, i) => (
					<line
						key={`conn-${i}`}
						x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
						stroke="white" opacity={0.05} strokeWidth={0.5}
					/>
				))}

				{/* Nodes */}
				{RANKS.map((rank) => {
					const nodes = projects[rank] || [];
					const isSRank = rank === "S";
					if (isSRank && !sRankRevealed) return null;

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
								onClick={() => {
									if (node.userState !== "locked") {
										router.push(`/cursus/projects/${node.id}`);
									}
								}}
								style={{ cursor: node.userState === "locked" ? "default" : "pointer" }}
							>
								{/* Completed */}
								{node.userState === "completed" && (
									<>
										<circle cx={pos.x} cy={pos.y} r={r} fill={colour} filter="url(#glow)" />
										<circle cx={pos.x} cy={pos.y} r={3} fill="white" />
									</>
								)}

								{/* Active */}
								{node.userState === "active" && (
									<>
										<circle
											cx={pos.x} cy={pos.y} r={r}
											fill="none" stroke={colour} strokeWidth={2}
											strokeDasharray="4 3"
											className="node-active-ring"
										/>
										<circle cx={pos.x} cy={pos.y} r={5} fill={colour} />
									</>
								)}

								{/* Available */}
								{node.userState === "available" && (
									<circle
										cx={pos.x} cy={pos.y} r={r}
										fill={colour} fillOpacity={0.3}
										stroke={colour} strokeWidth={1.5}
									/>
								)}

								{/* Locked */}
								{node.userState === "locked" && (
									<circle
										cx={pos.x} cy={pos.y} r={r}
										fill="none" stroke={colour} strokeOpacity={0.3} strokeWidth={0.8}
									/>
								)}

								{/* Active team indicator dot */}
								{node.activeTeamCount > 0 && node.userState !== "locked" && (
									<circle cx={pos.x + r - 1} cy={pos.y - r + 1} r={2} fill="var(--accent)">
										<title>{`${node.activeTeamCount} team(s) active`}</title>
									</circle>
								)}
							</g>
						);
					});
				})}

				{/* Center element */}
				<circle cx={CX} cy={CY} r={32} fill="var(--panel)" stroke={RANK_COLOURS[userRank] || "#888"} strokeWidth={1.5} />
				<text x={CX} y={CY - 4} textAnchor="middle" dominantBaseline="middle" fill="var(--accent)" fontSize={14} fontWeight="bold">RC</text>
				<text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle" fill={RANK_COLOURS[userRank] || "#888"} fontSize={10}>{userRank}</text>
			</svg>

				{/* Tooltip overlay (HTML positioned over SVG) */}
				{hovered && (
					<div
						className="pointer-events-none absolute z-50 w-56 rounded-xl border border-border-color bg-panel p-3 shadow-lg"
						style={{
							left: `${(hoveredPos.x / 600) * 100}%`,
							top: `${(hoveredPos.y / 600) * 100}%`,
							transform: `translate(${hoveredPos.x > 300 ? "-110%" : "10%"}, ${hoveredPos.y > 300 ? "-110%" : "10%"})`,
						}}
					>
						<div className="mb-2 flex items-center gap-2">
							<span className="text-sm font-bold text-text-primary">{hovered.title}</span>
							<Badge rank={hovered.rank as any} size="sm" />
						</div>
						{hovered.skillTags.length > 0 && (
							<div className="mb-2 flex flex-wrap gap-1">
								{hovered.skillTags.map((tag) => (
									<span key={tag} className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] text-text-muted">
										{tag}
									</span>
								))}
							</div>
						)}
						<p className="text-xs text-text-muted">{hovered.teamSizeMin}–{hovered.teamSizeMax} members · {hovered.blackholeDays} days</p>
						{hovered.isUnique && <p className="mt-0.5 text-[10px] font-semibold text-accent-secondary">Unique project</p>}
						<p className="mt-1 text-[10px] text-accent">View Details →</p>
					</div>
				)}
			</div>
		</div>
	);
}
