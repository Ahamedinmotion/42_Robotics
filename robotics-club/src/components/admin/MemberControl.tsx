"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

// ── Types ────────────────────────────────────────────

interface MemberUser {
	id: string;
	login: string;
	name: string;
	avatar: string | null;
	currentRank: string;
	status: string;
	labAccessEnabled: boolean;
	joinedAt: string;
	updatedAt: string;
}

interface ActiveMember extends MemberUser {
	projectTitle: string | null;
	teamId: string | null;
	blackholeDeadline: string | null;
	daysAgo: number;
	completedCount: number;
}

interface MemberControlProps {
	activeMembers: ActiveMember[];
	waitlist: MemberUser[];
	blackholed: MemberUser[];
	alumni: (MemberUser & { alumniOptedIn: boolean })[];
	activeCount: number;
}

// ── Helpers ──────────────────────────────────────────

function formatDate(d: string) {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function daysUntil(d: string) {
	const ms = new Date(d).getTime() - Date.now();
	return Math.max(0, Math.floor(ms / 86400000));
}

function healthColour(daysAgo: number, bhDays: number | null) {
	if ((bhDays !== null && bhDays < 3) || daysAgo > 14) return "border-l-red-500";
	if (daysAgo > 7) return "border-l-yellow-500";
	return "border-l-green-500";
}

// ── Component ────────────────────────────────────────

export function MemberControl({ activeMembers, waitlist, blackholed, alumni, activeCount }: MemberControlProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [extendInput, setExtendInput] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState<string | null>(null);
	const cap = 30;

	const callApi = async (url: string, body: any, successMsg: string) => {
		setLoading(url);
		try {
			const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
			if (res.ok) { toast(successMsg); router.refresh(); } else { const j = await res.json(); toast(j.error || "Failed", "error"); }
		} catch { toast("Network error", "error"); } finally { setLoading(null); }
	};

	return (
		<div className="space-y-8">
			{/* Stats bar */}
			<div className="flex flex-wrap gap-3">
				<span className={`rounded-full px-3 py-1 text-xs font-bold ${activeCount >= 25 ? "bg-red-900/40 text-red-400" : "bg-accent/20 text-accent"}`}>{activeCount} / {cap} Active</span>
				<span className="rounded-full bg-panel2 px-3 py-1 text-xs font-bold text-text-muted">{waitlist.length} Waitlisted</span>
				<span className="rounded-full bg-panel2 px-3 py-1 text-xs font-bold text-text-muted">{blackholed.length} Blackholed</span>
				<span className="rounded-full bg-panel2 px-3 py-1 text-xs font-bold text-text-muted">{alumni.length} Alumni</span>
			</div>

			{/* Active members */}
			<Card className="space-y-2">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Active Members</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead><tr className="border-b border-border-color text-left text-xs text-text-muted">
							<th className="py-2">Member</th><th>Rank</th><th>Project</th><th>Blackhole</th><th>Activity</th><th>Done</th><th>Actions</th>
						</tr></thead>
						<tbody>
							{activeMembers.map((m) => {
								const bhDays = m.blackholeDeadline ? daysUntil(m.blackholeDeadline) : null;
								return (
									<tr key={m.id} className={`border-b border-border-color border-l-2 ${healthColour(m.daysAgo, bhDays)}`}>
										<td className="py-2">
											<div className="flex items-center gap-2">
												{m.avatar ? <img src={m.avatar} className="h-6 w-6 rounded-full object-cover" alt="" /> : <div className="flex h-6 w-6 items-center justify-center rounded-full bg-panel2 text-[9px] font-bold text-text-muted">{m.login[0].toUpperCase()}</div>}
												<div><p className="font-medium text-text-primary">{m.name}</p><p className="text-[10px] text-text-muted">@{m.login}</p></div>
											</div>
										</td>
										<td><Badge rank={m.currentRank as any} size="sm" /></td>
										<td className="text-text-muted">{m.projectTitle || "—"}</td>
										<td className="text-text-muted">{bhDays !== null ? `${bhDays}d` : "—"}</td>
										<td className="text-text-muted">{m.daysAgo}d ago</td>
										<td className="text-text-muted">{m.completedCount}</td>
										<td>
											<div className="flex items-center gap-1">
												{m.teamId && (
													<div className="flex items-center gap-1">
														<input value={extendInput[m.teamId] || ""} onChange={(e) => setExtendInput((p) => ({ ...p, [m.teamId!]: e.target.value }))} placeholder="d" className="w-8 rounded border border-border-color bg-background px-1 py-0.5 text-[10px] text-text-primary" type="number" />
														<button onClick={() => callApi(`/api/admin/teams/${m.teamId}/extend`, { days: Number(extendInput[m.teamId!]) || 7 }, "Deadline extended")} className="text-[10px] text-accent hover:underline" disabled={loading !== null}>+</button>
													</div>
												)}
												<button onClick={() => { if (confirm(`Blackhole ${m.login}?`)) callApi(`/api/admin/users/${m.id}/status`, { status: "BLACKHOLED" }, `${m.login} blackholed`); }} className="text-[10px] text-accent-urgency hover:underline" disabled={loading !== null}>Remove</button>
												<button onClick={() => callApi(`/api/admin/users/${m.id}/lab-access`, { enabled: !m.labAccessEnabled }, `Lab access ${!m.labAccessEnabled ? "enabled" : "disabled"}`)} className="text-[10px] text-accent-secondary hover:underline" disabled={loading !== null}>Lab</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</Card>

			{/* Waitlist */}
			<Card className="space-y-2">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Waitlist</h3>
				{waitlist.length === 0 ? <p className="text-sm italic text-text-muted">No one waiting</p> : (
					<table className="w-full text-sm">
						<thead><tr className="border-b border-border-color text-left text-xs text-text-muted"><th className="py-2">#</th><th>Member</th><th>Joined</th><th>Actions</th></tr></thead>
						<tbody>
							{waitlist.map((m, i) => (
								<tr key={m.id} className="border-b border-border-color">
									<td className="py-2 text-text-muted">{i + 1}</td>
									<td><div className="flex items-center gap-2">{m.avatar ? <img src={m.avatar} className="h-5 w-5 rounded-full object-cover" alt="" /> : <div className="flex h-5 w-5 items-center justify-center rounded-full bg-panel2 text-[8px] font-bold text-text-muted">{m.login[0].toUpperCase()}</div>}<span className="text-text-primary">{m.name}</span><span className="text-xs text-text-muted">@{m.login}</span></div></td>
									<td className="text-xs text-text-muted">{formatDate(m.joinedAt)}</td>
									<td><Button variant="primary" size="sm" disabled={activeCount >= cap || loading !== null} onClick={() => callApi(`/api/admin/users/${m.id}/status`, { status: "ACTIVE" }, `${m.login} promoted`)}>Promote</Button></td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</Card>

			{/* Blackholed */}
			<Card className="space-y-2">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Blackholed</h3>
				{blackholed.length === 0 ? <p className="text-sm italic text-text-muted">None</p> : (
					<ul className="space-y-2">
						{blackholed.map((m) => (
							<li key={m.id} className="flex items-center justify-between">
								<div className="flex items-center gap-2"><span className="text-sm text-text-primary">{m.name}</span><span className="text-xs text-text-muted">@{m.login}</span></div>
								<Button variant="ghost" size="sm" disabled={loading !== null} onClick={() => callApi(`/api/admin/users/${m.id}/status`, { status: "WAITLIST" }, `${m.login} reinstated`)}>Reinstate</Button>
							</li>
						))}
					</ul>
				)}
			</Card>
		</div>
	);
}
