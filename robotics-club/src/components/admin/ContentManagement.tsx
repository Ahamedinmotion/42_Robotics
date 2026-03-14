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
	subjectSheetUrl: string | null;
	evaluationSheetUrl: string | null;
}

interface ContentManagementProps {
	projects: ProjectItem[];
	userRole: string;
}

// ── Component ────────────────────────────────────────

const statusChip: Record<string, string> = {
	DRAFT: "bg-yellow-900/40 text-yellow-400",
	ACTIVE: "bg-green-900/40 text-green-400",
	RETIRED: "bg-gray-800/40 text-gray-400",
};

const RANKS_LIST = ["E", "D", "C", "B", "A", "S"];

export function ContentManagement({ projects, userRole }: ContentManagementProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [showAdd, setShowAdd] = useState(false);
	const [activeTab, setActiveTab] = useState<"projects" | "sheets">("projects");
	const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
	const [loading, setLoading] = useState(false);
	const isVpOrPres = userRole === "VP" || userRole === "PRESIDENT";
	const canManage = ["PROJECT_MANAGER", "VP", "PRESIDENT"].includes(userRole);

	// New project form state — defaults loaded from settings
	const [form, setForm] = useState({ title: "", description: "", rank: "E", teamSizeMin: "2", teamSizeMax: "5", blackholeDays: "60", skillTags: "", isUnique: false, subjectSheetUrl: "", evaluationSheetUrl: "" });

	// Load club settings for dynamic defaults
	useEffect(() => {
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
	}, []);

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
		await callApi("/api/admin/projects", "POST", {
			...form,
			teamSizeMin: Number(form.teamSizeMin),
			teamSizeMax: Number(form.teamSizeMax),
			blackholeDays: Number(form.blackholeDays),
		}, "Project created");
		setShowAdd(false);
		setForm((f) => ({ ...f, title: "", description: "", rank: "E", skillTags: "", isUnique: false, subjectSheetUrl: "", evaluationSheetUrl: "" }));
	};

	const toggleStatus = (id: string, current: string) => {
		if (current === "DRAFT") callApi(`/api/admin/projects/${id}`, "PATCH", { status: "ACTIVE" }, "Published");
		else if (current === "ACTIVE") callApi(`/api/admin/projects/${id}`, "PATCH", { status: "RETIRED" }, "Retired");
		else callApi(`/api/admin/projects/${id}`, "PATCH", { status: "ACTIVE" }, "Reactivated");
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
			</div>

			{activeTab === "projects" ? (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Skill Tree Editor</h3>
						<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>{showAdd ? "Cancel" : "Add New Project"}</Button>
					</div>

			{showAdd && (
				<Card className="space-y-3">
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
					<Button variant="primary" size="sm" disabled={loading || !form.title} onClick={submitProject}>Save as Draft</Button>
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
											<span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${statusChip[p.status] || ""}`}>{p.status}</span>
											<span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{p.teamCount} Squads</span>
										</div>
										{isVpOrPres && (
											<Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest" disabled={loading} onClick={() => toggleStatus(p.id, p.status)}>
												{p.status === "DRAFT" ? "Publish" : p.status === "ACTIVE" ? "Retire" : "Reactivate"}
											</Button>
										)}
									</div>
								))}
							</div>
						</Card>
					))}
				</div>
			) : (
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
		</div>
	);
}
