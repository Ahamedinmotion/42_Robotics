"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
	isRequired: boolean;
	description: string;
	completionRate: number;
	hasBeenCompleted: boolean;
	userState: "locked" | "available" | "active" | "completed";
}

interface SkillTreeProps {
	projects: Record<string, ProjectNode[]>;
	userRank: string;
	activeTeamProjectId: string | null;
	rankRequirements: Record<string, number>;
	rankProgress: {
		rank: string;
		isEligible: boolean;
		missingRequired: string[];
		neededCount: number;
	}[];
}

const RANKS = ["E", "D", "C", "B", "A", "S"] as const;
type RankStr = typeof RANKS[number];

const RANK_COLOURS: Record<string, string> = {
	E: "var(--rank-e)",
	D: "var(--rank-d)",
	C: "var(--rank-c)",
	B: "var(--rank-b)",
	A: "var(--rank-a)",
	S: "var(--rank-s)",
};

const RANK_VALUES: Record<string, number> = {
	E: 1, D: 2, C: 3, B: 4, A: 5, S: 6,
};

const CX = 0;
const CY = 0;

export function SkillTree({ projects, userRank, activeTeamProjectId, rankRequirements, rankProgress = [] }: SkillTreeProps) {
	const { playSFX } = useSound();
	const router = useRouter();

	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	
	const [activeRing, setActiveRing] = useState<RankStr | null>(null);
	
	const [hoveredNode, setHoveredNode] = useState<ProjectNode | null>(null);
	const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 });
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	const [triggerS, setTriggerS] = useState(false);
	const [bgTint, setBgTint] = useState("transparent");
	const [hoveredRing, setHoveredRing] = useState<string | null>(null);
	const [svgMousePos, setSvgMousePos] = useState({ x: 0, y: 0 });

	// ── Performance Mode ──
	const [perfMode, setPerfMode] = useState(false);
	useEffect(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("skilltree-perf");
			if (saved === "true") setPerfMode(true);
		}
	}, []);
	const togglePerfMode = useCallback(() => {
		setPerfMode(prev => {
			const next = !prev;
			localStorage.setItem("skilltree-perf", String(next));
			return next;
		});
	}, []);

	// ── Ambient Particles (State 1) ──
	const [animFrame, setAnimFrame] = useState(0);
	const ambientParticles = useMemo(() =>
		Array.from({ length: 30 }, (_, i) => {
			const rank = (["E", "D", "C", "B", "A"] as const)[i % 5];
			return {
				id: i,
				rank,
				angle: (Math.PI * 2 * i) / 30 + Math.random() * 0.5,
				speed: 0.0002 + Math.random() * 0.0001,
				radiusOffset: (Math.random() - 0.5) * 25,
				opacity: 0.2 + Math.random() * 0.3,
				size: 1 + Math.random() * 1.5,
			};
		}), []
	);
	const particleAngles = useRef(ambientParticles.map(p => p.angle));

	// ── Ring Counter-Rotation (State 1) ──
	const RING_SPEEDS: Record<string, number> = { E: 0.00003, D: -0.00004, C: 0.00005, B: -0.00006, A: 0.00007, S: 0 };
	const ringRotations = useRef<Record<string, number>>({ E: 0, D: 0, C: 0, B: 0, A: 0, S: 0 });

	// ── Sparkles (completed nodes) ──
	const [sparkles, setSparkles] = useState<{ id: string; x: number; y: number; sx: number; sy: number }[]>([]);
	const sparkleTimers = useRef<Record<string, NodeJS.Timeout>>({});

	// ── Locked node flicker ──
	const [flickerNodeId, setFlickerNodeId] = useState<string | null>(null);
	const flickerTimeout = useRef<NodeJS.Timeout | null>(null);

	// ── State 2 Rank Particles ──
	interface S2Particle {
		x:number; y:number; vx:number; vy:number; opacity:number; size:number; life:number; maxLife:number; angle:number; rotSpeed:number;
		// B rank leaves
		baseX?:number; fallSpeed?:number; swaySpeed?:number; swayAmplitude?:number; swayOffset?:number; rotation?:number; rotationSpeed?:number;
		// A rank embers
		trail?:{x:number,y:number}[]; speed?:number; offset?:number;
		// S rank fragments
		orbitRadius?:number; orbitAngle?:number; orbitSpeed?:number; selfRotation?:number; selfRotationSpeed?:number;
	}
	const s2Particles = useRef<S2Particle[]>([]);

	// A rank burst particles
	const aBurstParticles = useRef<{x:number;y:number;vx:number;vy:number;life:number;maxLife:number;size:number}[]>([]);
	const lastBurstTime = useRef(Date.now());

	// S rank Event Horizon state
	const crackleState = useRef({ active: false, progress: 0, intensity: 1, lastCrackle: 0, nextCrackle: 600 + Math.random() * 800 });
	const lightningState = useRef<{ arcs: { path: {x:number,y:number}[], opacity: number, nodeA: string, nodeB: string, isMajor: boolean, branches: {x:number,y:number}[][] }[], lastFire: number, nextFire: number }>({ arcs: [], lastFire: 0, nextFire: 800 + Math.random() * 1200 });
	const vortexAngle = useRef(0);
	const sShimmerAngle = useRef(0);
	const aberrationAngle = useRef(0);
	const shockwaves = useRef<{life:number,maxLife:number}[]>([]);
	const crackleSegments = useRef<{startAngle:number,arcLength:number,opacity:number,strokeW:number}[]>([]);
	const energyTendrils = useRef<{angle:number,length:number,opacity:number}[]>([]);
	const [gravSeed, setGravSeed] = useState(0);

	// Heat distortion seed
	const [heatSeed, setHeatSeed] = useState(0);

	const generateS2Particles = useCallback((rank: string): S2Particle[] => {
		const rng = () => Math.random();
		switch(rank) {
			case "E": return Array.from({length:25},()=>({x:(rng()-0.5)*900,y:(rng()-0.5)*900,vx:(rng()-0.5)*0.4,vy:(rng()-0.5)*0.4,opacity:0.15+rng()*0.15,size:0.8+rng()*0.7,life:0,maxLife:9999,angle:0,rotSpeed:0}));
			case "D": return Array.from({length:15},()=>{const a=rng()*Math.PI*2;const sp=2+rng()*2;return{x:(rng()-0.5)*900,y:(rng()-0.5)*900,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,opacity:0.4+rng()*0.4,size:1,life:0,maxLife:30+Math.floor(rng()*30),angle:a,rotSpeed:0};});
			case "C": return Array.from({length:20},(_,i)=>({x:0,y:0,vx:0,vy:0,opacity:0.3+rng()*0.3,size:1,life:0,maxLife:9999,angle:(Math.PI*2*i)/20+rng()*0.3,rotSpeed:0.005+rng()*0.01}));
			case "B": return Array.from({length:20},()=>{
				const ix=(rng()-0.5)*800; const iy=(rng()-0.5)*900;
				return{x:ix,y:iy,baseX:ix,vx:0,vy:0,opacity:0.3+rng()*0.3,size:3,life:0,maxLife:9999,angle:0,rotSpeed:0,
					fallSpeed:0.15+rng()*0.25, swaySpeed:0.02+rng()*0.03, swayAmplitude:15+rng()*25, swayOffset:rng()*Math.PI*2,
					rotation:rng()*360, rotationSpeed:(rng()-0.5)*2
				};
			});
			case "A": return Array.from({length:30},()=>{
				const ix=(rng()-0.5)*900; const iy=200+rng()*250;
				return{x:ix,y:iy,vx:0,vy:0,opacity:0.6,size:1+rng()*0.5,life:0,maxLife:9999,angle:0,rotSpeed:0,
					speed:0.4+rng()*0.5, offset:rng()*Math.PI*2, trail:[{x:ix,y:iy}]
				};
			});
			case "S": return Array.from({length:45},()=>{
				const or = 180+rng()*220;
				return{x:0,y:0,vx:0,vy:0,opacity:0.4+rng()*0.4,size:1.5+rng()*2,life:0,maxLife:9999,angle:0,rotSpeed:0,
					orbitRadius:or, orbitAngle:rng()*Math.PI*2, orbitSpeed:0.0008+rng()*0.0006,
					selfRotation:0, selfRotationSpeed:0.08+rng()*0.06,
					fallSpeed:0.6+rng()*0.4, // ellipseRatio
					swaySpeed:rng()*Math.PI*2, // ellipseRotation
					swayAmplitude:0.0001+rng()*0.0001, // ellipseRotSpeed
					rotation:0, // colorProgress
					rotationSpeed:0, // flashing frames
					baseX:rng()*15, // chaosAmplitude
				};
			});
			default: return [];
		}
	}, []);

	// ── State 2 Ring Pulse ──
	const ringPulseProgress = useRef(0);
	const ringPulseActive = useRef(false);

	// ── State 2 Affinity Dots ──
	const affinityProgress = useRef<Record<string, { progress: number; dir: 1 | -1 }>>({});

	// ── State 2 Slow Rotation ──
	const state2Rotation = useRef(0);
	const state2Paused = useRef(false);

	// ── Node Completion Explosions ──
	interface ExplosionParticle { id:string; x:number; y:number; vx:number; vy:number; life:number; maxLife:number; size:number; color:string; }
	const explosionParticles = useRef<ExplosionParticle[]>([]);
	const prevNodeStates = useRef<Record<string, string>>({});

	// ── Background Particles (State 1) ──
	const bgParticles = useRef<{x:number,y:number,vx:number,vy:number,baseVx:number,baseVy:number,rank:string,opacity:number,size:number,color:string,pulseSpeed:number,pulseOffset:number}[]>(
		(() => {
			const ranks = ["E","D","C","B","A","S"] as const;
			const colors = ["#44AAFF", "#44FF88", "#FFD700", "#FF6B00", "#CC44FF", "#FF4488"];
			return Array.from({length: 120}, (_, i) => {
				const vx = (Math.random()-0.5)*0.2;
				const vy = (Math.random()-0.5)*0.2;
				const rank = ranks[i % ranks.length];
				const color = colors[i % colors.length];
				return {
					x:(Math.random()-0.5)*1000, y:(Math.random()-0.5)*1000,
					vx, vy, baseVx:vx, baseVy:vy, rank,
					opacity: 0.15 + Math.random() * 0.25,
					size: 0.8 + Math.random() * 2.5,
					color,
					pulseSpeed: 0.02 + Math.random() * 0.03,
					pulseOffset: Math.random() * Math.PI * 2
				};
			});
		})()
	);
	const cursorTrail = useRef<{x:number,y:number,age:number}[]>([]);

	// ── Unified RAF loop ──
	const rafRef = useRef<number>();
	const frameCount = useRef(0);

	const animate = useCallback(() => {
		if (!activeRing) {
			// State 1 animations
			for (let i = 0; i < particleAngles.current.length; i++) {
				particleAngles.current[i] += ambientParticles[i].speed;
			}
			for (const rank of ["E", "D", "C", "B", "A"] as const) {
				ringRotations.current[rank] += RING_SPEEDS[rank];
			}
			// Random locked flicker
			if (frameCount.current % 60 === 0 && Math.random() < 0.3) {
				const allLocked: string[] = [];
				for (const rank of RANKS) {
					for (const n of (projects[rank] || [])) {
						if (n.userState === "locked" && n.isRequired) allLocked.push(n.id);
					}
				}
				if (allLocked.length > 0) {
					const pick = allLocked[Math.floor(Math.random() * allLocked.length)];
					setFlickerNodeId(pick);
					if (flickerTimeout.current) clearTimeout(flickerTimeout.current);
					flickerTimeout.current = setTimeout(() => setFlickerNodeId(null), 150);
				}
			}
			// Background particles — cursor-reactive
			const smx = svgMousePos.x;
			const smy = svgMousePos.y;
			for (const bp of bgParticles.current) {
				const dx = bp.x - smx;
				const dy = bp.y - smy;
				const dist = Math.sqrt(dx*dx + dy*dy);
				
				if (dist < 100) {
					// Strong repulsion when close
					const force = (1 - dist/100) * 4;
					const angle = Math.atan2(dy, dx);
					bp.vx += Math.cos(angle) * force;
					bp.vy += Math.sin(angle) * force;
				} else if (dist < 250) {
					// Gentle attraction when medium distance (magnetic feel)
					const force = (1 - dist/250) * 0.4;
					const angle = Math.atan2(-dy, -dx);
					bp.vx += Math.cos(angle) * force;
					bp.vy += Math.sin(angle) * force;
				}

				bp.vx *= 0.94; // Slightly less friction for more "floaty" feel
				bp.vy *= 0.94;
				bp.vx += (bp.baseVx - bp.vx) * 0.015; // Return to base velocity
				bp.vy += (bp.baseVy - bp.vy) * 0.015;
				
				bp.x += bp.vx; bp.y += bp.vy;
				
				// Wrap around with a bit of padding
				if (bp.x > 550) bp.x = -550; if (bp.x < -550) bp.x = 550;
				if (bp.y > 550) bp.y = -550; if (bp.y < -550) bp.y = 550;
			}
			// Cursor trail aging
			const ct = cursorTrail.current;
			for (let i = ct.length - 1; i >= 0; i--) {
				ct[i].age++;
				if (ct[i].age > 20) ct.splice(i, 1);
			}
		} else {
			// State 2 animations
			const ps = s2Particles.current;
			for (const p of ps) {
				p.life++;
				if (activeRing === "E") {
					p.x += p.vx; p.y += p.vy;
					if (p.x > 500) p.x = -500; if (p.x < -500) p.x = 500;
					if (p.y > 500) p.y = -500; if (p.y < -500) p.y = 500;
				} else if (activeRing === "D") {
					p.x += p.vx; p.y += p.vy;
					if (p.life >= p.maxLife) {
						p.x = (Math.random()-0.5)*900; p.y = (Math.random()-0.5)*900;
						const a = Math.random()*Math.PI*2; const sp = 2+Math.random()*2;
						p.vx = Math.cos(a)*sp; p.vy = Math.sin(a)*sp;
						p.life = 0; p.maxLife = 30+Math.floor(Math.random()*30);
					}
				} else if (activeRing === "C") {
					p.angle += p.rotSpeed;
				} else if (activeRing === "B") {
					p.y += (p.fallSpeed || 0.2);
					p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0.5);
					p.x = (p.baseX || 0) + Math.sin(frameCount.current * (p.swaySpeed || 0.02) + (p.swayOffset || 0)) * (p.swayAmplitude || 20);
					if (p.y > 500) { p.y = -500; const nx = (Math.random()-0.5)*800; p.x = nx; p.baseX = nx; }
				} else if (activeRing === "A") {
					p.y -= (p.speed || 0.5);
					p.x += Math.sin(frameCount.current * 0.05 + (p.offset || 0)) * 0.3;
					p.opacity = Math.max(0, 0.6 * (1 - (200 - p.y) / 700));
					if (p.trail) { p.trail.unshift({x:p.x,y:p.y}); if(p.trail.length>8) p.trail.pop(); }
					if (p.opacity < 0.05 || p.y < -500) { p.y = 200+Math.random()*250; p.x = (Math.random()-0.5)*900; p.opacity = 0.6; p.trail = [{x:p.x,y:p.y}]; }
				} else if (activeRing === "S") {
					// Spiral gravity particles — chaotic
					const or = p.orbitRadius || 150;
					const decayRate = p.selfRotationSpeed || 0.08;
					p.orbitAngle = (p.orbitAngle || 0) + (p.orbitSpeed || 0.0008);
					p.orbitRadius = or - decayRate;
					p.swaySpeed = (p.swaySpeed || 0) + (p.swayAmplitude || 0.0001);
					p.rotation = Math.max(0, Math.min(1, 1 - ((p.orbitRadius || 0) / 400)));
					const eRatio = p.fallSpeed || 0.7;
					const eRot = p.swaySpeed || 0;
					const rawX = Math.cos(p.orbitAngle || 0) * (p.orbitRadius || 0) * eRatio;
					const rawY = Math.sin(p.orbitAngle || 0) * (p.orbitRadius || 0);
					let rx = rawX * Math.cos(eRot) - rawY * Math.sin(eRot);
					let ry = rawX * Math.sin(eRot) + rawY * Math.cos(eRot);
					// Chaos — thrash more as particles approach center
					const cAmp = p.baseX || 0;
					const cFactor = 1 - (p.orbitRadius || 0) / 400;
					rx += Math.sin(frameCount.current * 0.3 + (p.orbitAngle || 0)) * cAmp * cFactor;
					ry += Math.cos(frameCount.current * 0.2 + (p.orbitAngle || 0)) * cAmp * cFactor;
					p.x = rx; p.y = ry;
					// Flash and shockwave
					if ((p.rotationSpeed || 0) > 0) {
						p.rotationSpeed = (p.rotationSpeed || 0) - 1;
						if ((p.rotationSpeed || 0) <= 0) {
							p.orbitRadius = 180 + Math.random() * 220;
							p.orbitAngle = Math.random() * Math.PI * 2;
							p.rotation = 0;
						}
					} else if ((p.orbitRadius || 0) < 58) {
						p.rotationSpeed = 3;
						if (shockwaves.current.length < 3) shockwaves.current.push({life:0,maxLife:8});
					}
				}
			}

			// State 2 slow rotation
			if (!state2Paused.current) state2Rotation.current += 0.00015;

			// Ring pulse
			if (ringPulseActive.current) {
				ringPulseProgress.current += 1/36; // ~600ms at 60fps
				if (ringPulseProgress.current >= 1) { ringPulseActive.current = false; ringPulseProgress.current = 0; }
			}

			// Affinity dot progress
			for (const key in affinityProgress.current) {
				const a = affinityProgress.current[key];
				a.progress += 0.003 * a.dir;
				if (a.progress >= 1) { a.progress = 1; a.dir = -1; }
				if (a.progress <= 0) { a.progress = 0; a.dir = 1; }
			}

			// Explosion particles
			const ep = explosionParticles.current;
			for (let i = ep.length - 1; i >= 0; i--) {
				ep[i].x += ep[i].vx; ep[i].y += ep[i].vy; ep[i].life++;
				if (ep[i].life >= ep[i].maxLife) ep.splice(i, 1);
			}

			// A rank burst particles
			if (activeRing === "A") {
				const ab = aBurstParticles.current;
				for (let i = ab.length - 1; i >= 0; i--) {
					ab[i].x += ab[i].vx; ab[i].y += ab[i].vy; ab[i].life++;
					if (ab[i].life >= ab[i].maxLife) ab.splice(i, 1);
				}
				if (Date.now() - lastBurstTime.current > 4000 + Math.random() * 1000) {
					lastBurstTime.current = Date.now();
					const ba = Math.random() * Math.PI * 2;
					const br = ringRadii["A"] || 80;
					const bx = CX + Math.cos(ba) * br;
					const by = CY + Math.sin(ba) * br;
					for (let j = 0; j < 6; j++) {
						const a2 = (Math.PI * 2 * j) / 6;
						const sp = 3 + Math.random() * 2;
						ab.push({x:bx,y:by,vx:Math.cos(a2)*sp,vy:Math.sin(a2)*sp,life:0,maxLife:20,size:1.5+Math.random()});
					}
				}
				if (frameCount.current % 30 === 0) setHeatSeed(Math.floor(Date.now()/500) % 100);
			}

			// S rank Event Horizon effects
			if (activeRing === "S") {
				sShimmerAngle.current += 0.001;
				vortexAngle.current += 0.004;
				aberrationAngle.current += 0.02;
				const now = Date.now();
				// Shockwaves
				for (let i = shockwaves.current.length - 1; i >= 0; i--) {
					shockwaves.current[i].life++;
					if (shockwaves.current[i].life >= shockwaves.current[i].maxLife) shockwaves.current.splice(i,1);
				}
				// Crackle — aggressive
				const cs = crackleState.current;
				const crElapsed = now - cs.lastCrackle;
				if (!cs.active && crElapsed > cs.nextCrackle) {
					cs.active = true; cs.progress = 0; cs.lastCrackle = now;
					cs.nextCrackle = 600 + Math.random() * 800;
					cs.intensity = crElapsed > 7000 ? 3 : 1;
				}
				if (cs.active) { cs.progress += 0.067; if (cs.progress >= 1) cs.active = false; }
				// Crackle segments — regenerate every 3 frames
				if (frameCount.current % 3 === 0) {
					const segs: typeof crackleSegments.current = [];
					const nSegs = 3 + Math.floor(Math.random() * 3);
					for (let i=0;i<nSegs;i++) segs.push({startAngle:Math.random()*Math.PI*2, arcLength:0.1+Math.random()*0.3, opacity:Math.random()*0.8, strokeW:1+Math.random()});
					crackleSegments.current = segs;
				}
				// Energy tendrils — regenerate every 5 frames
				if (frameCount.current % 5 === 0) {
					const ts: typeof energyTendrils.current = [];
					const nT = 8 + Math.floor(Math.random() * 5);
					for (let i=0;i<nT;i++) ts.push({angle:Math.random()*Math.PI*2, length:10+Math.random()*20, opacity:0.1+Math.random()*0.2});
					energyTendrils.current = ts;
				}
				// Gravity lens seed — fast
				if (frameCount.current % 9 === 0) setGravSeed(Math.floor(Date.now()/150) % 100);
				// Lightning — frequent and violent
				const ls = lightningState.current;
				for (let i = ls.arcs.length - 1; i >= 0; i--) {
					ls.arcs[i].opacity -= 0.04;
					if (ls.arcs[i].opacity <= 0) ls.arcs.splice(i, 1);
				}
				const lElapsed = now - ls.lastFire;
				if (lElapsed > ls.nextFire) {
					const sNodes = projects["S"] || [];
					if (sNodes.length >= 2) {
						const iA = Math.floor(Math.random() * sNodes.length);
						let iB = Math.floor(Math.random() * sNodes.length);
						while (iB === iA && sNodes.length > 1) iB = Math.floor(Math.random() * sNodes.length);
						const posA = nodePositions.get(sNodes[iA].id);
						const posB = nodePositions.get(sNodes[iB].id);
						if (posA && posB) {
							const genPath = (x1:number,y1:number,x2:number,y2:number,segs:number) => {
								const pts: {x:number,y:number}[] = [{x:x1,y:y1}];
								const d = Math.hypot(x2-x1,y2-y1);
								for (let s=1;s<segs;s++) {
									const t = s/segs;
									const px = x1+(x2-x1)*t + (-(y2-y1)/d)*(Math.random()-0.5)*50;
									const py = y1+(y2-y1)*t + ((x2-x1)/d)*(Math.random()-0.5)*50;
									pts.push({x:px,y:py});
								}
								pts.push({x:x2,y:y2});
								return pts;
							};
							// Multi-hop: 30% chance
							let mainPath: {x:number,y:number}[];
							if (Math.random() < 0.3) {
								const mx = (posA.x+posB.x)/2 + (Math.random()-0.5)*120;
								const my = (posA.y+posB.y)/2 + (Math.random()-0.5)*120;
								mainPath = [...genPath(posA.x,posA.y,mx,my,4), ...genPath(mx,my,posB.x,posB.y,4).slice(1)];
							} else {
								mainPath = genPath(posA.x,posA.y,posB.x,posB.y,8);
							}
							const isMajor = lElapsed > 7000;
							const branches: {x:number,y:number}[][] = [];
							if (isMajor && mainPath.length > 4) {
								const mid = mainPath[Math.floor(mainPath.length/2)];
								for (let b=0;b<3;b++) {
									branches.push(genPath(mid.x,mid.y,mid.x+(Math.random()-0.5)*80,mid.y+(Math.random()-0.5)*80,4));
								}
							}
							ls.arcs.push({ path:mainPath, opacity:1, nodeA:sNodes[iA].id, nodeB:sNodes[iB].id, isMajor, branches });
						}
					}
					ls.lastFire = now;
					ls.nextFire = 800 + Math.random() * 1200;
				}
				// Inward star drift
				const stars = (constellations["S"] || []) as any[];
				for (const star of stars) {
					const sd = Math.hypot(star.x, star.y);
					if (sd > 0) {
						star.x -= (star.x / sd) * 0.02;
						star.y -= (star.y / sd) * 0.02;
					}
					if (sd < 20) {
						const rAngle = Math.random() * Math.PI * 2;
						const rDist = 350 + Math.random() * 100;
						star.x = Math.cos(rAngle) * rDist;
						star.y = Math.sin(rAngle) * rDist;
					}
				}
			}
		}

		frameCount.current++;
		if (frameCount.current % 3 === 0) {
			setAnimFrame(f => f + 1);
		}
		rafRef.current = requestAnimationFrame(animate);
	}, [ambientParticles, projects, activeRing, svgMousePos]);

	useEffect(() => {
		if (perfMode) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			return;
		}
		rafRef.current = requestAnimationFrame(animate);
		return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
	}, [animate, perfMode]);

	// Init State 2 particles on ring change
	useEffect(() => {
		if (!activeRing || perfMode) { s2Particles.current = []; aBurstParticles.current = []; return; }
		s2Particles.current = generateS2Particles(activeRing);
		state2Rotation.current = 0;
		affinityProgress.current = {};
		lastBurstTime.current = Date.now();
		sShimmerAngle.current = 0;
		vortexAngle.current = 0;
		aberrationAngle.current = 0;
		shockwaves.current = [];
		crackleSegments.current = [];
		energyTendrils.current = [];
		crackleState.current = { active: false, progress: 0, intensity: 1, lastCrackle: Date.now(), nextCrackle: 600 + Math.random() * 800 };
		lightningState.current = { arcs: [], lastFire: Date.now(), nextFire: 800 + Math.random() * 1200 };
		cursorTrail.current = [];
	}, [activeRing, perfMode, generateS2Particles]);

	// Ring pulse trigger on hover
	useEffect(() => {
		if (hoveredNode && activeRing) {
			ringPulseActive.current = true;
			ringPulseProgress.current = 0;
		}
		state2Paused.current = !!hoveredNode;
	}, [hoveredNode, activeRing]);

	const ringRadii = useMemo(() => {
		const RANKS_OUTER_TO_INNER = ["E", "D", "C", "B", "A"] as const;
		const MIN_RADIUS = 80;
		const MAX_RADIUS = 420;
		const range = MAX_RADIUS - MIN_RADIUS;
		const step = range / (RANKS_OUTER_TO_INNER.length - 1);
		
		const r: Record<string, number> = {};
		RANKS_OUTER_TO_INNER.forEach((rank, i) => {
			r[rank] = MAX_RADIUS - (i * step);
		});
		r["S"] = MIN_RADIUS - 30; // S lives in center
		return r;
	}, []);

	const getsvgPoint = useCallback((clientX: number, clientY: number): { x: number, y: number } => {
		const svg = svgRef.current;
		if (!svg) return { x: 0, y: 0 };
		const pt = svg.createSVGPoint();
		pt.x = clientX;
		pt.y = clientY;
		const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
		
		// Map activeRing to radius. S is 180 in state 2 focus.
		const rad = activeRing === "S" ? 180 : ringRadii[activeRing as string];
		const currentScale = activeRing ? Math.min(5, 400 / rad) : 1;
		
		return { x: svgP.x / (currentScale || 1), y: svgP.y / (currentScale || 1) };
	}, [activeRing, ringRadii]);

	const nodePositions = useMemo(() => {
		const pos = new Map<string, { x: number; y: number }>();
		RANKS.forEach((rank, rankIdx) => {
			const nodes = projects[rank] || [];
			const radius = rank === "S" ? 180 : ringRadii[rank];
			nodes.forEach((node, nodeIdx) => {
				const total = nodes.length || 1;
				const angle = (2 * Math.PI * nodeIdx) / total - Math.PI / 2 + rankIdx * 0.25;
				pos.set(node.id, {
					x: CX + radius * Math.cos(angle),
					y: CY + radius * Math.sin(angle),
				});
			});
		});
		return pos;
	}, [projects, ringRadii]);

	// Detect node completion explosions
	useEffect(() => {
		for (const rank of RANKS) {
			for (const n of (projects[rank] || [])) {
				const prev = prevNodeStates.current[n.id];
				if (prev && prev !== "completed" && n.userState === "completed") {
					const pos = nodePositions.get(n.id);
					if (pos) {
						for (let i = 0; i < 12; i++) {
							const a = (Math.PI * 2 * i) / 12;
							const sp = 2 + Math.random() * 2;
							explosionParticles.current.push({ id: `${n.id}-exp-${i}-${Date.now()}`, x: pos.x, y: pos.y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 0, maxLife: 40, size: 1.5+Math.random()*1.5, color: RANK_COLOURS[rank] });
						}
					}
				}
				prevNodeStates.current[n.id] = n.userState;
			}
		}
	}, [projects, nodePositions]);

	// ── Sparkle intervals for completed nodes ──
	useEffect(() => {
		if (perfMode) return;
		const timers = sparkleTimers.current;
		for (const rank of RANKS) {
			for (const n of (projects[rank] || [])) {
				if (n.userState === "completed" && !timers[n.id]) {
					const pos = nodePositions.get(n.id);
					if (!pos) continue;
					const fire = () => {
						const angle = Math.random() * Math.PI * 2;
						const dist = 15 + Math.random() * 10;
						const sparkle = {
							id: n.id + "-" + Date.now(),
							x: pos.x, y: pos.y,
							sx: Math.cos(angle) * dist,
							sy: Math.sin(angle) * dist,
						};
						setSparkles(prev => [...prev, sparkle]);
						setTimeout(() => setSparkles(prev => prev.filter(s => s.id !== sparkle.id)), 800);
						timers[n.id] = setTimeout(fire, 3000 + Math.random() * 5000);
					};
					timers[n.id] = setTimeout(fire, 1000 + Math.random() * 4000);
				}
			}
		}
		return () => { Object.values(timers).forEach(t => clearTimeout(t)); sparkleTimers.current = {}; };
	}, [perfMode, projects, nodePositions]);

	const ringArcs = useMemo(() => {
		const arcs: Record<string, { req: number, choice: number }> = {};
		RANKS.forEach(rank => {
			const nodes = projects[rank] || [];
			const reqNodes = nodes.filter(n => n.isRequired);
			const totalNeeded = rankRequirements[rank] || 0;
			
			const completedReq = reqNodes.filter(n => n.userState === "completed").length;
			const totalCompleted = nodes.filter(n => n.userState === "completed").length;
			const completedChoice = Math.max(0, totalCompleted - completedReq);
			
			const reqPct = totalNeeded > 0 ? Math.min(1, completedReq / totalNeeded) : 1;
			const choicePct = totalNeeded > 0 ? Math.min(1, completedChoice / totalNeeded) : 0;
			
			arcs[rank] = { req: reqPct, choice: choicePct };
		});
		return arcs;
	}, [projects, rankRequirements]);

	const surgeState = useRef({ ringOpacity: 0.7, ringExpansion: 40, sTextOpacity: 0 });
	const [surgeFlag, setSurgeFlag] = useState(0); // 0: normal, 1: expanding, 2: settling

	useEffect(() => {
		const aNodes = projects["A"] || [];
		const aReqNodes = aNodes.filter(n => n.isRequired);
		const aReqCompleted = aReqNodes.filter(n => n.userState === "completed").length;
		const aReqTotalToPass = rankRequirements["A"] || 2;
		
		if (aReqCompleted >= aReqTotalToPass && RANK_VALUES[userRank] >= RANK_VALUES.A) {
			if (typeof window !== "undefined") {
				const isTriggered = localStorage.getItem("s_ring_triggered");
				if (!isTriggered) {
					// Surge Animation Sequence
					setTriggerS(true);
					setSurgeFlag(1); // Start expansion
					playSFX("achievement");

					setTimeout(() => setSurgeFlag(2), 500); // Surge rings
					setTimeout(() => setSurgeFlag(3), 800); // S text in
					setTimeout(() => {
						setSurgeFlag(0);
						localStorage.setItem("s_ring_triggered", "true");
					}, 2500);
				}
			}
		}
	}, [projects, rankRequirements, userRank, playSFX]);

	useEffect(() => {
		if (activeRing) {
			if (activeRing === "S") {
				setBgTint("rgba(10, 0, 20, 0.85)");
			} else {
				setBgTint(RANK_COLOURS[activeRing] + "1A");
			}
		} else {
			setBgTint("transparent");
		}
	}, [activeRing]);

	const isSUnlocking = triggerS;
	const isSUnlocked = userRank === "S" || (typeof window !== "undefined" && localStorage.getItem("s_ring_triggered") === "true") || triggerS;

	const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
	const handleWheel = useCallback((e: WheelEvent) => {
		e.preventDefault();
		if (activeRing) {
			if (e.deltaY > 20) {
				setActiveRing(null);
				playSFX("button");
			}
			return;
		}
		// Ring detection on wheel (if enabled)
		if (e.deltaY < -20) {
			const pos = getsvgPoint(e.clientX, e.clientY);
			const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
			let closest: RankStr = "E";
			let minDiff = Infinity;
			for (const r of RANKS) {
				if (r === "S" && !isSUnlocked) continue;
				const rRad = r === "S" ? 180 : ringRadii[r];
				const diff = Math.abs(rRad - dist);
				if (diff < minDiff) { minDiff = diff; closest = r as RankStr; }
			}
			if (minDiff < 30) {
				setActiveRing(closest);
				playSFX("button");
			}
		}
	}, [activeRing, playSFX, getsvgPoint, ringRadii, isSUnlocked]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => el.removeEventListener("wheel", handleWheel);
	}, [handleWheel]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && activeRing) {
				setActiveRing(null);
				playSFX("button");
			}
			if (activeRing) {
				const idx = RANKS.indexOf(activeRing);
				if (e.key === "ArrowLeft" && idx < RANKS.length - 1) {
					const next = RANKS[idx + 1] as RankStr;
					if (next !== "S" || isSUnlocked) setActiveRing(next);
				}
				if (e.key === "ArrowRight" && idx > 0) {
					setActiveRing(RANKS[idx - 1] as RankStr);
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeRing, isSUnlocked, playSFX]);

	const touchStartX = useRef(0);
	const touchState = useRef({
		touches: 0,
		initialDist: 0,
		initialMidX: 0,
		initialMidY: 0,
	});

	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			const d = Math.hypot(
				e.touches[0].clientX - e.touches[1].clientX,
				e.touches[0].clientY - e.touches[1].clientY
			);
			touchState.current.initialDist = d;
			touchState.current.touches = 2;
		} else {
			touchStartX.current = e.touches[0].clientX;
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (touchState.current.touches === 2 && !activeRing) {
			const d = Math.hypot(
				e.touches[0].clientX - e.touches[1].clientX,
				e.touches[0].clientY - e.touches[1].clientY
			);
			
			if (d < touchState.current.initialDist * 0.85) {
				const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
				const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
				
				const rect = containerRef.current?.getBoundingClientRect();
				if (!rect) return;
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				const mouseX = midX - centerX;
				const mouseY = midY - centerY;
				
				const scaleX = 1000 / rect.width;
				const scaleY = 1000 / rect.height;
				const svgX = mouseX * scaleX;
				const svgY = mouseY * scaleY;
				
				const dist = Math.sqrt(svgX * svgX + svgY * svgY);
				let closest: RankStr = "E";
				let minDiff = Infinity;
				for (const r of RANKS) {
					if (r === "S" && !isSUnlocked) continue;
					const diff = Math.abs(ringRadii[r] - dist);
					if (diff < minDiff) {
						minDiff = diff;
						closest = r as RankStr;
					}
				}
				setActiveRing(closest);
				touchState.current.touches = 0;
				playSFX("button");
			}
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (touchState.current.touches === 2) {
			touchState.current.touches = 0;
			return;
		}
		if (!activeRing) return;
		const diff = e.changedTouches[0].clientX - touchStartX.current;
		const idx = RANKS.indexOf(activeRing);
		if (diff > 50 && idx > 0) setActiveRing(RANKS[idx - 1] as RankStr);
		if (diff < -50 && idx < RANKS.length - 1) {
			const next = RANKS[idx + 1] as RankStr;
			if (next !== "S" || isSUnlocked) setActiveRing(next);
		}
	};

	const nodeRadius = (state: string, isState2: boolean) => {
		if (isState2) {
			switch (state) {
				case "completed": return 10;
				case "active": return 11;
				case "available": return 9;
				default: return 7;
			}
		}
		switch (state) {
			case "completed": return 8;
			case "active": return 8;
			case "available": return 6;
			default: return 4;
		}
	};

	const transformStyle = useMemo(() => {
		if (!activeRing) return `translate(0px, 0px) scale(1)`;
		const rad = activeRing === "S" ? 180 : ringRadii[activeRing];
		const targetRadius = 400;
		const zoom = Math.min(5, targetRadius / rad);
		return `translate(0px, 0px) scale(${zoom})`;
	}, [activeRing, ringRadii]);

	const affinityLines = useMemo(() => {
		if (!activeRing || !hoveredNode) return [];
		const res: {x1:number, y1:number, x2:number, y2:number}[] = [];
		const activeNodes = projects[activeRing] || [];
		if (!activeNodes.find(n => n.id === hoveredNode.id)) return [];
		
		for (const n of activeNodes) {
			if (n.id === hoveredNode.id) continue;
			const shares = n.skillTags.some(t => hoveredNode.skillTags.includes(t));
			if (shares) {
				const p1 = nodePositions.get(hoveredNode.id);
				const p2 = nodePositions.get(n.id);
				if (p1 && p2) res.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
			}
		}
		return res;
	}, [activeRing, hoveredNode, projects, nodePositions]);

	const activeStats = useMemo(() => {
		if (!activeRing) return null;
		const nodes = projects[activeRing] || [];
		const totalNeeded = rankRequirements[activeRing] || 0;
		const reqNodes = nodes.filter(n => n.isRequired);
		const compReq = reqNodes.filter(n => n.userState === "completed").length;
		const compTot = nodes.filter(n => n.userState === "completed").length;
		
		const reqRem = Math.max(0, reqNodes.length - compReq);
		const choicesRem = Math.max(0, totalNeeded - compTot);
		return { reqRem, choicesRem };
	}, [activeRing, projects, rankRequirements]);

	// ── Background Constellations (State 2) ──
	const constellations = useMemo(() => {
		const result: Record<string, {x:number,y:number,r:number,opacity:number}[]> = {};
		const densities: Record<string,number> = { E:30, D:50, C:60, B:70, A:80, S:120 };
		RANKS.forEach(rank => {
			result[rank] = Array.from({length: densities[rank]}, () => ({
				x: (Math.random()-0.5)*900, y: (Math.random()-0.5)*900,
				r: 0.5+Math.random()*1, opacity: 0.05+Math.random()*0.15,
			}));
		});
		return result;
	}, []);

	return (
		<div 
			ref={containerRef}
			className="skill-tree-container relative w-full overflow-hidden border border-border-color bg-panel/30 rounded-[2rem] shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			style={{ 
				height: "calc(100vh - 200px)", 
				outline: "none",
				backgroundColor: bgTint,
				transition: "background-color 0.5s ease"
			}}
			tabIndex={0}
			onClick={() => activeRing && setActiveRing(null)}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onMouseMove={(e) => {
				setMousePos({ x: e.clientX, y: e.clientY });
				const pos = getsvgPoint(e.clientX, e.clientY);
				setSvgMousePos(pos);
				if (!activeRing) {
					cursorTrail.current.unshift({ x: pos.x, y: pos.y, age: 0 });
					if (cursorTrail.current.length > 12) cursorTrail.current.pop();
				}
			}}
		>
			<style>{`
				.skill-tree-container {
					--rank-e: #777777;
					--rank-d: #0055AA;
					--rank-c: #008822;
					--rank-b: #B8860B;
					--rank-a: #CC4400;
					--rank-s: #9900CC;
				}
				:global(.dark) .skill-tree-container, .dark .skill-tree-container {
					--rank-e: #888888;
					--rank-d: #44AAFF;
					--rank-c: #44FF88;
					--rank-b: #FFD700;
					--rank-a: #FF6B00;
					--rank-s: #CC44FF;
				}
				@keyframes node-pulse { 0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px var(--glow-col)); } 50% { opacity: 0.7; filter: drop-shadow(0 0 16px var(--glow-col)); } }
				@keyframes s-unlock { 0% { opacity: 0.1; filter: brightness(0.5); } 100% { opacity: 1; filter: brightness(1); } }
				@keyframes rc-heartbeat {
					0%, 100% { r: 40; opacity: 1; }
					15% { r: 43; opacity: 0.9; }
					30% { r: 40; opacity: 1; }
					45% { r: 42; opacity: 0.95; }
					60% { r: 40; opacity: 1; }
				}
				@keyframes ring-breathe {
					0%, 100% { opacity: 0.7; stroke-width: 1.5px; }
					50% { opacity: 0.9; stroke-width: 2px; }
				}
				@keyframes node-shimmer {
					0% { stroke-dashoffset: 0; }
					100% { stroke-dashoffset: -100; }
				}
				.node-completed { animation: node-pulse 3s ease-in-out infinite; }
				.node-available { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
				.node-available:hover { transform: scale(1.5); transform-origin: center; transform-box: fill-box; }
				.arc-transition { transition: stroke-dasharray 1s ease-out; }
				@keyframes s-unlock-ring { 0% { r: 40px; opacity: 1; } 100% { r: 600px; opacity: 0; } }
				@keyframes s-color-flash { 0%, 100% { stroke-opacity: 0.7; } 50% { stroke-opacity: 1; } }
				.s-unlock-anim { animation: s-unlock 3s ease-out forwards; }
				.s-expanding-ring { animation: s-unlock-ring 1.5s ease-out forwards; }
				.s-flash-rings { animation: s-color-flash 2s ease-out forwards; }
				.ring-dim { opacity: 0.08; transition: opacity 0.5s ease; }
				.ring-full { opacity: 1; transition: opacity 0.5s ease; }
				.node-active-pulse { animation: node-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
				.rc-heartbeat { animation: rc-heartbeat 4s ease-in-out infinite; }
				.ring-E { animation: ring-breathe 6s ease-in-out infinite; }
				.ring-D { animation: ring-breathe 6s ease-in-out infinite 1s; }
				.ring-C { animation: ring-breathe 6s ease-in-out infinite 2s; }
				.ring-B { animation: ring-breathe 6s ease-in-out infinite 3s; }
				.ring-A { animation: ring-breathe 6s ease-in-out infinite 4s; }
				.node-shimmer { animation: node-shimmer 3s linear infinite; }
				@keyframes rank-aura {
					0%, 100% { r: 52; stroke-opacity: 0.15; }
					50% { r: 58; stroke-opacity: 0.05; }
				}
				.particle-glow {
					filter: blur(1px);
					mix-blend-mode: plus-lighter;
				}
				:global(.dark) .particle-glow {
					filter: blur(1.5px) drop-shadow(0 0 3px var(--glow-col));
				}
				.rank-aura { animation: rank-aura 3s ease-in-out infinite; }
				@keyframes dash-rotate {
					from { stroke-dashoffset: 0; }
					to { stroke-dashoffset: -60; }
				}
				.node-available-ring { animation: dash-rotate 8s linear infinite; stroke-dasharray: 15 5; }
				@keyframes sparkle-out {
					0% { r: 2; opacity: 0.8; }
					100% { r: 0.5; opacity: 0; transform: translate(var(--sx), var(--sy)); }
				}
				.sparkle-particle { animation: sparkle-out 0.8s ease-out forwards; }
			`}</style>

			<div className="absolute inset-0 flex items-center justify-center">
				<svg ref={svgRef} viewBox="-500 -500 1000 1000" className="w-full h-full overflow-visible">
					<defs>
						<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="4" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						{!perfMode && (["E","D","C","B","A"] as const).map(rank => (
							<radialGradient key={`nebula-${rank}`} id={`nebula-${rank}`} cx="50%" cy="50%" r="50%">
								<stop offset="0%" stopColor={RANK_COLOURS[rank]} stopOpacity="0" />
								<stop offset="85%" stopColor={RANK_COLOURS[rank]} stopOpacity="0.04" />
								<stop offset="100%" stopColor={RANK_COLOURS[rank]} stopOpacity="0" />
							</radialGradient>
						))}
						{/* Cursor shadow filter for State 2 */}
						<filter id="node-cursor-shadow" x="-50%" y="-50%" width="200%" height="200%">
							<feDropShadow dx="0" dy="0" stdDeviation="2" floodOpacity="0.4" />
						</filter>
						{/* Heat distortion for A rank */}
						{activeRing === "A" && !perfMode && (
							<filter id="heat-distort" x="-20%" y="-20%" width="140%" height="140%">
								<feTurbulence type="turbulence" baseFrequency="0.02" numOctaves={2} result="noise" seed={heatSeed} />
								<feDisplacementMap in="SourceGraphic" in2="noise" scale={2} xChannelSelector="R" yChannelSelector="G" />
							</filter>
						)}
						{/* Gravitational lensing for S rank — violent */}
						{activeRing === "S" && !perfMode && (
							<filter id="gravity-lens" x="-20%" y="-20%" width="140%" height="140%">
								<feTurbulence type="turbulence" baseFrequency="0.02 0.01" numOctaves={3} seed={gravSeed} result="noise" />
								<feDisplacementMap in="SourceGraphic" in2="noise" scale={8} xChannelSelector="R" yChannelSelector="G" />
							</filter>
						)}
						{/* S rank vignette */}
						{activeRing === "S" && !perfMode && (
							<radialGradient id="s-vignette" cx="50%" cy="50%" r="50%">
								<stop offset="0%" stopColor="rgb(10,0,20)" stopOpacity="0" />
								<stop offset="60%" stopColor="rgb(10,0,20)" stopOpacity="0.15" />
								<stop offset="100%" stopColor="rgb(10,0,20)" stopOpacity={crackleState.current.active && crackleState.current.intensity === 3 ? "0.3" : "0.7"} />
							</radialGradient>
						)}
					</defs>

					<g style={{ transform: transformStyle, transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)", transformOrigin: "0 0" }}>
						{surgeFlag === 1 && <circle cx={CX} cy={CY} fill="none" stroke={RANK_COLOURS["S"]} strokeWidth={4} className="s-expanding-ring" />}

						{/* Background particles — State 1, behind everything */}
						{!activeRing && !perfMode && bgParticles.current.map((p, i) => {
							const pulse = Math.sin(frameCount.current * p.pulseSpeed + p.pulseOffset);
							const currentOpacity = p.opacity * (0.6 + pulse * 0.4);
							const currentSize = p.size * (0.8 + pulse * 0.2);
							
							return (
								<circle 
									key={`bgp-${i}`} 
									cx={p.x} 
									cy={p.y} 
									r={currentSize} 
									fill={p.color} 
									opacity={currentOpacity} 
									className="particle-glow"
									style={{ 
										pointerEvents: "none",
										"--glow-col": p.color 
									} as any} 
								/>
							);
						})}

						{/* Cursor trail — State 1 */}
						{!activeRing && !perfMode && cursorTrail.current.map((point, i) => {
							const progress = point.age / 20;
							const opacity = (1 - progress) * 0.5;
							const size = (1 - progress) * 3 + 0.5;
							const distFromCenter = Math.sqrt(point.x ** 2 + point.y ** 2);
							let nearestRank = "E" as string;
							let minDiff = Infinity;
							RANKS.forEach(r => {
								if (r === "S" && !isSUnlocked) return;
								const diff = Math.abs(ringRadii[r] - distFromCenter);
								if (diff < minDiff) { minDiff = diff; nearestRank = r; }
							});
							return <circle key={`trail-${i}`} cx={point.x} cy={point.y} r={size} fill={RANK_COLOURS[nearestRank as keyof typeof RANK_COLOURS]} opacity={opacity} filter="blur(2px)" className="particle-glow" style={{ pointerEvents: "none", "--glow-col": RANK_COLOURS[nearestRank as keyof typeof RANK_COLOURS] } as any} />;
						})}

						{/* Nebula atmosphere behind rings */}
						{!perfMode && (["E","D","C","B","A"] as const).map(rank => (
							<circle key={`nebula-bg-${rank}`} cx={CX} cy={CY} r={ringRadii[rank]} fill={`url(#nebula-${rank})`} style={{ pointerEvents: "none" }} />
						))}

						{/* Background Constellations — State 2 */}
						{activeRing && !perfMode && constellations[activeRing]?.map((star, i) => (
							<circle key={`star-${i}`} cx={star.x} cy={star.y} r={star.r} fill={RANK_COLOURS[activeRing]} opacity={star.opacity} style={{ pointerEvents: "none" }} />
						))}

						{/* State 2 Rank Particles */}
						{activeRing && !perfMode && s2Particles.current.map((p, i) => {
							if (activeRing === "D") {
								const fadeOp = p.opacity * (1 - p.life / p.maxLife);
								return <line key={`s2p-${i}`} x1={p.x} y1={p.y} x2={p.x - p.vx * 3} y2={p.y - p.vy * 3} stroke="#44AAFF" strokeWidth={1} opacity={fadeOp} style={{ pointerEvents: "none" }} />;
							}
							if (activeRing === "C") {
								const cr = (ringRadii["C"] || 210) + (Math.sin(i * 2.33) * 15);
								const cx = CX + cr * Math.cos(p.angle);
								const cy = CY + cr * Math.sin(p.angle);
								return <circle key={`s2p-${i}`} cx={cx} cy={cy} r={p.size} fill="#44FF88" opacity={p.opacity} style={{ pointerEvents: "none" }} />;
							}
							if (activeRing === "B") {
								return <ellipse key={`s2p-${i}`} cx={p.x} cy={p.y} rx={3} ry={1.5} fill="#FFD700" opacity={p.opacity} transform={`rotate(${p.rotation || 0} ${p.x} ${p.y})`} style={{ pointerEvents: "none" }} />;
							}
							if (activeRing === "A") {
								return (
									<g key={`s2p-${i}`} style={{ pointerEvents: "none" }}>
										{p.trail?.map((tp, ti) => (
											<circle key={`tr-${i}-${ti}`} cx={tp.x} cy={tp.y} r={Math.max(0.3, 1 - ti * 0.1)} fill={ti < 3 ? "#FFFFFF" : ti < 5 ? "#FFD700" : "#FF6B00"} opacity={p.opacity * (1 - ti/8) * 0.6} />
										))}
										<circle cx={p.x} cy={p.y} r={p.size} fill="#FFD700" opacity={p.opacity} />
									</g>
								);
							}
							if (activeRing === "S") {
								const cp = p.rotation || 0;
								const isFlashing = (p.rotationSpeed || 0) > 0;
								const col = cp < 0.4 ? "#CC44FF" : cp < 0.7 ? "#8844FF" : cp < 0.9 ? "#AAAAFF" : "#FFFFFF";
								return <circle key={`s2p-${i}`} cx={p.x} cy={p.y} r={isFlashing ? 6 : p.size * (1 - cp * 0.3)} fill={isFlashing ? "#FFFFFF" : col} opacity={isFlashing ? 1 : p.opacity} filter={cp > 0.8 ? "url(#glow)" : "none"} style={{ pointerEvents: "none" }} />;
							}
							return <circle key={`s2p-${i}`} cx={p.x} cy={p.y} r={p.size} fill="#888888" opacity={p.opacity} style={{ pointerEvents: "none" }} />;
						})}

						{/* A rank burst particles */}
						{activeRing === "A" && !perfMode && aBurstParticles.current.map((bp, i) => (
							<circle key={`aburst-${i}`} cx={bp.x} cy={bp.y} r={bp.size * (1 - bp.life / bp.maxLife)} fill="#FFFFFF" opacity={1 - bp.life / bp.maxLife} style={{ pointerEvents: "none" }} />
						))}

						{/* S rank Event Horizon: Lightning arcs + node flares */}
						{activeRing === "S" && !perfMode && lightningState.current.arcs.map((arc, i) => (
							<g key={`lightning-${i}`} style={{ pointerEvents: "none" }}>
								<polyline points={arc.path.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="white" strokeWidth={arc.isMajor ? 1.5 : 0.8} strokeOpacity={arc.opacity * 0.9} filter="url(#glow)" />
								<polyline points={arc.path.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#CC44FF" strokeWidth={arc.isMajor ? 3 : 1.5} strokeOpacity={arc.opacity * 0.4} />
								{arc.branches.map((br, bi) => (
									<polyline key={`branch-${bi}`} points={br.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="white" strokeWidth={0.5} strokeOpacity={arc.opacity * 0.6} />
								))}
								{arc.opacity > 0.7 && (() => {
									const pA = nodePositions.get(arc.nodeA);
									const pB = nodePositions.get(arc.nodeB);
									return <>
										{pA && <circle cx={pA.x} cy={pA.y} r={18} fill={RANK_COLOURS["S"]} fillOpacity={arc.opacity*0.6} filter="url(#glow)" />}
										{pB && <circle cx={pB.x} cy={pB.y} r={18} fill={RANK_COLOURS["S"]} fillOpacity={arc.opacity*0.6} filter="url(#glow)" />}
									</>;
								})()}
							</g>
						))}

						{/* S rank shockwaves */}
						{activeRing === "S" && !perfMode && shockwaves.current.map((sw, i) => {
							const t = sw.life / sw.maxLife;
							return <circle key={`sw-${i}`} cx={CX} cy={CY} r={6 + t * 34} fill="none" stroke="white" strokeWidth={2} strokeOpacity={(1-t)*0.8} style={{ pointerEvents: "none" }} />;
						})}

						{/* S rank crackle arc segments */}
						{activeRing === "S" && !perfMode && crackleSegments.current.map((seg, i) => {
							const dr = 180;
							const circ = 2 * Math.PI * dr;
							const segLen = seg.arcLength * dr;
							return <circle key={`cseg-${i}`} cx={CX} cy={CY} r={dr} fill="none" stroke="white" strokeWidth={seg.strokeW} strokeOpacity={seg.opacity} strokeDasharray={`${segLen} ${circ-segLen}`} strokeDashoffset={-seg.startAngle*dr} filter="url(#glow)" style={{ pointerEvents: "none" }} />;
						})}

						{/* S rank crackle flash — major */}
						{activeRing === "S" && !perfMode && crackleState.current.active && crackleState.current.intensity === 3 && (
							<rect x={-500} y={-500} width={1000} height={1000} fill="#CC44FF" opacity={0.18 * (1 - crackleState.current.progress)} style={{ pointerEvents: "none" }} />
						)}

						{/* S rank energy tendrils */}
						{activeRing === "S" && !perfMode && energyTendrils.current.map((t, i) => {
							const dr = 180;
							const x1 = CX + Math.cos(t.angle) * dr;
							const y1 = CY + Math.sin(t.angle) * dr;
							const x2 = CX + Math.cos(t.angle) * (dr + t.length);
							const y2 = CY + Math.sin(t.angle) * (dr + t.length);
							return <line key={`tendril-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#CC44FF" strokeWidth={0.5+Math.random()*0.5} strokeOpacity={t.opacity} style={{ pointerEvents: "none" }} />;
						})}

								{/* S rank chromatic aberration — violent rotating */}
								{activeRing === "S" && !perfMode && (() => {
									const dr = 180;
									const cs = crackleState.current;
									const aberr = cs.active ? (cs.intensity === 3 ? 8 : 5) : 1;
									const ox = Math.cos(aberrationAngle.current) * aberr;
									const oy = Math.sin(aberrationAngle.current) * aberr;
									return (
										<g style={{ pointerEvents: "none" }}>
											<circle cx={CX} cy={CY} r={dr} fill="none" stroke="#FF0000" strokeWidth={2} strokeDasharray="6 6" strokeOpacity={0.3} transform={`translate(${ox.toFixed(2)} ${oy.toFixed(2)})`} />
											<circle cx={CX} cy={CY} r={dr} fill="none" stroke="#0000FF" strokeWidth={2} strokeDasharray="6 6" strokeOpacity={0.3} transform={`translate(${(-ox).toFixed(2)} ${(-oy).toFixed(2)})`} />
										</g>
									);
								})()}

						{/* S rank vignette overlay */}
						{activeRing === "S" && !perfMode && (
							<rect x={-500} y={-500} width={1000} height={1000} fill="url(#s-vignette)" style={{ pointerEvents: "none" }} />
						)}

						{/* Ambient orbiting particles — State 1 only */}
						{!activeRing && !perfMode && ambientParticles.map((p, i) => (
							<circle
								key={`particle-${p.id}`}
								cx={CX + (ringRadii[p.rank] + p.radiusOffset) * Math.cos(particleAngles.current[i])}
								cy={CY + (ringRadii[p.rank] + p.radiusOffset) * Math.sin(particleAngles.current[i])}
								r={p.size}
								fill={RANK_COLOURS[p.rank]}
								opacity={p.opacity}
								style={{ pointerEvents: "none" }}
							/>
						))}
						{RANKS.map((rank) => {
							const isS = rank === "S";
							if (isS && activeRing !== "S") return null;
							
							const radius = isS ? 180 : ringRadii[rank];
							
							const isActive = activeRing === rank;
							const isDimmed = activeRing && !isActive;

							return (
								<g key={`ring-group-${rank}`} className={isDimmed ? "ring-dim" : "ring-full"}
									transform={
										!activeRing && !perfMode && !isS ? `rotate(${ringRotations.current[rank] * (180 / Math.PI)} ${CX} ${CY})` :
										activeRing === rank && !perfMode ? `rotate(${state2Rotation.current * (180 / Math.PI)} ${CX} ${CY})` :
										undefined
									}
								>
									<circle
										cx={CX} cy={CY} r={radius}
										fill="none"
										stroke="transparent"
										strokeWidth={40}
										style={{ cursor: "pointer", pointerEvents: activeRing ? "none" : "auto" }}
										onMouseEnter={() => setHoveredRing(rank)}
										onMouseLeave={() => setHoveredRing(null)}
										onClick={(e) => {
											e.stopPropagation();
											if (!activeRing) {
												setActiveRing(rank);
												playSFX("button");
											}
										}}
									/>
									<circle
										cx={CX} cy={CY} r={radius}
										fill="none"
										stroke="currentColor"
										strokeWidth={22}
										className="opacity-[0.04] dark:opacity-[0.04]"
										style={{ pointerEvents: "none" }}
									/>
									<circle
										cx={CX} cy={CY} r={radius}
										fill="none"
										stroke={RANK_COLOURS[rank]}
										strokeWidth={isActive || hoveredRing === rank ? 2.5 : 2}
										strokeDasharray={isActive ? "none" : "6 6"}
										strokeOpacity={isActive || hoveredRing === rank ? 1 : 0.8}
										filter={activeRing === "A" && rank === "A" && !perfMode ? "url(#heat-distort)" : activeRing === "S" && rank === "S" && !perfMode ? "url(#gravity-lens)" : (isActive || hoveredRing === rank ? "url(#glow)" : "none")}
										className={`${triggerS && surgeFlag === 2 ? "s-flash-rings" : ""} ${!activeRing ? `ring-${rank}` : ""}`}
										style={{ 
											pointerEvents: "none",
											transition: "stroke-opacity 0.2s ease, stroke-width 0.2s ease, filter 0.2s ease"
										}}
									/>
									
									{!activeRing && (
										<>
											<text
												x={CX} y={CY - radius - 14}
												textAnchor="middle"
												fill={RANK_COLOURS[rank]}
												fontSize={14}
												fontWeight="900"
												className="opacity-100 drop-shadow-md dark:drop-shadow-none"
												style={{ pointerEvents: "none" }}
												transform={!perfMode ? `rotate(${-ringRotations.current[rank] * (180 / Math.PI)} ${CX} ${CY - radius - 14})` : undefined}
											>
												{rank}
											</text>
											<circle
												cx={CX} cy={CY} r={radius}
												fill="none"
												stroke={RANK_COLOURS[rank]}
												strokeWidth={5}
												strokeOpacity={0.5}
												strokeDasharray={`${2 * Math.PI * radius * (ringArcs[rank].req + ringArcs[rank].choice)} ${2 * Math.PI * radius}`}
												strokeDashoffset={0}
												transform={`rotate(-90 ${CX} ${CY})`}
												className="arc-transition"
												style={{ pointerEvents: "none" }}
											/>
											<circle
												cx={CX} cy={CY} r={radius}
												fill="none"
												stroke={RANK_COLOURS[rank]}
												strokeWidth={5}
												strokeDasharray={`${2 * Math.PI * radius * ringArcs[rank].req} ${2 * Math.PI * radius}`}
												strokeDashoffset={0}
												transform={`rotate(-90 ${CX} ${CY})`}
												className="arc-transition filter drop-shadow-md"
												filter="url(#glow)"
												style={{ pointerEvents: "none" }}
											/>
										</>
									)}
								</g>
							);
						})}

						{affinityLines.map((line, i) => {
							const lineKey = `${line.x1},${line.y1}-${line.x2},${line.y2}`;
							if (!affinityProgress.current[lineKey]) affinityProgress.current[lineKey] = { progress: 0, dir: 1 };
							const prog = affinityProgress.current[lineKey]?.progress || 0;
							const tx = line.x1 + (line.x2 - line.x1) * prog;
							const ty = line.y1 + (line.y2 - line.y1) * prog;
							return (
								<g key={`aff-${i}`}>
									<line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={activeRing ? RANK_COLOURS[activeRing] : "var(--accent)"} strokeWidth={1} strokeDasharray="3 3" opacity={0.15} style={{ pointerEvents: "none" }} />
									{!perfMode && <circle cx={tx} cy={ty} r={2} fill={activeRing ? RANK_COLOURS[activeRing] : "var(--accent)"} opacity={0.6} style={{ pointerEvents: "none" }} />}
								</g>
							);
						})}

						{RANKS.map((rank) => {
							const nodes = projects[rank] || [];
							const isS = rank === "S";
							if (isS && !isSUnlocked && !isSUnlocking) return null;
							
							const ringActive = activeRing === rank;
							const anyRingActive = activeRing !== null;
							if (anyRingActive && !ringActive) return null;
							
							return nodes.map((node) => {
								if (!activeRing && !node.isRequired) return null;
								
								const pos = nodePositions.get(node.id);
								if (!pos) return null;
								
								const baseColor = RANK_COLOURS[rank];
								const isReq = node.isRequired;
								const r = nodeRadius(node.userState, !!activeRing) * (isReq ? 1.1 : 0.95);
								
								let activeFill = baseColor;
								if (ringActive && node.userState === "active") {
									activeFill = node.blackholeDays < 7 ? "#FF4444" : node.blackholeDays < 14 ? "#FFAA00" : "#44FF44";
								}

								const dist = Math.hypot(svgMousePos.x - pos.x, svgMousePos.y - pos.y);
								const proximityScale = activeRing && dist < 60 ? 1 + (1 - dist / 60) * 0.3 : 1;

								// Cursor gravity — State 1 nodes
								let renderX = pos.x, renderY = pos.y;
								if (!activeRing && !perfMode && isReq) {
									const gDist = Math.hypot(svgMousePos.x - pos.x, svgMousePos.y - pos.y);
									if (gDist < 80 && gDist > 0) {
										const pull = (1 - gDist / 80) * 8;
										const gAngle = Math.atan2(svgMousePos.y - pos.y, svgMousePos.x - pos.x);
										renderX = pos.x + Math.cos(gAngle) * pull;
										renderY = pos.y + Math.sin(gAngle) * pull;
									}
								}

								const isFlickering = flickerNodeId === node.id;

								// Blackhole urgency pulse speed
								const urgencyDuration = node.blackholeDays < 3 ? "0.5s" : node.blackholeDays < 7 ? "1s" : node.blackholeDays < 14 ? "2s" : "3s";

								// Cursor-reactive shadow
								const lightAngle = Math.atan2(svgMousePos.y - pos.y, svgMousePos.x - pos.x);
								const shadowX = Math.cos(lightAngle + Math.PI) * 3;
								const shadowY = Math.sin(lightAngle + Math.PI) * 3;
								const nodeShadowStyle = activeRing && !perfMode ? `drop-shadow(${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 2px ${baseColor}66)` : undefined;

								return (
									<g
										key={node.id}
										onMouseEnter={() => { setHoveredNode(node); setHoveredPos({x: pos.x, y: pos.y}); }}
										onMouseLeave={() => setHoveredNode(null)}
										onClick={(e) => {
											e.stopPropagation();
											if (!activeRing) {
												setActiveRing(rank);
												playSFX("button");
											} else if (node.userState !== "locked") {
												playSFX("button");
												router.push(`/cursus/projects/${node.id}`);
											}
										}}
										style={{
											cursor: node.userState === "locked" && activeRing ? "default" : "pointer",
											// @ts-ignore
											"--glow-col": baseColor,
											pointerEvents: "auto",
											opacity: isFlickering ? 0.3 : (isReq ? 1 : 0.7),
											transform: `translate(${renderX}px, ${renderY}px) scale(${proximityScale}) translate(${-renderX}px, ${-renderY}px)`,
											transition: "transform 0.2s ease-out, opacity 0.15s ease",
											filter: nodeShadowStyle,
										}}
										className={triggerS ? "s-unlock-anim" : ""}
									>
										{node.userState === "completed" && (
											<>
												{!activeRing && <circle cx={renderX} cy={renderY} r={r + 4} fill={baseColor} fillOpacity={0.3} filter="url(#glow)" />}
												<circle cx={renderX} cy={renderY} r={r + 3} fill={baseColor} fillOpacity={0.2} filter="url(#glow)" />
												<circle
													cx={renderX} cy={renderY} r={r + 2}
													fill="none"
													stroke="white"
													strokeWidth={1.5}
													strokeOpacity={0.4}
													strokeDasharray="20 80"
													className="node-shimmer"
												/>
												<circle cx={renderX} cy={renderY} r={r} fill={baseColor} className="node-completed" />
												<circle cx={renderX} cy={renderY} r={r / 2} fill="#fff" opacity={0.8} />
												{isReq && <circle cx={renderX} cy={renderY} r={r + 6} fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.3} />}
											</>
										)}
										{node.userState === "active" && (
											<>
												<rect 
													x={renderX - r} y={renderY - r} width={r * 2} height={r * 2} rx={r/2}
													fill="none" stroke={activeFill} strokeWidth={2}
													className="node-active-pulse"
													style={{ animationDuration: urgencyDuration }}
												/>
												<rect x={renderX - r*0.8} y={renderY - r*0.8} width={r*1.6} height={r*1.6} rx={r/3} fill={activeFill} />
												{isReq && <circle cx={renderX} cy={renderY} r={r + 6} fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.3} />}
											</>
										)}
										{node.userState === "available" && (
											<>
												<circle cx={renderX} cy={renderY} r={r} fill={baseColor} fillOpacity={0.3} stroke={baseColor} strokeWidth={1.5} className="node-available" />
												{!perfMode && <circle cx={renderX} cy={renderY} r={r + 3} fill="none" stroke={baseColor} strokeWidth={1} strokeOpacity={0.4} className="node-available-ring" />}
												{isReq && <circle cx={renderX} cy={renderY} r={r + 6} fill="none" stroke="#fff" strokeWidth={1} strokeOpacity={0.3} />}
											</>
										)}
										{node.userState === "locked" && (
											<>
												<circle cx={renderX} cy={renderY} r={r} fill="none" stroke={baseColor} strokeOpacity={isFlickering ? 0.3 : 0.15} strokeWidth={1} />
											</>
										)}
										
										{ringActive && (isReq || hoveredNode?.id === node.id) && (
											<text 
												x={renderX} y={renderY + r + 12} 
												textAnchor="middle" 
												fill="#fff" 
												fontSize={10} 
												fontWeight="bold"
												filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.8))"
											>
												{node.title}
											</text>
										)}
									</g>
								);
							});
						})}

						{/* Sparkle particles from completed nodes */}
						{!perfMode && sparkles.map(s => (
							<circle
								key={s.id}
								cx={s.x} cy={s.y}
								r={2}
								fill="#fff"
								className="sparkle-particle"
								style={{ pointerEvents: "none", "--sx": `${s.sx}px`, "--sy": `${s.sy}px` } as React.CSSProperties}
							/>
						))}

						{/* Explosion particles */}
						{!perfMode && explosionParticles.current.map(ep => (
							<circle key={ep.id} cx={ep.x} cy={ep.y} r={ep.size * (1 - ep.life / ep.maxLife)} fill={ep.color} opacity={1 - ep.life / ep.maxLife} style={{ pointerEvents: "none" }} />
						))}

						{/* Ring pulse on node hover — State 2 */}
						{activeRing && !perfMode && ringPulseActive.current && (() => {
							const displayRadius = activeRing === "S" ? 180 : ringRadii[activeRing];
							const circumference = 2 * Math.PI * displayRadius;
							const pulseOffset = circumference * (1 - ringPulseProgress.current);
							return (
								<circle cx={CX} cy={CY} r={displayRadius} fill="none" stroke={RANK_COLOURS[activeRing]} strokeWidth={3} strokeOpacity={0.6 * (1 - ringPulseProgress.current)} strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`} strokeDashoffset={-pulseOffset} transform={`rotate(-90 ${CX} ${CY})`} style={{ pointerEvents: "none" }} />
							);
						})()}

						{!activeRing ? (
							<g className="filter drop-shadow-lg" style={{ pointerEvents: "auto", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setActiveRing("E"); playSFX("button"); }}>
								{/* RC outer aura ring */}
								{!perfMode && (
									<circle cx={CX} cy={CY} r={52} fill="none" stroke={RANK_COLOURS[userRank]} strokeWidth={8} strokeOpacity={0.15} filter="url(#glow)" className="rank-aura" style={{ pointerEvents: "none" }} />
								)}
								<circle cx={CX} cy={CY} r={40} fill="var(--panel)" stroke={RANK_COLOURS[userRank] || "#888"} strokeWidth={2} className={!activeRing ? "rc-heartbeat" : ""} />
								<text x={CX} y={CY - 5} textAnchor="middle" dominantBaseline="middle" fill="var(--accent)" fontSize={18} fontWeight="900">RC</text>
								
								{/* Hide the primary label if we are showing the special S label below */}
								{(!isSUnlocked || userRank !== "S") && (
									<text x={CX} y={CY + 15} textAnchor="middle" dominantBaseline="middle" fill={RANK_COLOURS[userRank] || "#888"} fontSize={12} fontWeight="bold">
										{userRank === "S" && !isSUnlocked ? "A" : userRank}
									</text>
								)}
								
								{isSUnlocked && (
									<text 
										x={CX} y={userRank === "S" ? CY + 18 : CY + 28}
										textAnchor="middle"
										fill={RANK_COLOURS["S"]}
										fontSize={11}
										fontWeight="900"
										className={surgeFlag === 3 ? "s-unlock-anim filter drop-shadow-[0_0_8px_rgba(204,68,255,0.8)]" : ""}
										style={{ 
											cursor: "pointer", 
											opacity: surgeFlag >= 3 || (!triggerS && isSUnlocked) ? 1 : 0,
											transition: "opacity 0.5s ease"
										}}
										onClick={(e) => {
											e.stopPropagation();
											setActiveRing("S");
											playSFX("button");
										}}
									>
										S
									</text>
								)}
							</g>
						) : (
							<g className="filter drop-shadow-lg">
								{/* S rank vortex behind center */}
								{activeRing === "S" && !perfMode && (
									<g style={{ pointerEvents: "none" }}>
										<circle cx={CX} cy={CY} r={72} fill="none" stroke="white" strokeWidth={3} strokeOpacity={crackleState.current.active && crackleState.current.intensity === 3 ? 1 : 0.6} filter="url(#glow)" />
										<circle cx={CX} cy={CY} r={50} fill="none" stroke="#CC44FF" strokeWidth={0.5} strokeOpacity={0.3}
											transform={`rotate(${-vortexAngle.current * (180/Math.PI) * 0.5} ${CX} ${CY})`} />
										<circle cx={CX} cy={CY} r={42} fill="#050008" stroke="#CC44FF" strokeWidth={1} strokeOpacity={0.4} />
									</g>
								)}
								<text x={CX} y={CY - 15} textAnchor="middle" dominantBaseline="middle" fill={RANK_COLOURS[activeRing]} fontSize={42} fontWeight="900" filter="url(#glow)">{activeRing}</text>
								<text x={CX} y={CY + 20} textAnchor="middle" fill="#aaa" fontSize={10} fontWeight="bold">{activeStats?.reqRem} REQUIRED REMAINING</text>
								<text x={CX} y={CY + 35} textAnchor="middle" fill="#666" fontSize={10} fontWeight="bold">{activeStats?.choicesRem} CHOICES REMAINING</text>
							</g>
						)}
						
						{activeRing === "S" && !isSUnlocked && !triggerS && (
							<text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fill="#555" fontSize={14} fontWeight="bold">Not yet.</text>
						)}
					</g>
				</svg>

				{hoveredNode && (
					<div
						className="pointer-events-none fixed z-[60] w-64 rounded-xl border border-white/10 bg-panel/95 p-4 shadow-2xl backdrop-blur-md"
						style={{
							left: typeof window !== "undefined" ? Math.min(mousePos.x + 16, window.innerWidth - 280) : mousePos.x + 16,
							top: typeof window !== "undefined" ? Math.max(16, mousePos.y - 120) : mousePos.y - 60,
							transform: "none"
						}}
					>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-black text-white">{hoveredNode.title}</span>
							<Badge rank={hoveredNode.rank as any} size="sm" />
						</div>
						
						{!activeRing ? (
							<div className="text-xs text-text-muted mt-1 uppercase tracking-wider font-bold">
								{hoveredNode.userState}
							</div>
						) : (
							<div className="text-xs text-text-muted mt-1 uppercase tracking-wider font-bold">
								{hoveredNode.isRequired ? "REQUIRED" : `CHOICE — ${activeStats?.choicesRem} SLOTS REMAINING`}
								<div className="mt-1 text-[10px]">{hoveredNode.userState}</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Performance mode toggle */}
			<button
				onClick={(e) => { e.stopPropagation(); togglePerfMode(); }}
				className="absolute bottom-4 right-4 text-xs text-text-muted hover:text-text opacity-60 hover:opacity-100 transition-opacity z-50"
				style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
			>
				{perfMode ? "🎨 Enable effects" : "⚡ Performance mode"}
			</button>
		</div>
	);
}
