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
		<div className="space-y-10 animate-in fade-in duration-700">
			{/* Mission Personnel Status Bar */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{[
					{ label: "Active Personnel", count: `${activeCount}/${cap}`, color: activeCount >= cap * 0.9 ? "text-red-400" : "text-accent", bg: activeCount >= cap * 0.9 ? "bg-red-500/10" : "bg-accent/10" },
					{ label: "Pending Insertion", count: waitlist.length, color: "text-amber-400", bg: "bg-amber-500/10" },
					{ label: "Operational Alumni", count: alumni.length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
					{ label: "Void Containment", count: blackholed.length, color: "text-red-500", bg: "bg-red-950/20" },
				].map((stat) => (
					<div key={stat.label} className={`rounded-[2rem] border border-white/5 ${stat.bg} p-6 backdrop-blur-md transition-all hover:scale-105`}>
						<p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">{stat.label}</p>
						<p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.count}</p>
					</div>
				))}
			</div>

			{/* Personnel Directory */}
			<Card className="relative overflow-hidden border-white/5 bg-panel-2/30 backdrop-blur-2xl rounded-[2.5rem] p-8">
				<div className="absolute top-0 right-0 h-64 w-64 bg-accent/5 blur-[100px] pointer-events-none" />
				<div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 relative">
					<div className="flex items-center gap-4">
						<div className="h-12 w-1.5 rounded-full bg-accent" />
						<h3 className="text-xl font-black uppercase tracking-tighter text-text-primary">Personnel Directory</h3>
					</div>
					<div className="relative w-full md:w-72">
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="LOOKUP_LOGIN..."
							className="w-full rounded-2xl border border-white/5 bg-black/20 px-6 py-4 text-xs text-text-primary placeholder:text-text-muted/40 outline-none focus:border-accent/40 font-mono transition-all"
						/>
					</div>
				</div>
				<div className="overflow-x-auto relative">
					<table className="w-full">
						<thead>
							<tr className="text-left text-[9px] font-black uppercase tracking-[0.3em] text-text-muted/50">
								<th className="pb-6 pl-4">Member_ID</th>
								<th className="pb-6">Clearance</th>
								<th className="pb-6">Active_Duty</th>
								<th className="pb-6">Void_Proximity</th>
								<th className="pb-6">Last_Log</th>
								<th className="pb-6">Efficiency</th>
								<th className="pb-6 pr-4 text-right">Ops</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((m) => {
								const bhDays = m.blackholeDeadline ? daysUntil(m.blackholeDeadline) : null;
								const health = bhDays !== null && bhDays < 3 ? "text-red-500" : m.daysAgo > 7 ? "text-amber-500" : "text-emerald-400";
								
								return (
									<tr key={m.id} className="group border-b border-white/5 transition-colors hover:bg-white/5">
										<td className="py-5 pl-4">
											<div className="flex items-center gap-4">
												<div className="relative h-10 w-10 shrink-0">
													{m.image ? (
														<Image src={m.image} width={40} height={40} className="h-full w-full rounded-2xl object-cover border border-white/10" alt="" />
													) : (
														<div className="flex h-full w-full items-center justify-center rounded-2xl bg-panel2 text-xs font-black text-text-muted border border-white/10 uppercase">{m.login.slice(0, 2)}</div>
													)}
													<div className={`absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-panel shadow-lg ${health === "text-red-500" ? "bg-red-500 animate-pulse" : health === "text-amber-500" ? "bg-amber-500" : "bg-emerald-500"}`} />
												</div>
												<div>
													<p className="font-black text-text-primary uppercase tracking-tight leading-none">{m.name}</p>
													<p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">@{m.login}</p>
												</div>
											</div>
										</td>
										<td>
											<Badge rank={m.currentRank as any} size="sm" className="rounded-lg px-2 py-1 font-black shadow-none border-white/5" />
										</td>
										<td>
											<p className="text-[10px] font-black uppercase text-text-primary tracking-tight max-w-[120px] truncate">
												{m.projectTitle || "UNASSIGNED"}
											</p>
										</td>
										<td>
											{bhDays !== null ? (
												<div className="flex items-center gap-2">
													<span className={`text-xs font-black tabular-nums ${bhDays < 3 ? "text-red-500" : "text-text-primary opacity-80"}`}>{bhDays}D</span>
													<div className="h-1.5 w-12 rounded-full bg-white/5 overflow-hidden">
														<div className={`h-full transition-all ${bhDays < 3 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-accent/40"}`} style={{ width: `${Math.min(100, (bhDays / 30) * 100)}%` }} />
													</div>
												</div>
											) : <span className="text-[9px] font-bold text-text-muted italic opacity-40">STABLE</span>}
										</td>
										<td>
											<span className="text-[10px] font-bold text-text-muted uppercase tabular-nums">{m.daysAgo}D_AGO</span>
										</td>
										<td>
											<div className="flex items-center gap-1.5">
												<span className="text-xs font-black text-text-primary">{m.completedCount}</span>
												<div className="h-1 w-1 rounded-full bg-accent/30" />
											</div>
										</td>
										<td className="pr-4 text-right">
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

			{/* Waitlist & Blackholed Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Waitlist */}
				<Card className="border-white/5 bg-panel-2/30 backdrop-blur-xl rounded-[2.5rem] p-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="h-8 w-1 rounded-full bg-amber-500" />
						<h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">Waitlist Containment</h3>
					</div>
					
					{waitlist.length === 0 ? <p className="text-xs font-bold text-text-muted/40 uppercase tracking-widest text-center py-8 italic">No subjects in waitlist</p> : (
						<div className="space-y-3">
							{waitlist.map((m, i) => (
								<div key={m.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
									<div className="flex items-center gap-3">
										<span className="text-[9px] font-black text-amber-500 opacity-40 tabular-nums">#0{i + 1}</span>
										<div>
											<p className="text-xs font-black text-text-primary uppercase tracking-tight leading-none">{m.name}</p>
											<p className="text-[9px] text-text-muted font-bold tracking-widest uppercase mt-1">@{m.login}</p>
										</div>
									</div>
									<Button 
										variant="primary" 
										className="h-9 px-4 rounded-xl bg-amber-500 text-black hover:bg-white hover:text-black font-black uppercase tracking-widest text-[8px] transition-all" 
										disabled={activeCount >= cap || loading !== null} 
										onClick={() => callApi(`/api/admin/users/${m.id}/status`, { status: "ACTIVE" }, `${m.login} promoted`)}
									>
										ACTIVATE
									</Button>
								</div>
							))}
						</div>
					)}
				</Card>

				{/* Blackholed */}
				<Card className="border-red-500/10 bg-red-950/10 backdrop-blur-xl rounded-[2.5rem] p-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="h-8 w-1 rounded-full bg-red-600 animate-pulse" />
						<h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-500">Void Residents</h3>
					</div>
					
					{blackholed.length === 0 ? <p className="text-xs font-bold text-text-muted/40 uppercase tracking-widest text-center py-8 italic">Void is empty</p> : (
						<div className="space-y-3">
							{blackholed.map((m) => (
								<div key={m.id} className="group flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 transition-all hover:bg-red-500/10">
									<div className="flex items-center gap-3">
										<div className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
										<div>
											<p className="text-xs font-black text-text-primary uppercase tracking-tight leading-none">{m.name}</p>
											<p className="text-[9px] text-text-muted font-bold tracking-widest uppercase mt-1">@{m.login}</p>
										</div>
									</div>
									<Button 
										variant="ghost" 
										className="h-9 px-4 rounded-xl text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-[8px] transition-all" 
										disabled={loading !== null} 
										onClick={() => callApi(`/api/admin/users/${m.id}/status`, { status: "WAITLIST" }, `${m.login} reinstated`)}
									>
										REINSTATE
									</Button>
								</div>
							))}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
