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
		<div className="space-y-6">
			<div className="flex gap-2 overflow-x-auto">
				{tabs.map((t) => (
					<button key={t} onClick={() => setTab(t)} className={`${chipBase} ${tab === t ? "bg-accent text-background" : "bg-panel border border-border-color text-text-muted"}`}>{t}</button>
				))}
			</div>

			{/* Fabrication */}
			{showFab && fabrication.length > 0 && (
				<Card className="space-y-3">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Print / CNC Requests</h3>
					{fabrication.map((f) => (
						<div key={f.id} className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
							<div className="flex items-center justify-between"><span className="text-sm font-semibold text-text-primary">{f.userName} <span className="text-text-muted">@{f.userLogin}</span></span><span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">{f.machineType}</span></div>
							<p className="line-clamp-2 text-xs text-text-muted">{f.purpose}</p>
							{f.material && <p className="text-xs text-text-muted">Material: {f.material}</p>}
							{f.modelFileUrl && <a href={f.modelFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">Model file ↗</a>}
							<div className="flex items-center gap-2">
								<Button variant="primary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/fabrication/${f.id}`, { status: "APPROVED" }, "Approved")}>Approve</Button>
								<input value={noteInputs[f.id] || ""} onChange={(e) => setNoteInputs((p) => ({ ...p, [f.id]: e.target.value }))} placeholder="Reason..." className="flex-1 rounded border border-border-color bg-background px-2 py-1 text-xs text-text-primary placeholder:text-text-muted" />
								<Button variant="danger" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/fabrication/${f.id}`, { status: "REJECTED", moderatorNote: noteInputs[f.id] }, "Rejected")}>Reject</Button>
							</div>
						</div>
					))}
				</Card>
			)}

			{/* Materials */}
			{showMat && materials.length > 0 && (
				<Card className="space-y-3">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Material Requests</h3>
					{materials.map((m) => (
						<div key={m.id} className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
							<div className="flex items-center justify-between"><span className="text-sm font-semibold text-text-primary">{m.teamName} — {m.projectTitle}</span></div>
							<p className="text-xs text-text-primary">{m.itemName} ×{m.quantity}{m.estimatedCost ? ` · ~${m.estimatedCost} AED` : ""}</p>
							{m.justification && <p className="text-xs text-text-muted">{m.justification}</p>}
							<div className="flex gap-2">
								<Button variant="primary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/materials/${m.id}`, { status: "APPROVED" }, "Approved")}>Approve</Button>
								<Button variant="danger" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/materials/${m.id}`, { status: "DENIED" }, "Denied")}>Deny</Button>
							</div>
						</div>
					))}
				</Card>
			)}

			{/* Proposals */}
			{showProp && proposals.length > 0 && (
				<Card className="space-y-3">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Project Proposals</h3>
					{proposals.map((p) => (
						<div key={p.id} className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
							<div className="flex items-center gap-2"><span className="text-sm font-bold text-text-primary">{p.title}</span><span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">{p.proposedRank}</span></div>
							<p className="text-xs text-text-muted">By {p.proposedByName} (Rank {p.proposedByRank})</p>
							{p.description && <p className="text-xs text-text-muted">{p.description}</p>}
							{p.learningObjectives && <p className="text-xs text-text-muted">Objectives: {p.learningObjectives}</p>}
							{p.buildPlan && <details className="text-xs text-text-muted"><summary className="cursor-pointer text-accent">Build Plan</summary><p className="mt-1">{p.buildPlan}</p></details>}
							<div className="flex items-center gap-2">
								<input value={noteInputs[p.id] || ""} onChange={(e) => setNoteInputs((prev) => ({ ...prev, [p.id]: e.target.value }))} placeholder="Note..." className="flex-1 rounded border border-border-color bg-background px-2 py-1 text-xs text-text-primary placeholder:text-text-muted" />
								<Button variant="primary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/proposals/${p.id}`, { status: "APPROVED", moderatorNote: noteInputs[p.id] }, "Approved → DRAFT project created")}>Approve</Button>
								<Button variant="danger" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/proposals/${p.id}`, { status: "REJECTED", moderatorNote: noteInputs[p.id] }, "Rejected")}>Reject</Button>
							</div>
						</div>
					))}
				</Card>
			)}

			{/* Conflicts */}
			{showConf && conflicts.length > 0 && (
				<Card className="space-y-3">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Conflict Flags</h3>
					{conflicts.map((c) => (
						<div key={c.id} className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
							<div className="flex items-center justify-between"><span className="text-sm font-semibold text-text-primary">{c.teamName} — {c.projectTitle}</span><span className="text-xs text-text-muted">{formatDate(c.createdAt)}</span></div>
							<p className="text-xs text-text-primary">{c.description}</p>
							<div className="flex items-center gap-2">
								<input value={noteInputs[c.id] || ""} onChange={(e) => setNoteInputs((prev) => ({ ...prev, [c.id]: e.target.value }))} placeholder="Moderator note..." className="flex-1 rounded border border-border-color bg-background px-2 py-1 text-xs text-text-primary placeholder:text-text-muted" />
								<Button variant="secondary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/conflicts/${c.id}`, { status: "REVIEWED", moderatorNote: noteInputs[c.id] }, "Marked reviewed")}>Reviewed</Button>
								<Button variant="primary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/conflicts/${c.id}`, { status: "RESOLVED", moderatorNote: noteInputs[c.id] }, "Resolved")}>Resolve</Button>
							</div>
						</div>
					))}
				</Card>
			)}

			{/* Damage */}
			{showDam && damage.length > 0 && (
				<Card className="space-y-3">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Damage Reports</h3>
					{damage.map((d) => (
						<div key={d.id} className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
							<div className="flex items-center justify-between"><span className="text-sm font-semibold text-text-primary">{d.reporterName} — {d.itemDescription}</span>{d.estimatedValue !== null && <span className={`text-xs font-bold ${d.estimatedValue > 50 ? "text-accent-urgency" : "text-text-muted"}`}>{d.estimatedValue} AED</span>}</div>
							{d.description && <p className="text-xs text-text-muted">{d.description}</p>}
							<div className="flex gap-2">
								<Button variant="secondary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/damage/${d.id}`, { status: "UNDER_REVIEW" }, "Under review")}>Under Review</Button>
								<Button variant="primary" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/damage/${d.id}`, { status: "RESOLVED" }, "Resolved")}>Resolved</Button>
							</div>
						</div>
					))}
				</Card>
			)}

			{/* Empty state */}
			{fabrication.length === 0 && materials.length === 0 && proposals.length === 0 && conflicts.length === 0 && damage.length === 0 && (
				<p className="py-12 text-center text-sm italic text-text-muted">All clear — nothing in the queue.</p>
			)}
		</div>
	);
}
