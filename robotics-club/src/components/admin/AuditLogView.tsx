"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface AuditLog {
	id: string;
	createdAt: string;
	action: string;
	details: string | null;
	actor: { login: string; name: string };
	target?: { login: string; name: string } | null;
}

export function AuditLogView() {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/admin/audit-logs")
			.then(res => res.json())
			.then(raw => {
				setLogs(Array.isArray(raw) ? raw : raw.data || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	if (loading) return <div className="py-12 text-center text-text-muted">Loading audit history...</div>;

	return (
		<Card glowing className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-bold text-accent">Administrative Audit Log</h2>
					<p className="text-xs text-text-muted">Immutable record of all administrative actions.</p>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b border-border-color text-left text-text-muted">
							<th className="py-2">Time</th>
							<th>Actor</th>
							<th>Action</th>
							<th>Target</th>
							<th>Details</th>
						</tr>
					</thead>
					<tbody>
						{logs.length > 0 ? (
							logs.map((log) => (
								<tr key={log.id} className="border-b border-border-color hover:bg-panel/20">
									<td className="py-2 whitespace-nowrap text-text-muted">
										{new Intl.DateTimeFormat("en-GB", { 
											day: "numeric", month: "short", 
											hour: "2-digit", minute: "2-digit", second: "2-digit" 
										}).format(new Date(log.createdAt))}
									</td>
									<td className="font-medium text-text-primary">@{log.actor.login}</td>
									<td>
										<span className="rounded bg-panel2 px-1 py-0.5 font-mono text-[10px] uppercase text-accent">
											{log.action.replace(/_/g, " ")}
										</span>
									</td>
									<td>
										{log.target ? (
											<span className="text-forge-purple font-medium">@{log.target.login}</span>
										) : (
											"—"
										)}
									</td>
									<td className="max-w-xs truncate text-text-muted italic" title={log.details || ""}>
										{log.details || "No details provided"}
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5} className="py-8 text-center text-text-muted italic">No audit records found.</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
