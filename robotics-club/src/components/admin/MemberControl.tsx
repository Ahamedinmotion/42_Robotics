"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

// ── Types ────────────────────────────────────────────

interface MemberUser {
	id: string;
	login: string;
	name: string;
	image: string | null;
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
	maxActiveMembers: number;
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

// ── Action Menu Component ────────────────────────────

function ActionMenu({
	member,
	loading,
	onAction,
}: {
	member: ActiveMember;
	loading: boolean;
	onAction: (action: string, payload?: any) => void;
}) {
	const [open, setOpen] = useState(false);
	const [extendDays, setExtendDays] = useState("7");

	return (
		<div className="relative">
			<button
				onClick={() => setOpen(!open)}
				className="rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-panel2 hover:text-text-primary"
			>
				⋯
			</button>

			{open && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
					<div className="absolute right-0 z-50 mt-1 w-52 rounded-lg border border-border-color bg-panel p-1 shadow-xl">
						{/* View Profile */}
						<button
							onClick={() => { onAction("profile"); setOpen(false); }}
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-primary transition-colors hover:bg-panel2"
						>
							👤 View Profile
						</button>

						{/* Lab Access toggle */}
						<button
							onClick={() => { onAction("lab"); setOpen(false); }}
							disabled={loading}
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text-primary transition-colors hover:bg-panel2"
						>
							🔑 {member.labAccessEnabled ? "Revoke" : "Grant"} Lab Access
						</button>

						{/* Promote Rank */}
						<button
							onClick={() => { onAction("promote-rank"); setOpen(false); }}
							disabled={loading}
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-accent transition-colors hover:bg-panel2"
						>
							⬆ Promote Rank
						</button>

						{/* Grant Alumni */}
						<button
							onClick={() => { onAction("alumni"); setOpen(false); }}
							disabled={loading}
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-accent-secondary transition-colors hover:bg-panel2"
						>
							🎓 Grant Alumni
						</button>

						{/* Extend Deadline */}
						{member.teamId && (
							<div className="flex items-center gap-1 px-3 py-2">
								<span className="text-xs text-text-muted">⏰ Extend</span>
								<input
									value={extendDays}
									onChange={(e) => setExtendDays(e.target.value)}
									type="number"
									className="w-12 rounded border border-border-color bg-background px-1 py-0.5 text-xs text-text-primary"
									placeholder="d"
								/>
								<button
									onClick={() => { onAction("extend", Number(extendDays) || 7); setOpen(false); }}
									disabled={loading}
									className="rounded px-2 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
								>
									Go
								</button>
							</div>
						)}

						<div className="my-1 border-t border-border-color" />

						{/* Blackhole (destructive) */}
						<button
							onClick={() => { onAction("blackhole"); setOpen(false); }}
							disabled={loading}
							className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-accent-urgency transition-colors hover:bg-red-900/20"
						>
							🕳 Remove (Blackhole)
						</button>
					</div>
				</>
			)}
		</div>
	);
}

// ── Component ────────────────────────────────────────

export function MemberControl({ activeMembers, waitlist, blackholed, alumni, activeCount, maxActiveMembers }: MemberControlProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [loading, setLoading] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const cap = maxActiveMembers;

	const callApi = async (url: string, body: any, successMsg: string, method = "PATCH") => {
		setLoading(url);
		try {
			const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
			if (res.ok) { toast(successMsg); router.refresh(); } else { const j = await res.json(); toast(j.error || "Failed", "error"); }
		} catch { toast("Network error", "error"); } finally { setLoading(null); }
	};

	const handleAction = (member: ActiveMember, action: string, payload?: any) => {
		switch (action) {
			case "profile":
				window.open(`/profile/${member.login}`, "_blank");
				break;
			case "lab":
				callApi(`/api/admin/users/${member.id}/lab-access`, { enabled: !member.labAccessEnabled }, `Lab access ${!member.labAccessEnabled ? "enabled" : "disabled"}`);
				break;
			case "promote-rank":
				if (confirm(`Promote ${member.login} to next rank?`))
					callApi(`/api/admin/users/${member.id}/promote-rank`, {}, `${member.login} promoted`);
				break;
			case "alumni":
				if (confirm(`Grant alumni status to ${member.login}?`))
					callApi(`/api/admin/users/${member.id}/status`, { status: "ALUMNI" }, `${member.login} is now alumni`);
				break;
			case "extend":
				if (member.teamId)
					callApi(`/api/admin/teams/${member.teamId}/extend`, { days: payload || 7 }, "Deadline extended");
				break;
			case "blackhole":
				if (confirm(`Blackhole ${member.login}? This cannot be easily undone.`))
					callApi(`/api/admin/users/${member.id}/status`, { status: "BLACKHOLED" }, `${member.login} blackholed`);
				break;
		}
	};

	// Filter active members
	const filtered = search
		? activeMembers.filter((m) =>
			m.name.toLowerCase().includes(search.toLowerCase()) ||
			m.login.toLowerCase().includes(search.toLowerCase()) ||
			(m.projectTitle || "").toLowerCase().includes(search.toLowerCase())
		)
		: activeMembers;

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
			<Card className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Active Members</h3>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search members..."
						className="w-48 rounded-md border border-border-color bg-background px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
					/>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead><tr className="border-b border-border-color text-left text-xs text-text-muted">
							<th className="py-2">Member</th><th>Rank</th><th>Project</th><th>Blackhole</th><th>Activity</th><th>Done</th><th className="text-right">Actions</th>
						</tr></thead>
						<tbody>
							{filtered.map((m) => {
								const bhDays = m.blackholeDeadline ? daysUntil(m.blackholeDeadline) : null;
								return (
									<tr key={m.id} className={`border-b border-border-color border-l-2 ${healthColour(m.daysAgo, bhDays)}`}>
										<td className="py-2">
											<div className="flex items-center gap-2">
												{m.image ? (
													<Image src={m.image} width={24} height={24} className="h-6 w-6 rounded-full object-cover" alt="" />
												) : (
													<div className="flex h-6 w-6 items-center justify-center rounded-full bg-panel2 text-[9px] font-bold text-text-muted">{m.login[0].toUpperCase()}</div>
												)}
												<div><p className="font-medium text-text-primary">{m.name}</p><p className="text-[10px] text-text-muted">@{m.login}</p></div>
											</div>
										</td>
										<td><Badge rank={m.currentRank as any} size="sm" /></td>
										<td className="text-text-muted">{m.projectTitle || "—"}</td>
										<td className="text-text-muted">{bhDays !== null ? `${bhDays}d` : "—"}</td>
										<td className="text-text-muted">{m.daysAgo}d ago</td>
										<td className="text-text-muted">{m.completedCount}</td>
										<td className="text-right">
											<ActionMenu
												member={m}
												loading={loading !== null}
												onAction={(action, payload) => handleAction(m, action, payload)}
											/>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					{filtered.length === 0 && (
						<p className="py-4 text-center text-sm italic text-text-muted">
							{search ? "No members match your search" : "No active members"}
						</p>
					)}
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
									<td>
										<div className="flex items-center gap-2">
											{m.image ? (
												<Image src={m.image} width={20} height={20} className="h-5 w-5 rounded-full object-cover" alt="" />
											) : (
												<div className="flex h-5 w-5 items-center justify-center rounded-full bg-panel2 text-[8px] font-bold text-text-muted">{m.login[0].toUpperCase()}</div>
											)}
											<span className="text-text-primary">{m.name}</span><span className="text-xs text-text-muted">@{m.login}</span>
										</div>
									</td>
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
