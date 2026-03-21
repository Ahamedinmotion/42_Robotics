"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface DefenseOversightProps {
	userRole: string;
	permissions: string[];
}

export function DefenseOversight({ userRole, permissions }: DefenseOversightProps) {
	const { toast } = useToast();
	const [defenses, setDefenses] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [modalType, setModalType] = useState<string | null>(null);
	const [modalDefenseId, setModalDefenseId] = useState<string | null>(null);
	const [modalNote, setModalNote] = useState("");

	const canManage = permissions.includes("CAN_MANAGE_DEFENSES") || userRole === "PRESIDENT";
	const isPresident = userRole === "PRESIDENT";

	const fetchDefenses = useCallback(async () => {
		try {
			const res = await fetch("/api/defenses");
			const json = await res.json();
			if (json.success) setDefenses(json.data || []);
		} catch (err) {
			console.error("Failed to fetch defenses", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchDefenses();
		const interval = setInterval(fetchDefenses, 30000);
		return () => clearInterval(interval);
	}, [fetchDefenses]);

	const doAction = async (defenseId: string, action: string, body: any = {}) => {
		setActionLoading(defenseId);
		try {
			const res = await fetch(`/api/defenses/${defenseId}/${action}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const json = await res.json();
			if (json.success) {
				toast(`Defense ${action} successful`);
				fetchDefenses();
			} else {
				toast(json.error || `Failed to ${action}`, "error");
			}
		} catch { toast("Network error", "error"); }
		finally { setActionLoading(null); setModalType(null); setModalNote(""); }
	};

	const scheduled = defenses.filter(d => d.status === "SCHEDULED" || d.status === "MINIMUM_NOT_MET");
	const active = defenses.filter(d => d.status === "OPEN");
	const closed = defenses.filter(d => d.status === "CLOSED" || d.status === "PROVISIONAL");

	if (loading) return <div className="p-12 text-center text-text-muted animate-pulse font-black tracking-widest uppercase text-[10px]">Loading Defense Data...</div>;

	return (
		<div className="space-y-8 pb-12">
			{/* Active Defense Panel */}
			{active.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
						<h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Active Defense</h3>
					</div>
					{active.map(d => {
						const tiers = d.registrationTiers || { admin: 0, expert: 0, gallery: 0 };
						return (
							<Card key={d.id} className="p-6 space-y-6 border-emerald-500/20 bg-emerald-500/5 ring-1 ring-emerald-500/10">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Badge rank={d.team?.project?.rank || "A"} size="sm" />
										<div>
											<h4 className="text-sm font-black text-text-primary">{d.team?.project?.title}</h4>
											<p className="text-[10px] text-text-muted">{d.team?.name}</p>
										</div>
									</div>
									<div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
										<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
										<span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Evaluation Open</span>
									</div>
								</div>

								{/* Submission grid */}
								<div className="grid grid-cols-3 gap-3 text-center">
									{[
										{ label: "Admin", count: tiers.admin },
										{ label: "Expert (A/S)", count: tiers.expert },
										{ label: "Gallery", count: tiers.gallery },
									].map(tier => (
										<div key={tier.label} className="p-3 rounded-xl bg-panel2/30 border border-white/5">
											<p className="text-[9px] font-black uppercase tracking-widest text-text-muted">{tier.label}</p>
											<p className="text-lg font-black text-text-primary">{tier.count}</p>
										</div>
									))}
								</div>

								{/* Admin Actions */}
								{canManage && (
									<div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
										<Button
											size="sm"
											variant="danger"
											className="text-[10px] font-black uppercase tracking-widest"
											disabled={actionLoading === d.id}
											onClick={() => doAction(d.id, "close", { confirm: true })}
										>
											Close Evaluation
										</Button>
										<Button
											size="sm"
											variant="secondary"
											className="text-[10px] font-black uppercase tracking-widest"
											disabled={actionLoading === d.id}
											onClick={() => doAction(d.id, "expert-jury-only")}
										>
											Expert Jury Only
										</Button>
										<Button
											size="sm"
											variant="ghost"
											className="text-[10px] font-black uppercase tracking-widest text-accent-urgency"
											disabled={actionLoading === d.id}
											onClick={() => { setModalType("dispel"); setModalDefenseId(d.id); }}
										>
											Dispel Gallery
										</Button>
									</div>
								)}
							</Card>
						);
					})}
				</div>
			)}

			{/* Scheduled Defenses Table */}
			<div className="space-y-4">
				<h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Scheduled Defenses</h3>
				{scheduled.length === 0 ? (
					<p className="text-[10px] py-8 text-center text-text-muted uppercase tracking-widest border border-dashed border-white/10 rounded-xl">No defenses scheduled.</p>
				) : (
					<div className="space-y-3">
						{scheduled.map(d => {
							const tiers = d.registrationTiers || { admin: 0, expert: 0, gallery: 0 };
							return (
								<Card key={d.id} className="p-4 flex items-center justify-between hover:border-accent/30 transition-colors">
									<div className="flex items-center gap-3">
										<Badge rank={d.team?.project?.rank || "A"} size="sm" />
										<div>
											<p className="text-sm font-bold text-text-primary">{d.team?.project?.title}</p>
											<p className="text-[10px] text-text-muted">{d.team?.name} • {new Date(d.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
										</div>
									</div>
									<div className="flex items-center gap-4">
										<div className="flex gap-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
											<span>A:{tiers.admin}</span>
											<span>E:{tiers.expert}</span>
											<span>G:{tiers.gallery}</span>
										</div>
										<div className={`h-2 w-2 rounded-full ${d.minimumMet ? "bg-emerald-500" : "bg-red-500"}`} />
										{canManage && (
											<Button
												size="sm"
												variant="primary"
												className="text-[10px] font-black uppercase tracking-widest"
												disabled={actionLoading === d.id || !d.minimumMet}
												onClick={() => doAction(d.id, "open")}
											>
												Open
											</Button>
										)}
									</div>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			{/* Finalized Defenses — Override Section */}
			{canManage && (() => {
				const finalized = defenses.filter(d => d.status === "PASSED" || d.status === "FAILED" || d.status === "PROVISIONAL");
				if (finalized.length === 0) return null;
				return (
					<div className="space-y-4">
						<h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted">Finalized Defenses</h3>
						{finalized.map(d => {
							const statusColor = d.status === "PASSED" ? "emerald" : d.status === "PROVISIONAL" ? "amber" : "red";
							return (
								<Card key={d.id} className={`p-5 space-y-4 border-${statusColor}-500/20 bg-${statusColor}-500/5`}>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<Badge rank={d.team?.project?.rank || "A"} size="sm" />
											<div>
												<h4 className="text-sm font-bold text-text-primary">{d.team?.project?.title}</h4>
												<p className="text-[10px] text-text-muted">{d.team?.name}</p>
											</div>
										</div>
										<span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
											d.status === "PASSED" ? "bg-emerald-500/20 text-emerald-400" :
											d.status === "PROVISIONAL" ? "bg-amber-500/20 text-amber-400" :
											"bg-red-500/20 text-red-400"
										}`}>
											{d.status}
										</span>
									</div>
									<div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
										{d.status !== "PASSED" && (
											<Button
												size="sm"
												variant="primary"
												className="text-[10px] font-black uppercase tracking-widest bg-emerald-600"
												disabled={actionLoading === d.id}
												onClick={() => { setModalType("force-pass"); setModalDefenseId(d.id); }}
											>
												Force Pass
											</Button>
										)}
										{d.status !== "FAILED" && (
											<Button
												size="sm"
												variant="danger"
												className="text-[10px] font-black uppercase tracking-widest"
												disabled={actionLoading === d.id}
												onClick={() => { setModalType("override-fail"); setModalDefenseId(d.id); }}
											>
												Force Fail
											</Button>
										)}
										{d.status === "PROVISIONAL" && (
											<Button
												size="sm"
												variant="secondary"
												className="text-[10px] font-black uppercase tracking-widest"
												disabled={actionLoading === d.id}
												onClick={() => { setModalType("confirm"); setModalDefenseId(d.id); }}
											>
												Confirm As-Is
											</Button>
										)}
										<Button
											size="sm"
											variant="ghost"
											className="text-[10px] font-black uppercase tracking-widest"
											disabled={actionLoading === d.id}
											onClick={() => { setModalType("reopen"); setModalDefenseId(d.id); }}
										>
											Reopen
										</Button>
									</div>
								</Card>
							);
						})}
					</div>
				);
			})()}

			{/* Modal */}
			{modalType && modalDefenseId && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
					<Card className="w-full max-w-lg p-8 space-y-6 bg-panel border-accent/20 shadow-2xl">
						<h2 className="text-lg font-black uppercase tracking-[0.2em] text-text-primary text-center">
							{modalType === "dispel" && "Dispel Gallery Scores"}
							{modalType === "reopen" && "Reopen Evaluation"}
							{modalType === "confirm" && "Confirm Provisional Result"}
							{modalType === "override-fail" && "Force Fail"}
							{modalType === "force-pass" && "Force Pass"}
						</h2>
						<div className="space-y-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Required Note</label>
							<textarea
								className="w-full bg-background border border-border rounded-xl p-4 text-xs text-text-primary focus:outline-none focus:border-accent/30 resize-none min-h-[100px]"
								placeholder="Provide a reason..."
								value={modalNote}
								onChange={e => setModalNote(e.target.value)}
							/>
						</div>
						<div className="flex gap-4">
							<Button variant="ghost" className="flex-1 text-[10px] font-black uppercase tracking-widest" onClick={() => { setModalType(null); setModalNote(""); }}>
								Cancel
							</Button>
							<Button
								variant={modalType === "override-fail" ? "danger" : "primary"}
								className="flex-[2] text-[10px] font-black uppercase tracking-widest"
								disabled={!modalNote.trim() || actionLoading === modalDefenseId}
								onClick={() => {
									if (modalType === "dispel") doAction(modalDefenseId!, "dispel-gallery", { note: modalNote });
									else if (modalType === "reopen") doAction(modalDefenseId!, "reopen", { reason: modalNote });
									else if (modalType === "confirm") doAction(modalDefenseId!, "confirm-provisional", { action: "confirm", note: modalNote });
									else if (modalType === "override-fail") doAction(modalDefenseId!, "confirm-provisional", { action: "override_fail", note: modalNote });
									else if (modalType === "force-pass") doAction(modalDefenseId!, "confirm-provisional", { action: "force_pass", note: modalNote });
								}}
							>
								Confirm
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
