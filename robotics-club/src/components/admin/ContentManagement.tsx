"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EvalSheetEditor } from "./evaluations/EvalSheetEditor";

// ── Types ────────────────────────────────────────────

interface ProjectItem {
	id: string;
	title: string;
	rank: string;
	status: string;
	teamCount: number;
	description: string;
	teamSizeMin: number;
	teamSizeMax: number;
	blackholeDays: number;
	skillTags: string[];
	isUnique: boolean;
	isRequired: boolean;
	subjectSheetUrl: string | null;
	evaluationSheetUrl: string | null;
	objectives: string[];
	deliverables: string[];
}

interface RankRequirementItem {
	id: string;
	rank: string;
	projectsRequired: number;
}

interface ContentManagementProps {
	projects: ProjectItem[];
	userRole: string;
	rankRequirements?: RankRequirementItem[];
}

// ── Component ────────────────────────────────────────

const statusChip: Record<string, string> = {
	DRAFT: "bg-yellow-900/40 text-yellow-400",
	ACTIVE: "bg-green-900/40 text-green-400",
	RETIRED: "bg-gray-800/40 text-gray-400",
};

const RANKS_LIST = ["E", "D", "C", "B", "A", "S"];

export function ContentManagement({ projects, userRole, rankRequirements = [] }: ContentManagementProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [showAdd, setShowAdd] = useState(false);
	const [activeTab, setActiveTab] = useState<"projects" | "sheets" | "rankReqs">("projects");
	const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
	const [loading, setLoading] = useState(false);
	const isVpOrPres = userRole === "VP" || userRole === "PRESIDENT";
	const canManage = ["PROJECT_MANAGER", "VP", "PRESIDENT"].includes(userRole);

	// New/Edit project form state — defaults loaded from settings
	const [editingId, setEditingId] = useState<string | null>(null);
	const [togglingReq, setTogglingReq] = useState<string | null>(null);
	const [form, setForm] = useState({ 
		title: "", 
		description: "", 
		rank: "E", 
		teamSizeMin: "2", 
		teamSizeMax: "5", 
		blackholeDays: "60", 
		skillTags: "", 
		isUnique: false, 
		subjectSheetUrl: "", 
		evaluationSheetUrl: "",
		objectives: "", 
		deliverables: "",
		updateActiveTeams: false
	});

	// Load club settings for dynamic defaults
	useEffect(() => {
		if (editingId) return; // Don't overwrite form if editing
		fetch("/api/admin/settings")
			.then((r) => r.json())
			.then((json) => {
				if (json.success) {
					setForm((f) => ({
						...f,
						teamSizeMin: String(json.data.minTeamSize),
						teamSizeMax: String(json.data.maxTeamSize),
						blackholeDays: String(json.data.defaultBlackholeDays),
					}));
				}
			})
			.catch(() => {});
	}, [editingId]);

	const [editingReqs, setEditingReqs] = useState<Record<string, number>>(() => {
		const initial: Record<string, number> = {};
		for (const rank of RANKS_LIST) {
			const existing = rankRequirements.find(r => r.rank === rank);
			initial[rank] = existing ? existing.projectsRequired : 4;
		}
		return initial;
	});
	const [savingReqs, setSavingReqs] = useState<Record<string, boolean>>({});

	const saveRankReq = async (rank: string) => {
		setSavingReqs(prev => ({ ...prev, [rank]: true }));
		try {
			const res = await fetch(`/api/admin/rank-requirements/${rank}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectsRequired: editingReqs[rank] }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error);
			toast(`Rank ${rank} requirement updated`);
			router.refresh();
		} catch (err: any) {
			toast(err.message || "Failed to update rank requirement", "error");
		} finally {
			setSavingReqs(prev => ({ ...prev, [rank]: false }));
		}
	};

	if (!canManage) {
		return <p className="py-12 text-center text-sm text-text-muted">Access restricted to Project Managers and above.</p>;
	}

	const callApi = async (url: string, method: string, body: any, msg: string) => {
		setLoading(true);
		try {
			const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
			if (res.ok) { toast(msg); router.refresh(); } else { const j = await res.json(); toast(j.error || "Failed", "error"); }
		} catch { toast("Network error", "error"); } finally { setLoading(false); }
	};

	const submitProject = async () => {
		const payload = {
			...form,
			teamSizeMin: Number(form.teamSizeMin),
			teamSizeMax: Number(form.teamSizeMax),
			blackholeDays: Number(form.blackholeDays),
			objectives: form.objectives.split("\n").map(s => s.trim()).filter(Boolean),
			deliverables: form.deliverables.split("\n").map(s => s.trim()).filter(Boolean),
		};

		if (editingId) {
			await callApi(`/api/admin/projects/${editingId}`, "PATCH", payload, "Project updated");
			setEditingId(null);
		} else {
			await callApi("/api/admin/projects", "POST", payload, "Project created");
		}
		
		setShowAdd(false);
		setForm({ 
			title: "", 
			description: "", 
			rank: "E", 
			teamSizeMin: "2", 
			teamSizeMax: "5", 
			blackholeDays: "60", 
			skillTags: "", 
			isUnique: false, 
			subjectSheetUrl: "", 
			evaluationSheetUrl: "", 
			objectives: "", 
			deliverables: "",
			updateActiveTeams: false 
		});
	};

	const handleEdit = (p: ProjectItem) => {
		setEditingId(p.id);
		setForm({
			title: p.title,
			description: p.description,
			rank: p.rank,
			teamSizeMin: String(p.teamSizeMin),
			teamSizeMax: String(p.teamSizeMax),
			blackholeDays: String(p.blackholeDays),
			skillTags: p.skillTags.join(", "),
			isUnique: p.isUnique,
			subjectSheetUrl: p.subjectSheetUrl || "",
			evaluationSheetUrl: p.evaluationSheetUrl || "",
			objectives: p.objectives?.join("\n") || "",
			deliverables: p.deliverables?.join("\n") || "",
			updateActiveTeams: false
		});
		setShowAdd(true);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const toggleStatus = (id: string, current: string) => {
		if (current === "DRAFT") callApi(`/api/admin/projects/${id}`, "PATCH", { status: "ACTIVE" }, "Published");
		else if (current === "ACTIVE") callApi(`/api/admin/projects/${id}`, "PATCH", { status: "RETIRED" }, "Retired");
		else callApi(`/api/admin/projects/${id}`, "PATCH", { status: "ACTIVE" }, "Reactivated");
	};

	const toggleRequired = async (p: ProjectItem) => {
		setTogglingReq(p.id);
		try {
			const res = await fetch(`/api/admin/projects/${p.id}/required`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isRequired: !p.isRequired })
			});
			const json = await res.json();
			if (!json.ok) {
				toast(json.error || "Validation failed", "error");
			} else {
				toast(`Project marked as ${!p.isRequired ? "REQUIRED" : "OPTIONAL"}`);
				router.refresh();
			}
		} catch {
			toast("Network error", "error");
		} finally {
			setTogglingReq(null);
		}
	};

	const grouped = RANKS_LIST.map((rank) => ({
		rank,
		items: projects.filter((p) => p.rank === rank),
	})).filter((g) => g.items.length > 0);

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4 border-b border-border-color/30 pb-4">
				<button
					onClick={() => setActiveTab("projects")}
					className={`text-xs font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-lg ${
						activeTab === "projects" ? "text-accent bg-accent/10 border border-accent/20" : "text-text-muted hover:text-text-primary"
					}`}
				>
					Skill Tree
				</button>
				<button
					onClick={() => setActiveTab("sheets")}
					className={`text-xs font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-lg ${
						activeTab === "sheets" ? "text-accent bg-accent/10 border border-accent/20" : "text-text-muted hover:text-text-primary"
					}`}
				>
					Evaluation Sheets
				</button>
				<button
					onClick={() => setActiveTab("rankReqs")}
					className={`text-xs font-black uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-lg ${
						activeTab === "rankReqs" ? "text-accent bg-accent/10 border border-accent/20" : "text-text-muted hover:text-text-primary"
					}`}
				>
					Rank Requirements
				</button>
			</div>

			{activeTab === "projects" && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Skill Tree Editor</h3>
						<Button 
							variant="primary" 
							size="sm" 
							onClick={() => {
								if (showAdd && editingId) {
									setEditingId(null);
									setForm({ title: "", description: "", rank: "E", teamSizeMin: "2", teamSizeMax: "5", blackholeDays: "60", skillTags: "", isUnique: false, subjectSheetUrl: "", evaluationSheetUrl: "", objectives: "", deliverables: "", updateActiveTeams: false });
								}
								setShowAdd(!showAdd);
							}}
						>
							{showAdd ? "Cancel" : "Add New Project"}
						</Button>
					</div>

			{showAdd && (
				<Card className="space-y-3">
					<div className="flex items-center justify-between border-b border-border-color/20 pb-2 mb-2">
						<h4 className="text-[10px] font-black uppercase tracking-widest text-accent">
							{editingId ? `Editing: ${form.title}` : "Create New Mission"}
						</h4>
					</div>
					<input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
					<textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputCls} />
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-muted">Rank</label>
							<select value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} className={inputCls}>{RANKS_LIST.map((r) => <option key={r} value={r}>{r}</option>)}</select>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-muted">Min Team Size</label>
							<input placeholder="2" type="number" value={form.teamSizeMin} onChange={(e) => setForm({ ...form, teamSizeMin: e.target.value })} className={inputCls} />
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-muted">Max Team Size</label>
							<input placeholder="4" type="number" value={form.teamSizeMax} onChange={(e) => setForm({ ...form, teamSizeMax: e.target.value })} className={inputCls} />
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-muted">Blackhole Days</label>
							<input placeholder="28" type="number" value={form.blackholeDays} onChange={(e) => setForm({ ...form, blackholeDays: e.target.value })} className={inputCls} />
						</div>
					</div>
					<input placeholder="Skill tags (comma-separated)" value={form.skillTags} onChange={(e) => setForm({ ...form, skillTags: e.target.value })} className={inputCls} />
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2 text-xs text-text-muted"><input type="checkbox" checked={form.isUnique} onChange={(e) => setForm({ ...form, isUnique: e.target.checked })} className="accent-accent" />Unique project</label>
					</div>
					<input placeholder="Subject sheet URL (optional)" value={form.subjectSheetUrl} onChange={(e) => setForm({ ...form, subjectSheetUrl: e.target.value })} className={inputCls} />
					<input placeholder="Evaluation sheet URL (optional)" value={form.evaluationSheetUrl} onChange={(e) => setForm({ ...form, evaluationSheetUrl: e.target.value })} className={inputCls} />
					<textarea placeholder="Objectives (one per line)" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={3} className={inputCls} />
					<textarea placeholder="Deliverables (one per line)" value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} rows={3} className={inputCls} />
					
					{editingId && (
						<div className="flex items-center gap-4 bg-accent/5 p-3 rounded-xl border border-accent/10">
							<label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent cursor-pointer">
								<input 
									type="checkbox" 
									checked={form.updateActiveTeams} 
									onChange={(e) => setForm({ ...form, updateActiveTeams: e.target.checked })} 
									className="accent-accent" 
								/>
								Update for Current and Future Squads
							</label>
						</div>
					)}
					<div className="flex gap-2">
						<Button variant="primary" size="sm" className="flex-1" disabled={loading || !form.title} onClick={submitProject}>
							{editingId ? "Update Project" : "Save as Draft"}
						</Button>
						{editingId && (
							<Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setShowAdd(false); }}>Cancel</Button>
						)}
					</div>
				</Card>
			)}

					{grouped.map((g) => (
						<Card key={g.rank} className="space-y-4">
							<h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted px-2">Rank {g.rank}</h4>
							<div className="space-y-2">
								{g.items.map((p) => (
									<div key={p.id} className="flex items-center justify-between rounded-xl bg-panel2/50 border border-white/5 p-3 hover:bg-panel2 transition-colors">
										<div className="flex items-center gap-3">
											<Badge rank={p.rank as any} size="sm" />
											<span className="text-sm font-bold text-text-primary">{p.title}</span>
											{p.isRequired && (
												<span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-500">REQUIRED</span>
											)}
											<span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusChip[p.status] || ""}`}>{p.status}</span>
											<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{p.teamCount} Squads</span>
										</div>
										<div className="flex items-center gap-2">
											{isVpOrPres && (
												<label className="flex items-center gap-1.5 cursor-pointer mr-2 pr-2 border-r border-white/10" title="Toggle Required Status">
													<span className={`text-[10px] font-black uppercase tracking-widest ${p.isRequired ? "text-red-500" : "text-text-muted/50"}`}>Req</span>
													<input 
														type="checkbox" 
														checked={p.isRequired} 
														disabled={togglingReq === p.id}
														onChange={() => toggleRequired(p)} 
														className="accent-red-500 h-3 w-3 opacity-50 hover:opacity-100 transition-opacity disabled:opacity-20 cursor-pointer" 
													/>
												</label>
											)}
											<Button 
												variant="ghost" 
												size="sm" 
												className="h-10 w-10 p-0 flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-accent/10 hover:text-accent transition-all border border-transparent hover:border-accent/20"
												onClick={() => handleEdit(p)}
											>
												<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.243 3.243a3.003 3.003 0 014.242 4.242L10.828 17.172a4 4 0 01-1.414.828l-3.232.969.97-3.232a4 4 0 01.828-1.414l7.686-7.686z" />
												</svg>
											</Button>
											{isVpOrPres && (
												<Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest" disabled={loading} onClick={() => toggleStatus(p.id, p.status)}>
													{p.status === "DRAFT" ? "Publish" : p.status === "ACTIVE" ? "Retire" : "Reactivate"}
												</Button>
											)}
										</div>
									</div>
								))}
							</div>
						</Card>
					))}
				</div>
			)}
			
			{activeTab === "sheets" && (
				<div className="space-y-6">
					{!selectedProject ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{projects.map((p) => (
								<Card 
									key={p.id} 
									className="p-6 hover:border-accent/40 cursor-pointer transition-all group bg-panel/30"
									onClick={() => setSelectedProject(p)}
								>
									<div className="flex items-center justify-between mb-4">
										<Badge rank={p.rank as any} size="sm" />
										<div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
									</div>
									<h4 className="text-sm font-black uppercase tracking-widest text-text-primary group-hover:text-accent transition-colors">{p.title}</h4>
									<p className="text-[10px] text-text-muted mt-3 line-clamp-2 leading-relaxed uppercase tracking-wider">Configure the mission rubric and assessment criteria.</p>
								</Card>
							))}
						</div>
					) : (
						<div className="space-y-6">
							<button 
								onClick={() => setSelectedProject(null)}
								className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
							>
								← RETURN TO MISSION CONTROL
							</button>
							<EvalSheetEditor 
								projectId={selectedProject.id} 
								projectTitle={selectedProject.title} 
							/>
						</div>
					)}
				</div>
			)}
			
			{activeTab === "rankReqs" && (
				<div className="space-y-6">
					<Card className="space-y-4">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Rank Advancements</h3>
						<p className="text-xs text-text-muted mb-4">Set the minimum number of completed required projects needed to advance from each rank.</p>
						<div className="space-y-4">
							{RANKS_LIST.map((rank) => (
								<div key={rank} className="flex items-center justify-between rounded-xl bg-panel2/50 border border-white/5 p-4 hover:bg-panel2 transition-colors">
									<div className="flex items-center gap-4">
										<Badge rank={rank as any} size="lg" />
										<span className="text-sm font-bold text-text-primary">Rank {rank}</span>
									</div>
									<div className="flex items-center gap-3">
										<label className="text-xs text-text-muted font-medium">Projects Required:</label>
										<input 
											type="number" 
											min="1"
											value={editingReqs[rank] ?? 4} 
											onChange={(e) => setEditingReqs(prev => ({ ...prev, [rank]: parseInt(e.target.value) || 1 }))}
											className="w-20 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary text-center" 
										/>
										<Button 
											variant="primary" 
											size="sm" 
											disabled={savingReqs[rank]}
											onClick={() => saveRankReq(rank)}
										>
											{savingReqs[rank] ? "Saving..." : "Save"}
										</Button>
									</div>
								</div>
							))}
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
