"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BlackholeTimer } from "@/components/ui/BlackholeTimer";

// ── Types ────────────────────────────────────────────

interface TeamMemberUser {
	id: string;
	login: string;
	name: string;
	image: string | null;
	githubHandle: string | null;
}

interface WeeklyReport {
	id: string;
	weekNumber: number;
	summary: string;
	readmeUpdated: boolean;
	createdAt: string;
}

interface MaterialRequest {
	id: string;
	itemName: string;
	quantity: number;
	estimatedCost: number | null;
	status: string;
	createdAt: string;
}

interface EvalSlot {
	id: string;
	status: string;
	createdAt: string;
	evaluations: { id: string; status: string }[];
}

interface TeamData {
	id: string;
	status: string;
	rank: string | null;
	blackholeDeadline: string | null;
	activatedAt: string | null;
	project: {
		id: string;
		title: string;
		rank: string;
	};
	members: {
		userId: string;
		isLeader: boolean;
		user: TeamMemberUser;
	}[];
	weeklyReports: WeeklyReport[];
	evaluationSlots: EvalSlot[];
	materialRequests: MaterialRequest[];
	fabricationRequests: any[];
	checkouts: any[];
}

interface ProjectCockpitProps {
	team: TeamData | null;
	userId: string;
}

// ── Helpers ──────────────────────────────────────────

