import React from "react";
import { Card } from "@/components/ui/Card";

// ── Types ────────────────────────────────────────────

interface RankDist { rank: string; count: number; }
interface CompletionRate { rank: string; completed: number; total: number; }
interface EquipRow { machineType: string; pending: number; approved: number; completed: number; rejected: number; }
interface BlackholeEvent { login: string; rank: string; date: string; }

interface AnalyticsProps {
	rankDistribution: RankDist[];
	completionRates: CompletionRate[];
	equipment: EquipRow[];
	retention: { total: number; activeAndAlumni: number };
	blackholeEvents: BlackholeEvent[];
	avgEvalDays: number | null;
}

// ── Helpers ──────────────────────────────────────────

const RANK_COLOURS: Record<string, string> = { E: "#888888", D: "#44AAFF", C: "#44FF88", B: "#FFD700", A: "#FF6B00", S: "#CC44FF" };

function Bar({ value, max, colour }: { value: number; max: number; colour: string }) {
	const w = max > 0 ? (value / max) * 100 : 0;
	return (
		<div className="h-2 flex-1 rounded-full bg-panel2">
			<div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: colour }} />
		</div>
	);
}

function rateColour(pct: number) {
	if (pct >= 70) return "#44FF88";
	if (pct >= 40) return "#FFD700";
	return "#FF6B00";
}

// ── Component ────────────────────────────────────────

export function Analytics({ rankDistribution, completionRates, equipment, retention, blackholeEvents, avgEvalDays }: AnalyticsProps) {
	const maxRankCount = Math.max(...rankDistribution.map((r) => r.count), 1);
	const retPct = retention.total > 0 ? Math.round((retention.activeAndAlumni / retention.total) * 100) : 0;

	return (
		<div className="space-y-6">
			{/* Rank Distribution */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Rank Distribution</h3>
				{rankDistribution.map((r) => (
					<div key={r.rank} className="flex items-center gap-3">
						<span className="w-6 text-xs font-bold" style={{ color: RANK_COLOURS[r.rank] }}>{r.rank}</span>
						<Bar value={r.count} max={maxRankCount} colour={RANK_COLOURS[r.rank] || "#888"} />
						<span className="w-8 text-right text-xs text-text-muted">{r.count}</span>
					</div>
				))}
			</Card>

			{/* Completion Rates */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Completion Rate by Rank</h3>
				{completionRates.map((r) => {
					const pct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
					return (
						<div key={r.rank} className="flex items-center gap-3">
							<span className="w-6 text-xs font-bold" style={{ color: RANK_COLOURS[r.rank] }}>{r.rank}</span>
							<Bar value={r.completed} max={r.total} colour={rateColour(pct)} />
							<span className="w-16 text-right text-xs text-text-muted">{r.completed}/{r.total} ({pct}%)</span>
						</div>
					);
				})}
			</Card>

			{/* Equipment */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Equipment Utilisation</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-xs">
						<thead><tr className="border-b border-border-color text-left text-text-muted"><th className="py-1">Machine</th><th>Pending</th><th>Approved</th><th>Completed</th><th>Rejected</th></tr></thead>
						<tbody>{equipment.map((e) => (
							<tr key={e.machineType} className="border-b border-border-color"><td className="py-1 text-text-primary">{e.machineType}</td><td className="text-yellow-400">{e.pending}</td><td className="text-green-400">{e.approved}</td><td className="text-text-muted">{e.completed}</td><td className="text-red-400">{e.rejected}</td></tr>
						))}</tbody>
					</table>
				</div>
			</Card>

			{/* Retention + Eval Throughput */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Card>
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Retention</h3>
					<p className="mt-2 text-text-primary">{retention.activeAndAlumni} of {retention.total} members who joined are still active or alumni (<span className="font-bold text-accent">{retPct}%</span>)</p>
				</Card>
				<Card>
					<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Avg. Eval Turnaround</h3>
					<p className="mt-2 text-text-primary">{avgEvalDays !== null ? `${avgEvalDays} days from activation to first evaluation` : "No data yet"}</p>
				</Card>
			</div>

			{/* Recent Blackholes */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Recent Blackhole Events (30 days)</h3>
				{blackholeEvents.length === 0 ? <p className="text-sm italic text-text-muted">None</p> : (
					<ul className="space-y-1">{blackholeEvents.map((e, i) => (
						<li key={i} className="flex items-center justify-between text-xs"><span className="text-text-primary">@{e.login} <span className="text-text-muted">(Rank {e.rank})</span></span><span className="text-text-muted">{e.date}</span></li>
					))}</ul>
				)}
			</Card>
		</div>
	);
}
