"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDistanceToNow } from "date-fns";
import { CalibrationPortal } from "./CalibrationPortal";
import { DefenseOversight } from "./DefenseOversight";

interface Evaluation {
	id: string;
	status: string;
	totalScore: number | null;
	passed: boolean;
	isAnomaly: boolean;
	anomalyNote: string | null;
	isMidnightEval: boolean;
	submittedAt: string | null;
	completedAt: string | null;
	durationSeconds: number | null;
	evaluator: { id: string; name: string; login: string; image?: string };
	team: { id: string; name: string; project: { title: string; rank: any } };
}

interface HealthScore {
	id: string;
	name: string;
	login: string;
	image?: string;
	total: number;
	completed: number;
	anomaliesCount: number;
	avgDuration: number;
	health: number;
}

interface AdminOversightProps {
	userRole: string;
	permissions: string[];
}

export function AdminOversight({ userRole, permissions }: AdminOversightProps) {
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState<"monitoring" | "calibration" | "defenses">("monitoring");
	const [data, setData] = useState<{
		liveEvaluations: Evaluation[];
		anomalies: Evaluation[];
		healthScores: HealthScore[];
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const canOverride = permissions.includes("CAN_OVERRIDE_EVALUATIONS") || userRole === "PRESIDENT";

	useEffect(() => {
		fetchData();
		const interval = setInterval(fetchData, 30000); // Polling every 30s
		return () => clearInterval(interval);
	}, []);

	const fetchData = async () => {
		try {
			const res = await fetch("/api/admin/evaluations/oversight");
			const json = await res.json();
			if (json.success) setData(json.data);
		} catch (err) {
			console.error("Failed to fetch oversight data", err);
		} finally {
			setLoading(false);
		}
	};

	const handleOverride = async (id: string, score: number, passed: boolean) => {
		setActionLoading(id);
		try {
			const res = await fetch("/api/admin/evaluations/oversight", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "OVERRIDE_SCORE",
					evaluationId: id,
					data: { score, passed, note: "Manual override after review" }
				})
			});
			if (res.ok) {
				toast("Evaluation updated");
				fetchData();
			}
		} catch (err) {
			toast("Failed to update", "error");
		} finally {
			setActionLoading(null);
		}
	};

	const handleApproveTeam = async (teamId: string) => {
		setActionLoading(teamId);
		try {
			const res = await fetch("/api/admin/evaluations/oversight", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "APPROVE_ATTEMPT",
					teamId
				})
			});
			if (res.ok) {
				toast("Team approved for next attempt");
			}
		} catch (err) {
			toast("Failed to approve", "error");
		} finally {
			setActionLoading(null);
		}
	};

	if (loading && !data) return <div className="p-12 text-center text-text-muted animate-pulse font-black tracking-widest uppercase">Initializing Tactical Oversight...</div>;

	return (
		<div className="space-y-8 pb-12">
			{/* Tabs Navigation */}
			<div className="flex items-center gap-4 border-b border-white/5 pb-4">
				<button 
					onClick={() => setActiveTab("monitoring")}
					className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg transition-all ${activeTab === "monitoring" ? "bg-accent/10 text-accent border border-accent/20" : "text-text-muted hover:text-text-primary"}`}
				>
					Intelligence Feed
				</button>
				<button 
					onClick={() => setActiveTab("calibration")}
					className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg transition-all ${activeTab === "calibration" ? "bg-accent/10 text-accent border border-accent/20" : "text-text-muted hover:text-text-primary"}`}
				>
					Calibration Matrix
				</button>
				<button 
					onClick={() => setActiveTab("defenses")}
					className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg transition-all ${activeTab === "defenses" ? "bg-accent/10 text-accent border border-accent/20" : "text-text-muted hover:text-text-primary"}`}
				>
					Public Defenses
				</button>
			</div>

			{activeTab === "calibration" ? (
				<CalibrationPortal />
			) : activeTab === "defenses" ? (
				<DefenseOversight userRole={userRole} permissions={permissions} />
			) : (
				<>
					{/* Stats Overview */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="bg-panel2/30 border-accent/20">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-2">Live Anomalies</p>
							<h3 className="text-3xl font-black text-text-primary">{data?.anomalies.length || 0}</h3>
						</Card>
						<Card className="bg-panel2/30 border-blue-500/20">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Active Feed</p>
							<h3 className="text-3xl font-black text-text-primary">{data?.liveEvaluations.length || 0}</h3>
						</Card>
						<Card className="bg-panel2/30 border-green-500/20">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-2">Health Avg</p>
							<h3 className="text-3xl font-black text-text-primary">
								{Math.round((data?.healthScores.reduce((acc, curr) => acc + curr.health, 0) || 0) / (data?.healthScores.length || 1))}%
							</h3>
						</Card>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Anomalies Dashboard */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-xs font-black uppercase tracking-[0.3em] text-red-500">Critical Anomalies</h3>
								<span className="text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse bg-red-500/10 px-2 py-0.5 rounded">Live Radar</span>
							</div>
							<div className="space-y-3">
								{data?.anomalies.map(ano => (
									<Card key={ano.id} className="border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors">
										<div className="flex justify-between items-start mb-3">
											<div>
												<h4 className="text-sm font-bold text-text-primary mb-1">{ano.team.project.title}</h4>
												<p className="text-[10px] text-text-muted uppercase tracking-wider">{ano.team.name} • {ano.evaluator.name}</p>
											</div>
											<div className="text-right flex flex-col items-end gap-1">
												<span className={`text-[10px] font-black px-2 py-0.5 rounded ${ano.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
													{ano.totalScore}%
												</span>
												{ano.isMidnightEval && <span className="text-[8px] font-black text-accent uppercase tracking-[0.1em]">🌙 MIDNIGHT OPS</span>}
											</div>
										</div>
										<div className="p-2 rounded bg-black/40 border border-white/5 mb-4">
											<p className="text-[10px] text-red-400 leading-relaxed font-mono italic">"{ano.anomalyNote}"</p>
										</div>
										{canOverride && (
											<div className="flex gap-2">
												<Button size="sm" variant="primary" onClick={() => handleOverride(ano.id, ano.totalScore || 0, true)} disabled={!!actionLoading}>Force Pass</Button>
												<Button size="sm" variant="danger" onClick={() => handleOverride(ano.id, ano.totalScore || 0, false)} disabled={!!actionLoading}>Force Fail</Button>
												<Button size="sm" variant="ghost" onClick={() => handleApproveTeam(ano.team.id)} disabled={!!actionLoading}>Approve Attempt</Button>
											</div>
										)}
									</Card>
								))}
								{data?.anomalies.length === 0 && (
									<p className="text-[10px] py-12 text-center text-text-muted uppercase tracking-widest border border-dashed border-white/10 rounded-xl">No anomalies detected in current cycle.</p>
								)}
							</div>
						</div>

						{/* Active Feed */}
						<div className="space-y-4">
							<h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">Live Mission Feed</h3>
							<div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
								{data?.liveEvaluations.map(evalu => (
									<div key={evalu.id} className="flex items-center justify-between p-3 rounded-xl bg-panel/40 border border-white/5 hover:border-white/10 transition-all text-xs">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center font-bold text-[10px] text-accent">
												{evalu.evaluator.login.slice(0, 2).toUpperCase()}
											</div>
											<div>
												<p className="font-bold text-text-primary">{evalu.team.name}</p>
												<p className="text-[10px] text-text-muted tracking-tight">{evalu.team.project.title}</p>
											</div>
										</div>
										<div className="text-right">
											<p className="text-[10px] font-mono text-text-muted mb-1">
												{evalu.submittedAt ? formatDistanceToNow(new Date(evalu.submittedAt)) + " ago" : "Active Now"}
											</p>
											<p className={`font-black tracking-tighter ${evalu.passed ? "text-green-500" : "text-red-500"}`}>
												{evalu.status === "COMPLETED" ? `${evalu.totalScore}%` : "IN PROGRESS"}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Health Scores */}
					<div className="space-y-4 pt-6">
						<h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Evaluator Performance Scores</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
							{data?.healthScores.map(score => (
								<Card key={score.id} className="p-4 flex flex-col items-center text-center">
									<div className="w-12 h-12 rounded-full bg-panel3 mb-3 border border-white/5 flex items-center justify-center font-black text-accent">
										{score.login.slice(0, 2).toUpperCase()}
									</div>
									<h4 className="text-[10px] font-black uppercase tracking-wider text-text-primary mb-1 truncate w-full">{score.name}</h4>
									<div className="w-full bg-white/5 h-1 rounded-full overflow-hidden my-3">
										<div 
											className={`h-full transition-all duration-1000 ${score.health > 80 ? "bg-green-500" : score.health > 50 ? "bg-yellow-500" : "bg-red-500"}`} 
											style={{ width: `${score.health}%` }} 
										/>
									</div>
									<div className="grid grid-cols-2 w-full gap-2">
										<div>
											<p className="text-[8px] text-text-muted uppercase font-black">Missions</p>
											<p className="text-[10px] font-bold text-text-primary">{score.total}</p>
										</div>
										<div>
											<p className="text-[8px] text-text-muted uppercase font-black">Avg Time</p>
											<p className="text-[10px] font-bold text-text-primary">{Math.round(score.avgDuration / 60)}m</p>
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
