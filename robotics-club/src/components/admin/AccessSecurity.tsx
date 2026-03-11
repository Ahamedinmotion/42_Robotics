"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// ── Types ────────────────────────────────────────────

interface LogEntry {
	id: string;
	userName: string;
	userLogin: string;
	userImage: string | null;
	method: string;
	success: boolean;
	flagged: boolean;
	note: string | null;
	timestamp: string;
}

interface AccessSecurityProps {
	logs: LogEntry[];
	flaggedCount: number;
	membersWithAccess: Array<{ id: string; login: string; name: string; image: string | null }>;
	labAccessCount: number;
	userRole: string;
}

// ── Helpers ──────────────────────────────────────────

function formatDateTime(d: string) {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

// ── Component ────────────────────────────────────────

export function AccessSecurity({ logs, flaggedCount, membersWithAccess, labAccessCount, userRole }: AccessSecurityProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [loading, setLoading] = useState<string | null>(null);

	const canAccess = ["SECRETARY", "VP", "PRESIDENT"].includes(userRole);
	if (!canAccess) {
		return <p className="py-12 text-center text-sm text-text-muted">Access restricted to Secretary and above.</p>;
	}

	const clearFlag = async (id: string) => {
		setLoading(id);
		try {
			const res = await fetch(`/api/admin/lab-access/${id}/flag`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flagged: false }) });
			if (res.ok) { toast("Flag cleared"); router.refresh(); } else { toast("Failed", "error"); }
		} catch { toast("Network error", "error"); } finally { setLoading(null); }
	};

	const flagged = logs.filter((l) => l.flagged);

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
			{/* Main Content Area */}
			<div className="space-y-6 lg:col-span-3">
				{/* Stats */}
				<div className="flex gap-3">
					<span className="rounded-full bg-panel2 px-3 py-1 text-xs font-bold text-text-muted">{labAccessCount} members with lab access</span>
					{flaggedCount > 0 && <span className="rounded-full bg-red-900/40 px-3 py-1 text-xs font-bold text-red-400">{flaggedCount} flagged entries</span>}
				</div>

				{/* Flagged entries */}
				{flagged.length > 0 && (
					<Card className="space-y-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-accent-urgency">Flagged Entries</h3>
						{flagged.map((l) => (
							<div key={l.id} className="flex items-center justify-between rounded-lg border border-red-800/30 bg-red-950/20 p-3">
								<div className="flex items-center gap-3">
									{l.userImage ? (
										<Image src={l.userImage} width={24} height={24} className="h-6 w-6 rounded-full object-cover" alt="" />
									) : (
										<div className="flex h-6 w-6 items-center justify-center rounded-full bg-panel2 text-[9px] font-bold text-text-muted">{l.userLogin[0].toUpperCase()}</div>
									)}
									<div>
										<p className="text-sm text-text-primary">{l.userName} <span className="text-text-muted">@{l.userLogin}</span></p>
										<div className="flex items-center gap-2 text-xs text-text-muted">
											<span className="rounded bg-accent/20 px-1 py-0.5 text-[10px] text-accent">{l.method}</span>
											<span>{formatDateTime(l.timestamp)}</span>
											{l.note && <span>— {l.note}</span>}
										</div>
									</div>
								</div>
								<Button variant="ghost" size="sm" disabled={loading === l.id} onClick={() => clearFlag(l.id)}>Clear Flag</Button>
							</div>
						))}
					</Card>
				)}

				{/* Full log */}
				<Card className="space-y-2">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Access Log</h3>
					{logs.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead><tr className="border-b border-border-color text-left text-text-muted"><th className="py-1">User</th><th>Method</th><th>Time</th><th>Success</th><th>Flagged</th></tr></thead>
								<tbody>
									{logs.map((l) => (
										<tr key={l.id} className={`border-b border-border-color ${!l.success ? "bg-red-950/10" : ""}`}>
											<td className="py-1 text-text-primary">{l.userName} <span className="text-text-muted">@{l.userLogin}</span></td>
											<td><span className="rounded bg-panel2 px-1 py-0.5 text-text-muted">{l.method}</span></td>
											<td className="text-text-muted">{formatDateTime(l.timestamp)}</td>
											<td>{l.success ? <span className="text-green-400">✓</span> : <span className="text-red-400">✗</span>}</td>
											<td>{l.flagged ? <span className="text-red-400">⚑</span> : "—"}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="py-12 text-center">
							<p className="text-sm text-text-muted italic">No access logs found.</p>
						</div>
					)}
				</Card>
			</div>

			{/* Side Panel: Members with Access */}
			<div className="lg:col-span-1">
				<Card className="h-full space-y-4">
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Authorized Members</h3>
					<div className="space-y-3">
						{membersWithAccess.length > 0 ? (
							membersWithAccess.map((m) => (
								<div key={m.id} className="flex items-center gap-3 border-b border-border-color/50 pb-2 last:border-0">
									{m.image ? (
										<Image src={m.image} width={32} height={32} className="h-8 w-8 rounded-full object-cover" alt="" />
									) : (
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-panel2 text-[10px] font-bold text-text-muted">{m.login[0].toUpperCase()}</div>
									)}
									<div className="min-w-0">
										<p className="truncate text-xs font-medium text-text-primary">{m.name}</p>
										<p className="truncate text-[10px] text-text-muted">@{m.login}</p>
									</div>
								</div>
							))
						) : (
							<p className="text-xs text-text-muted italic">No members currently authorized.</p>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}

