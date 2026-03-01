import React from "react";

// ── Types ────────────────────────────────────────────

interface Skill {
	skillTag: string;
	projectsCompleted: number;
}

interface SkillRadarProps {
	skills: Skill[];
}

// ── Helpers ──────────────────────────────────────────

function titleCase(str: string) {
	return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ────────────────────────────────────────

export function SkillRadar({ skills }: SkillRadarProps) {
	const top = skills.slice(0, 8);

	if (top.length < 3) {
		return (
			<p className="text-sm italic text-text-muted">
				Complete projects to build your skill profile.
			</p>
		);
	}

	const cx = 200;
	const cy = 200;
	const maxR = 140;
	const total = top.length;
	const maxVal = Math.max(...top.map((s) => s.projectsCompleted), 1);
	const levels = [0.25, 0.5, 0.75, 1];

	const angleFor = (i: number) => (2 * Math.PI * i) / total - Math.PI / 2;

	// Build polygon path
	const points = top.map((s, i) => {
		const angle = angleFor(i);
		const val = s.projectsCompleted / maxVal;
		const r = val * maxR;
		return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
	});
	const polyPath = points.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<svg viewBox="0 0 400 400" className="mx-auto w-full max-w-sm">
			{/* Concentric circles */}
			{levels.map((l) => (
				<circle
					key={l}
					cx={cx}
					cy={cy}
					r={maxR * l}
					fill="none"
					stroke="var(--border)"
					strokeWidth={0.5}
					opacity={0.3}
				/>
			))}

			{/* Axes */}
			{top.map((s, i) => {
				const angle = angleFor(i);
				const ex = cx + maxR * Math.cos(angle);
				const ey = cy + maxR * Math.sin(angle);
				const lx = cx + maxR * 1.22 * Math.cos(angle);
				const ly = cy + maxR * 1.22 * Math.sin(angle);

				return (
					<g key={s.skillTag}>
						<line
							x1={cx} y1={cy} x2={ex} y2={ey}
							stroke="var(--border)" strokeWidth={0.5} opacity={0.3}
						/>
						<text
							x={lx}
							y={ly}
							fontSize={9}
							fill="var(--text-muted)"
							textAnchor="middle"
							dominantBaseline="middle"
						>
							{titleCase(s.skillTag)}
						</text>
					</g>
				);
			})}

			{/* Data polygon */}
			<polygon
				points={polyPath}
				fill="var(--accent)"
				fillOpacity={0.2}
				stroke="var(--accent)"
				strokeWidth={1.5}
			/>

			{/* Data points */}
			{points.map((p, i) => (
				<circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent)" />
			))}
		</svg>
	);
}
