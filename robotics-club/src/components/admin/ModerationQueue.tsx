"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// ── Types ────────────────────────────────────────────

interface FabReq { id: string; userName: string; userLogin: string; machineType: string; purpose: string; estimatedTime: number | null; material: string | null; modelFileUrl: string | null; status: string; }
interface MatReq { id: string; teamName: string; projectTitle: string; itemName: string; quantity: number; estimatedCost: number | null; justification: string | null; status: string; }
interface Proposal { id: string; proposedByName: string; proposedByRank: string; title: string; proposedRank: string; description: string | null; learningObjectives: string | null; buildPlan: string | null; status: string; }
interface ConflictItem { id: string; teamName: string; projectTitle: string; description: string; status: string; createdAt: string; moderatorNote: string | null; }
interface DamageItem { id: string; reporterName: string; itemDescription: string; estimatedValue: number | null; description: string | null; status: string; }

interface ModerationQueueProps { fabrication: FabReq[]; materials: MatReq[]; proposals: Proposal[]; conflicts: ConflictItem[]; damage: DamageItem[]; }

// ── Helpers ──────────────────────────────────────────

function formatDate(d: string) {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(d));
}

const tabs = ["All", "Print/CNC", "Materials", "Proposals", "Conflicts", "Damage"] as const;

// ── Component ────────────────────────────────────────