function formatDate(d: string) {
	return new Intl.DateTimeFormat("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(d));
}

// ── Component ────────────────────────────────────────

export function ProjectCockpit({ team, userId }: ProjectCockpitProps) {
	const router = useRouter();
	const [showReportForm, setShowReportForm] = useState(false);
	const [showMaterialForm, setShowMaterialForm] = useState(false);
	const [showConflictForm, setShowConflictForm] = useState(false);
	const [showEvalForm, setShowEvalForm] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Report form state
	const [reportSummary, setReportSummary] = useState("");
	const [readmeUpdated, setReadmeUpdated] = useState(false);
	const [blockersNotes, setBlockersNotes] = useState("");
	const [contributionNotes, setContributionNotes] = useState<Record<string, string>>({});

	// Material form state
	const [matItemName, setMatItemName] = useState("");
	const [matQuantity, setMatQuantity] = useState("1");
	const [matCost, setMatCost] = useState("");
	const [matJustification, setMatJustification] = useState("");

	// Fab form state
	const [showFabForm, setShowFabForm] = useState(false);
	const [fabType, setFabType] = useState<"PRINTER_FDM" | "PRINTER_RESIN" | "CNC">("PRINTER_FDM");
	const [fabModelUrl, setFabModelUrl] = useState("");
	const [fabTime, setFabTime] = useState("");
	const [fabGrams, setFabGrams] = useState("");
	const [fabPurpose, setFabPurpose] = useState("");

	// Checkout form state
	const [showCheckoutForm, setShowCheckoutForm] = useState(false);
	const [checkoutItemName, setCheckoutItemName] = useState("");
	const [checkoutQuantity, setCheckoutQuantity] = useState("1");
	const [checkoutReturnAt, setCheckoutReturnAt] = useState("");

	// Conflict form state
	const [conflictDesc, setConflictDesc] = useState("");

	// Eval form state
	const [evalAvailability, setEvalAvailability] = useState("");

	if (!team) {
		return (
			<Card className="space-y-3 py-8 text-center">
				<p className="font-semibold text-text-primary">No active project</p>
				<p className="text-sm text-text-muted">
					Browse the skill tree to activate one.
				</p>
				<Button variant="primary" onClick={() => router.push("/cursus?tab=overview")}>
					View Skill Tree
				</Button>
			</Card>
		);
	}

	const isLeader = team.members.find((m) => m.isLeader)?.userId === userId;
	const leader = team.members.find((m) => m.isLeader)?.user;
	const openSlot = team.evaluationSlots.find((s) => s.status === "OPEN");
	const isHighRank = team.project.rank === "A" || team.project.rank === "S";
	const maxEvals = isHighRank ? 3 : 2;
	const claimedEvals = openSlot?.evaluations?.length ?? 0;

	const nextWeek = (team.weeklyReports.length > 0 ? Math.max(...team.weeklyReports.map((r) => r.weekNumber)) : 0) + 1;

	// ── Handlers ─────────────────────────────────

	const submitReport = async () => {
		setSubmitting(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/reports`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					weekNumber: nextWeek,
					summary: reportSummary,
					contributionNotes,
					photoUrls: [],
					readmeUpdated,
					blockersNotes: blockersNotes || undefined,
				}),
			});
			if (res.ok) {
				setShowReportForm(false);
				setReportSummary("");
				setBlockersNotes("");
				setContributionNotes({});
				setReadmeUpdated(false);
				router.refresh();
			}
		} finally {
			setSubmitting(false);
		}
	};

	const submitForEval = async () => {
		setSubmitting(true);
		try {
			await fetch(`/api/teams/${team.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "EVALUATING" }),
			});
			router.refresh();
		} finally {
			setSubmitting(false);
		}
	};

	const openEvalSlot = async () => {
		setSubmitting(true);
		try {
			await fetch("/api/evaluations/slots", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					teamId: team.id,
					availableWindows: [{ note: evalAvailability }],
				}),
			});
			setShowEvalForm(false);
			setEvalAvailability("");
			router.refresh();
		} finally {
			setSubmitting(false);
		}
	};

	const submitMaterial = async () => {
		setSubmitting(true);
		try {
			await fetch(`/api/teams/${team.id}/materials`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					itemName: matItemName,
					quantity: Number(matQuantity),
					estimatedCost: matCost ? parseFloat(matCost) : undefined,
					justification: matJustification || undefined,
				}),
			});
			setShowMaterialForm(false);
			setMatItemName("");
			setMatQuantity("1");
			setMatCost("");
			setMatJustification("");
			router.refresh();
		} finally {
			setSubmitting(false);
		}
	};

	const submitFab = async () => {
		setSubmitting(true);
		try {
			await fetch(`/api/teams/${team.id}/fabrication`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					machineType: fabType,
					modelFileUrl: fabModelUrl,
					estimatedMinutes: Number(fabTime),
					estimatedMaterialGrams: Number(fabGrams),
					purpose: fabPurpose,
				}),
			});
			setShowFabForm(false);
			setFabModelUrl("");
			setFabTime("");
			setFabGrams("");
			setFabPurpose("");
			router.refresh();
		} finally {
			setSubmitting(false);
		}
	};

	const submitCheckout = async () => {
		setSubmitting(true);
		try {
			await fetch(`/api/teams/${team.id}/checkout`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					itemName: checkoutItemName,
					quantity: Number(checkoutQuantity),
					expectedReturnAt: checkoutReturnAt,
				}),
			});
			setShowCheckoutForm(false);
			setCheckoutItemName("");
			setCheckoutQuantity("1");
			setCheckoutReturnAt("");
			router.refresh();
		} finally {
			setSubmitting(false);
		}
	};

	const submitConflict = async () => {
		setSubmitting(true);
		try {
			await fetch(`/api/teams/${team.id}/conflict`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ description: conflictDesc }),
			});
			setShowConflictForm(false);
			setConflictDesc("");
		} finally {
			setSubmitting(false);
		}
	};

	// ── Render ─────────────────────────────────────

	const statusColour = team.status === "ACTIVE" ? "bg-green-900/40 text-green-400" : "bg-orange-900/40 text-orange-400";

	return (
		<div className="space-y-6">
			{/* SECTION 1 — Header */}
			<Card glowing className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h2 className="text-lg font-bold text-text-primary">{team.project.title}</h2>
						<Badge rank={team.project.rank as any} size="sm" />
					</div>
					<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColour}`}>
						{team.status}
					</span>
				</div>
				<div className="flex -space-x-2">
					{team.members.map((m) =>
						m.user.image ? (
							<Image
								key={m.userId}
								src={m.user.image}
								alt={m.user.login}
								title={m.user.login}
								width={28}
								height={28}
								className="h-7 w-7 rounded-full border-2 border-background object-cover"
							/>
						) : (
							<div key={m.userId} title={m.user.login} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-panel2 text-[10px] font-bold text-text-muted">
								{m.user.login.charAt(0).toUpperCase()}
							</div>
						)
					)}
				</div>
				{team.blackholeDeadline && team.activatedAt && (
					<BlackholeTimer deadline={team.blackholeDeadline} activatedAt={team.activatedAt} />
				)}
			</Card>

			{/* SECTION 2 — GitHub & Docs */}
			<Card className="space-y-2">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">GitHub & Docs</h3>
				{leader?.githubHandle ? (
					<a
						href={`https://github.com/${leader.githubHandle}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-accent hover:underline"
					>
						Repository linked ↗
					</a>
				) : (
					<p className="text-sm text-text-muted">No repository linked</p>
				)}
				<p className="text-xs text-text-muted">
					Keep commits up to date. Stale repos (7+ days) are flagged to moderators.
				</p>
			</Card>

			{/* SECTION 3 — Weekly Reports */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Progress Reports</h3>
				{isLeader && !showReportForm && (
					<Button variant="primary" size="sm" onClick={() => setShowReportForm(true)}>
						Submit Week {nextWeek} Report
					</Button>
				)}
				{showReportForm && (
					<div className="space-y-3 rounded-lg border border-border-color bg-panel2 p-3">
						<textarea
							placeholder="Summary of this week's progress..."
							value={reportSummary}
							onChange={(e) => setReportSummary(e.target.value)}
							className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted"
							rows={3}
						/>
						{team.members.map((m) => (
							<div key={m.userId}>
								<label className="mb-1 block text-xs text-text-muted">{m.user.login}'s contributions</label>
								<textarea
									value={contributionNotes[m.userId] || ""}
									onChange={(e) => setContributionNotes((prev) => ({ ...prev, [m.userId]: e.target.value }))}
									className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary"
									rows={1}
								/>
							</div>
						))}
						<label className="flex items-center gap-2 text-xs text-text-muted">
							<input type="checkbox" checked={readmeUpdated} onChange={(e) => setReadmeUpdated(e.target.checked)} className="accent-accent" />
							README updated
						</label>
						<textarea
							placeholder="Blockers or notes (optional)"
							value={blockersNotes}
							onChange={(e) => setBlockersNotes(e.target.value)}
							className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted"
							rows={2}
						/>
						<div className="flex gap-2">
							<Button variant="primary" size="sm" onClick={submitReport} disabled={submitting || !reportSummary}>
								Submit
							</Button>
							<Button variant="ghost" size="sm" onClick={() => setShowReportForm(false)}>
								Cancel
							</Button>
						</div>
					</div>
				)}
				{team.weeklyReports.length === 0 ? (
					<p className="text-sm italic text-text-muted">No reports submitted yet</p>
				) : (
					<ul className="space-y-2">
						{team.weeklyReports.map((r) => (
							<li key={r.id} className="flex items-start gap-2 rounded-lg bg-panel2 p-2">
								<span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">W{r.weekNumber}</span>
								<div className="min-w-0 flex-1">
									<p className="line-clamp-2 text-sm text-text-primary">{r.summary}</p>
									<div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
										<span>{formatDate(r.createdAt)}</span>
										<span>{r.readmeUpdated ? "✓ README" : "— README"}</span>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>

			{/* SECTION 4 — Evaluations */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Evaluations</h3>
				<p className="text-sm text-text-muted">
					{claimedEvals} / {maxEvals} evaluations {isHighRank ? "(2 peer + 1 staff)" : "(2 peer)"}
				</p>
				{team.status === "ACTIVE" && isLeader && (
					<Button variant="primary" size="sm" onClick={submitForEval} disabled={submitting}>
						Submit for Evaluation
					</Button>
				)}
				{team.status === "EVALUATING" && !openSlot && isLeader && (
					<>
						{!showEvalForm ? (
							<Button variant="primary" size="sm" onClick={() => setShowEvalForm(true)}>
								Open Evaluation Slot
							</Button>
						) : (
							<div className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
								<textarea
									placeholder="Describe your availability this week..."
									value={evalAvailability}
									onChange={(e) => setEvalAvailability(e.target.value)}
									className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted"
									rows={2}
								/>
								<div className="flex gap-2">
									<Button variant="primary" size="sm" onClick={openEvalSlot} disabled={submitting || !evalAvailability}>
										Open Slot
									</Button>
									<Button variant="ghost" size="sm" onClick={() => setShowEvalForm(false)}>Cancel</Button>
								</div>
							</div>
						)}
					</>
				)}
				{openSlot && (
					<div className="rounded-lg bg-panel2 p-3">
						<p className="text-sm font-semibold text-accent">Evaluation slot open — waiting for evaluators</p>
						<p className="text-xs text-text-muted">{openSlot.evaluations.length} evaluator(s) claimed</p>
					</div>
				)}
			</Card>

			{/* SECTION 5 — Materials & Equipment */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Materials</h3>
				{team.materialRequests.length > 0 && (
					<ul className="space-y-2">
						{team.materialRequests.map((mr) => (
							<li key={mr.id} className="flex items-center justify-between rounded-lg bg-panel2 p-2">
								<span className="text-sm text-text-primary">{mr.itemName} ×{mr.quantity}</span>
								<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${mr.status === "APPROVED" ? "bg-green-900/40 text-green-400" :
									mr.status === "DENIED" ? "bg-red-900/40 text-red-400" :
										"bg-yellow-900/40 text-yellow-400"
									}`}>
									{mr.status}
								</span>
							</li>
						))}
					</ul>
				)}
				{!showMaterialForm ? (
					<Button variant="secondary" size="sm" onClick={() => setShowMaterialForm(true)}>
						Request Material
					</Button>
				) : (
					<div className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3">
						<input placeholder="Item name" value={matItemName} onChange={(e) => setMatItemName(e.target.value)} className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" />
						<div className="flex gap-2">
							<input placeholder="Qty" type="number" value={matQuantity} onChange={(e) => setMatQuantity(e.target.value)} className="w-20 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary" />
							<input placeholder="Est. cost" type="number" step="0.01" value={matCost} onChange={(e) => setMatCost(e.target.value)} className="flex-1 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" />
						</div>
						<textarea placeholder="Justification" value={matJustification} onChange={(e) => setMatJustification(e.target.value)} className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" rows={2} />
						<div className="flex gap-2">
							<Button variant="primary" size="sm" onClick={submitMaterial} disabled={submitting || !matItemName}>Submit</Button>
							<Button variant="ghost" size="sm" onClick={() => setShowMaterialForm(false)}>Cancel</Button>
						</div>
					</div>
				)}

				{/* Checkouts */}
				<h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-text-muted border-t border-border-color pt-3">Checked Out Items</h4>
				{team.checkouts?.length > 0 && (
					<ul className="space-y-2 mt-2">
						{team.checkouts.map((c: any) => (
							<li key={c.id} className="flex items-center justify-between rounded-lg bg-panel2 p-2">
								<span className="text-sm text-text-primary">{c.itemName} ×{c.quantity}</span>
								<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.status === "OUT" ? "bg-orange-900/40 text-orange-400" : "bg-green-900/40 text-green-400"}`}>
									{c.status}
								</span>
							</li>
						))}
					</ul>
				)}
				{!showCheckoutForm ? (
					<Button variant="secondary" size="sm" onClick={() => setShowCheckoutForm(true)} className="mt-2">
						Checkout Item
					</Button>
				) : (
					<div className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3 mt-2">
						<input placeholder="Item name" value={checkoutItemName} onChange={(e) => setCheckoutItemName(e.target.value)} className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" />
						<div className="flex gap-2">
							<input placeholder="Qty" type="number" value={checkoutQuantity} onChange={(e) => setCheckoutQuantity(e.target.value)} className="w-20 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary" />
							<input type="date" value={checkoutReturnAt} onChange={(e) => setCheckoutReturnAt(e.target.value)} className="flex-1 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" title="Expected return date" />
						</div>
						<div className="flex gap-2">
							<Button variant="primary" size="sm" onClick={submitCheckout} disabled={submitting || !checkoutItemName || !checkoutReturnAt}>Submit</Button>
							<Button variant="ghost" size="sm" onClick={() => setShowCheckoutForm(false)}>Cancel</Button>
						</div>
					</div>
				)}

				{/* Fabrication (3D Print/CNC) */}
				<h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-text-muted border-t border-border-color pt-3">Fabrication Requests</h4>
				{team.fabricationRequests?.length > 0 && (
					<ul className="space-y-2 mt-2">
						{team.fabricationRequests.map((fr: any) => (
							<li key={fr.id} className="flex items-center justify-between rounded-lg bg-panel2 p-2">
								<span className="text-sm text-text-primary">{fr.machineType.replace('PRINTER_', '')} </span>
								<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${fr.status === "PENDING" ? "bg-yellow-900/40 text-yellow-400" : fr.status === "APPROVED" ? "bg-green-900/40 text-green-400" : "bg-blue-900/40 text-blue-400"}`}>
									{fr.status}
								</span>
							</li>
						))}
					</ul>
				)}
				{!showFabForm ? (
					<Button variant="secondary" size="sm" onClick={() => setShowFabForm(true)} className="mt-2">
						New Fabrication Req
					</Button>
				) : (
					<div className="space-y-2 rounded-lg border border-border-color bg-panel2 p-3 mt-2">
						<select value={fabType} onChange={(e) => setFabType(e.target.value as any)} className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary">
							<option value="PRINTER_FDM">FDM 3D Printer</option>
							<option value="PRINTER_RESIN">Resin 3D Printer</option>
							<option value="CNC">CNC Router</option>
						</select>
						<input placeholder="Link to STL / File" value={fabModelUrl} onChange={(e) => setFabModelUrl(e.target.value)} className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" />
						<div className="flex gap-2">
							<input placeholder="Est. Min" type="number" value={fabTime} onChange={(e) => setFabTime(e.target.value)} className="w-1/2 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" />
							<input placeholder="Est. Grams" type="number" value={fabGrams} onChange={(e) => setFabGrams(e.target.value)} className="w-1/2 rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" />
						</div>
						<textarea placeholder="Purpose" value={fabPurpose} onChange={(e) => setFabPurpose(e.target.value)} className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted" rows={2} />
						<div className="flex gap-2">
							<Button variant="primary" size="sm" onClick={submitFab} disabled={submitting || !fabModelUrl}>Submit</Button>
							<Button variant="ghost" size="sm" onClick={() => setShowFabForm(false)}>Cancel</Button>
						</div>
					</div>
				)}
			</Card>

			{/* SECTION 6 — Report an Issue */}
			<div className="text-center">
				{!showConflictForm ? (
					<button
						onClick={() => setShowConflictForm(true)}
						className="text-xs text-text-muted underline-offset-4 transition-colors hover:text-accent-urgency hover:underline"
					>
						Report a team issue (anonymous)
					</button>
				) : (
					<Card className="space-y-2 text-left">
						<p className="text-xs font-semibold text-text-muted">This report is anonymous.</p>
						<textarea
							placeholder="Describe the issue..."
							value={conflictDesc}
							onChange={(e) => setConflictDesc(e.target.value)}
							className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted"
							rows={3}
						/>
						<div className="flex gap-2">
							<Button variant="danger" size="sm" onClick={submitConflict} disabled={submitting || !conflictDesc}>Submit Report</Button>
							<Button variant="ghost" size="sm" onClick={() => setShowConflictForm(false)}>Cancel</Button>
						</div>
					</Card>
				)}
			</div>
		</div>
	);
}