export function ModerationQueue({ fabrication, materials, proposals, conflicts, damage }: ModerationQueueProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [tab, setTab] = useState<typeof tabs[number]>("All");
	const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState<string | null>(null);

	const callApi = async (url: string, body: any, msg: string) => {
		setLoading(url);
		try {
			const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
			if (res.ok) { toast(msg); router.refresh(); } else { const j = await res.json(); toast(j.error || "Failed", "error"); }
		} catch { toast("Network error", "error"); } finally { setLoading(null); }
	};

	const showFab = tab === "All" || tab === "Print/CNC";
	const showMat = tab === "All" || tab === "Materials";
	const showProp = tab === "All" || tab === "Proposals";
	const showConf = tab === "All" || tab === "Conflicts";
	const showDam = tab === "All" || tab === "Damage";

	const chipBase = "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors";

	return (
		<div className="space-y-8 animate-in fade-in duration-700">
			{/* Mission Operations Header */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				{[
					{ label: "Fabrication", count: fabrication.length, color: "text-accent", bg: "bg-accent/10" },
					{ label: "Materials", count: materials.length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
					{ label: "Proposals", count: proposals.length, color: "text-amber-400", bg: "bg-amber-500/10" },
					{ label: "Conflicts", count: conflicts.length, color: "text-red-400", bg: "bg-red-500/10" },
					{ label: "Reports", count: damage.length, color: "text-orange-400", bg: "bg-orange-500/10" },
				].map((stat) => (
					<div key={stat.label} className={`rounded-2xl border border-white/5 ${stat.bg} p-4 backdrop-blur-md`}>
						<p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{stat.label}</p>
						<p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
					</div>
				))}
			</div>

			<div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5">
				{tabs.map((t) => (
					<button 
						key={t} 
						onClick={() => setTab(t)} 
						className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
							tab === t 
								? "bg-accent text-background border-accent shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105" 
								: "bg-panel/40 border-white/5 text-text-muted hover:border-accent/30 hover:text-text-primary"
						}`}
					>
						{t}
					</button>
				))}
			</div>

			{/* Fabrication */}
			{showFab && fabrication.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center gap-4">
						<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Fabrication Pipeline</h3>
						<div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{fabrication.map((f) => (
							<Card key={f.id} className="group relative overflow-hidden border-white/5 bg-panel-2/30 backdrop-blur-2xl transition-all hover:border-accent/40 rounded-[2rem] p-6">
								<div className="absolute top-0 right-0 h-32 w-32 bg-accent/5 blur-[60px] pointer-events-none" />
								<div className="flex items-start justify-between relative mb-6">
									<div className="space-y-1">
										<h4 className="text-base font-black text-text-primary leading-none uppercase tracking-tight">{f.userName}</h4>
										<p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">@{f.userLogin}</p>
									</div>
									<div className="flex flex-col items-end gap-2">
										<span className="rounded-full bg-accent/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-accent border border-accent/20">{f.machineType}</span>
										{f.estimatedTime && <span className="text-[9px] font-bold text-text-muted tabular-nums uppercase tracking-widest">{f.estimatedTime}m ETA</span>}
									</div>
								</div>
								
								<div className="bg-background/40 rounded-2xl p-4 border border-white/5 mb-6 relative group-hover:bg-background/60 transition-colors">
									<p className="text-xs text-text-primary leading-relaxed">"{f.purpose}"</p>
									<div className="mt-4 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-muted">
										{f.material && <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent" /> {f.material}</span>}
										{f.modelFileUrl && (
											<a href={f.modelFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:text-white transition-colors">
												<span className="h-1 w-1 rounded-full bg-accent" /> DOWNLOAD_ASSET.STL
											</a>
										)}
									</div>
								</div>

								<div className="flex flex-col sm:flex-row items-center gap-3 relative">
									<div className="relative flex-1 w-full">
										<input 
											value={noteInputs[f.id] || ""} 
											onChange={(e) => setNoteInputs((p) => ({ ...p, [f.id]: e.target.value }))} 
											placeholder="SYSTEM LOG..." 
											className="w-full rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-xs text-text-primary placeholder:text-text-muted/40 focus:border-accent/40 outline-none transition-all font-mono" 
										/>
									</div>
									<div className="flex items-center gap-2 w-full sm:w-auto">
										<Button 
											variant="primary" 
											className="flex-1 h-11 bg-accent hover:bg-white hover:text-black rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-accent/10" 
											disabled={loading !== null} 
											onClick={() => callApi(`/api/admin/fabrication/${f.id}`, { status: "APPROVED" }, "Approved")}
										>
											AUTHORIZE
										</Button>
										<Button 
											variant="danger" 
											className="h-11 w-11 p-0 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10" 
											disabled={loading !== null} 
											onClick={() => callApi(`/api/admin/fabrication/${f.id}`, { status: "REJECTED", moderatorNote: noteInputs[f.id] }, "Rejected")}
										>
											✕
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Materials */}
			{showMat && materials.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center gap-4">
						<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Logistics Hub (Materials)</h3>
						<div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{materials.map((m) => (
							<Card key={m.id} className="group relative overflow-hidden border-white/5 bg-panel-2/30 backdrop-blur-2xl transition-all hover:border-emerald-500/40 rounded-[2rem] p-6">
								<div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 blur-[60px] pointer-events-none" />
								<div className="flex items-start justify-between relative mb-6">
									<div className="space-y-1">
										<h4 className="text-base font-black text-text-primary leading-none uppercase tracking-tight">{m.teamName}</h4>
										<p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{m.projectTitle}</p>
									</div>
									<div className="flex flex-col items-end gap-2">
										<span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20">MATERIAL_REQ</span>
										{m.estimatedCost && <span className="text-sm font-black text-emerald-400 tabular-nums tracking-tighter">{m.estimatedCost} AED</span>}
									</div>
								</div>
								
								<div className="bg-background/40 rounded-2xl p-4 border border-white/5 mb-6 relative group-hover:bg-background/60 transition-colors">
									<p className="text-sm font-bold text-text-primary">{m.itemName} <span className="text-accent ml-2 text-xs">×{m.quantity}</span></p>
									{m.justification && <p className="mt-2 text-xs text-text-muted italic leading-relaxed">"{m.justification}"</p>}
								</div>

								<div className="flex gap-3 relative">
									<Button 
										variant="primary" 
										className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-900/20" 
										disabled={loading !== null} 
										onClick={() => callApi(`/api/admin/materials/${m.id}`, { status: "APPROVED" }, "Approved")}
									>
										APPROVE_REQUISITION
									</Button>
									<Button 
										variant="danger" 
										className="flex-1 h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 font-black uppercase tracking-widest text-[9px]" 
										disabled={loading !== null} 
										onClick={() => callApi(`/api/admin/materials/${m.id}`, { status: "DENIED" }, "Denied")}
									>
										DECLINE
									</Button>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Proposals */}
			{showProp && proposals.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center gap-4">
						<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Project Proposals</h3>
						<div className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
					</div>
					<div className="space-y-4">
						{proposals.map((p) => (
							<Card key={p.id} className="group relative overflow-hidden border-white/5 bg-panel-2/30 backdrop-blur-2xl transition-all hover:border-amber-500/40 rounded-[2.5rem] p-8">
								<div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/5 blur-[80px] pointer-events-none" />
								<div className="flex flex-col md:flex-row md:items-center justify-between relative mb-8 gap-4">
									<div className="flex items-center gap-4">
										<div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-2xl font-black text-amber-500">
											{p.proposedRank}
										</div>
										<div className="space-y-1">
											<h4 className="text-xl font-black text-text-primary tracking-tighter uppercase">{p.title}</h4>
											<p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
												DESIGNED BY {p.proposedByName} <span className="h-1 w-1 rounded-full bg-amber-500/50" /> RANK {p.proposedByRank}
											</p>
										</div>
									</div>
									<span className="rounded-full bg-amber-500/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 border border-amber-500/20 md:self-start">BLUEPRINT_PENDING</span>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-text-muted relative mb-8">
									<div className="space-y-3 bg-white/5 rounded-3xl p-6 border border-white/5 group-hover:bg-white/10 transition-colors">
										<p className="font-black uppercase tracking-widest text-[9px] text-amber-500 opacity-80">Mission Concept</p>
										<p className="leading-relaxed text-sm text-text-primary/80 italic">"{p.description || "No description provided."}"</p>
									</div>
									<div className="space-y-3 bg-white/5 rounded-3xl p-6 border border-white/5 group-hover:bg-white/10 transition-colors">
										<p className="font-black uppercase tracking-widest text-[9px] text-amber-500 opacity-80">Learning Objectives</p>
										<ul className="space-y-2">
											{p.learningObjectives?.split("\n").map((obj, i) => (
												<li key={i} className="flex items-start gap-2 text-text-muted/80 leading-relaxed tabular-nums">
													<span className="text-amber-500 font-black">{i + 1}.</span> {obj}
												</li>
											))}
										</ul>
									</div>
								</div>

								<div className="flex flex-col md:flex-row items-center gap-4 relative">
									<div className="relative flex-1 w-full">
										<input 
											value={noteInputs[p.id] || ""} 
											onChange={(e) => setNoteInputs((prev) => ({ ...prev, [p.id]: e.target.value }))} 
											placeholder="MISSION CONTROL FEEDBACK..." 
											className="w-full rounded-2xl border border-white/5 bg-black/20 px-6 py-4 text-xs text-text-primary outline-none focus:border-amber-500/40 font-mono transition-all" 
										/>
									</div>
									<div className="flex items-center gap-3 w-full md:w-auto">
										<Button 
											variant="primary" 
											className="flex-1 md:w-48 h-14 bg-amber-600 hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-900/30" 
											disabled={loading !== null} 
											onClick={() => callApi(`/api/admin/proposals/${p.id}`, { status: "APPROVED", moderatorNote: noteInputs[p.id] }, "Approved")}
										>
											ESTABLISH_MISSION
										</Button>
										<Button 
											variant="danger" 
											className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/20 flex items-center justify-center text-xl" 
											disabled={loading !== null} 
											onClick={() => callApi(`/api/admin/proposals/${p.id}`, { status: "REJECTED", moderatorNote: noteInputs[p.id] }, "Rejected")}
										>
											✕
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Conflicts */}
			{showConf && conflicts.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center gap-4">
						<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Anomaly Detection</h3>
						<div className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent" />
					</div>
					<div className="space-y-3">
						{conflicts.map((c) => (
							<Card key={c.id} className="group relative overflow-hidden border-white/10 bg-red-500/5 backdrop-blur-3xl transition-all hover:bg-red-500/10 rounded-3xl p-6">
								<div className="flex items-center justify-between mb-4 relative">
									<div className="flex items-center gap-3">
										<div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
										<span className="text-sm font-black text-text-primary tracking-tight uppercase">{c.teamName} <span className="text-red-500/60 font-medium">{"// CRITICAL_ANOMALY"}</span></span>
									</div>
									<span className="text-[9px] font-black text-text-muted tabular-nums opacity-60 tracking-[0.2em]">{formatDate(c.createdAt)}</span>
								</div>
								
								<div className="bg-black/40 rounded-2xl p-4 border border-red-500/10 mb-5 relative">
									<p className="text-xs text-red-100/80 leading-relaxed font-mono tracking-tight">{c.description}</p>
								</div>

								<div className="flex items-center gap-3 relative">
									<input 
										value={noteInputs[c.id] || ""} 
										onChange={(e) => setNoteInputs((prev) => ({ ...prev, [c.id]: e.target.value }))} 
										placeholder="RESOLUTION_PROTOCOL..." 
										className="flex-1 rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-xs text-text-primary outline-none focus:border-red-500/40 font-mono transition-all" 
									/>
									<div className="flex items-center gap-2">
										<Button 
											variant="secondary" 
											className="h-11 rounded-xl px-5 text-[9px] uppercase font-black tracking-widest bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all" 
											disabled={loading !== null} 
											onClick={() => callApi(`/api/admin/conflicts/${c.id}`, { status: "REVIEWED", moderatorNote: noteInputs[c.id] }, "Marked reviewed")}
										>
											MARK_REVIEWED
										</Button>
										<Button 
											variant="primary" 
											className="h-11 rounded-xl px-5 text-[9px] uppercase font-black tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-900/30 text-white" 
											disabled={loading !== null} 
											onClick={() => callApi(`/api/admin/conflicts/${c.id}`, { status: "RESOLVED", moderatorNote: noteInputs[c.id] }, "Resolved")}
										>
											RESOLVE
										</Button>
									</div>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Damage */}
			{showDam && damage.length > 0 && (
				<section className="space-y-4">
					<div className="flex items-center gap-4">
						<h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Incident Reports</h3>
						<div className="h-px flex-1 bg-gradient-to-r from-orange-500/30 to-transparent" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{damage.map((d) => (
							<Card key={d.id} className="group relative overflow-hidden border-white/5 bg-orange-500/5 backdrop-blur-2xl transition-all hover:bg-orange-500/10 rounded-[2rem] p-6">
								<div className="flex items-start justify-between relative mb-6">
									<div className="space-y-1">
										<h4 className="text-base font-black text-text-primary tracking-tighter uppercase">{d.itemDescription}</h4>
										<p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">REPORTED BY {d.reporterName}</p>
									</div>
									{d.estimatedValue !== null && (
										<div className="flex flex-col items-end">
											<span className={`text-xl font-black ${d.estimatedValue > 50 ? "text-red-500 animate-pulse" : "text-orange-400"}`}>
												{d.estimatedValue}
											</span>
											<span className="text-[8px] font-black text-text-muted">AED</span>
										</div>
									)}
								</div>

								<div className="bg-black/40 rounded-2xl p-4 border border-orange-500/10 mb-6 font-mono text-[10px] text-orange-200/60 leading-relaxed italic">
									"{d.description || "NO_SPECIFIC_LOGS_PROVIDED"}"
								</div>

								<div className="flex gap-3 relative">
									<Button 
										variant="secondary" 
										className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all" 
										disabled={loading !== null} 
										onClick={() => callApi(`/api/admin/damage/${d.id}`, { status: "UNDER_REVIEW" }, "Under review")}
									>
										START_ASSESSMENT
									</Button>
									<Button 
										variant="primary" 
										className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[9px] bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-900/30 text-white" 
										disabled={loading !== null} 
										onClick={() => callApi(`/api/admin/damage/${d.id}`, { status: "RESOLVED" }, "Resolved")}
									>
										CLOSE_CASE
									</Button>
								</div>
							</Card>
						))}
					</div>
				</section>
			)}

			{/* Empty state */}
			{fabrication.length === 0 && materials.length === 0 && proposals.length === 0 && conflicts.length === 0 && damage.length === 0 && (
				<div className="py-24 text-center space-y-4">
					<div className="text-4xl filter grayscale opacity-20 transition-all hover:grayscale-0 hover:opacity-100">🛡️</div>
					<p className="max-w-xs mx-auto text-xs font-black uppercase tracking-[0.3em] text-text-muted leading-relaxed opacity-50">All systems operational. Queue clear.</p>
				</div>
			)}
		</div>
	);
}
