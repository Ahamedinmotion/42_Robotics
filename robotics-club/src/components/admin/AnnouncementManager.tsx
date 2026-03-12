"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// ── Types ────────────────────────────────────────────

interface AnnouncementItem {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	expiresAt: string;
	createdBy: { login: string; name: string };
	_count: { dismissals: number };
}

// ── Duration Helpers ─────────────────────────────────

const PRESETS = [
	{ label: "1 hour", ms: 1 * 60 * 60 * 1000 },
	{ label: "6 hours", ms: 6 * 60 * 60 * 1000 },
	{ label: "24 hours", ms: 24 * 60 * 60 * 1000 },
	{ label: "3 days", ms: 3 * 24 * 60 * 60 * 1000 },
	{ label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
];

function isExpired(expiresAt: string) {
	return new Date(expiresAt) <= new Date();
}

function timeLeft(expiresAt: string) {
	const diff = new Date(expiresAt).getTime() - Date.now();
	if (diff <= 0) return "Expired";
	const h = Math.floor(diff / 3600000);
	const m = Math.floor((diff % 3600000) / 60000);
	if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
	if (h > 0) return `${h}h ${m}m left`;
	return `${m}m left`;
}

function formatDate(d: string) {
	return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

// ── Component ────────────────────────────────────────

export function AnnouncementManager() {
	const router = useRouter();
	const { toast } = useToast();

	const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [showCreate, setShowCreate] = useState(false);

	// Form
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [durationType, setDurationType] = useState<"preset" | "custom">("preset");
	const [presetIdx, setPresetIdx] = useState(2); // default 24h
	const [customDateTime, setCustomDateTime] = useState("");

	useEffect(() => { fetchAll(); }, []);

	async function fetchAll() {
		setLoading(true);
		const res = await fetch("/api/admin/announcements");
		if (res.ok) {
			const j = await res.json();
			setAnnouncements(j.data || []);
		}
		setLoading(false);
	}

	const computeExpiry = (): string | null => {
		if (durationType === "preset") {
			return new Date(Date.now() + PRESETS[presetIdx].ms).toISOString();
		}
		if (!customDateTime) return null;
		const d = new Date(customDateTime);
		if (isNaN(d.getTime()) || d <= new Date()) return null;
		return d.toISOString();
	};

	const create = async () => {
		const expiresAt = computeExpiry();
		if (!title || !body || !expiresAt) {
			toast("Please fill all fields and set a valid expiry", "error");
			return;
		}
		setSubmitting(true);
		const res = await fetch("/api/admin/announcements", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title, body, expiresAt }),
		});
		if (res.ok) {
			toast("Announcement published");
			setShowCreate(false);
			setTitle(""); setBody(""); setDurationType("preset"); setPresetIdx(2); setCustomDateTime("");
			fetchAll();
		} else {
			const j = await res.json();
			toast(j.error || "Failed", "error");
		}
		setSubmitting(false);
	};

	const remove = async (id: string) => {
		if (!confirm("Are you sure you want to delete this announcement? This cannot be undone.")) return;
		
		setSubmitting(true);
		try {
			const res = await fetch(`/api/admin/announcements/${id}`, { 
				method: "DELETE",
				headers: { "Accept": "application/json" }
			});
			
			if (res.ok) {
				toast("Announcement deleted successfully");
				await fetchAll();
			} else {
				const errorData = await res.json().catch(() => ({}));
				console.error("AnnouncementManager: Delete failed", errorData);
				toast(errorData.error || "Failed to delete announcement", "error");
			}
		} catch (err: any) {
			console.error("AnnouncementManager: Network error during deletion", err);
			toast("Network error. Please check your connection.", "error");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return <div className="py-12 text-center text-text-muted">Loading announcements...</div>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";
	const active = announcements.filter((a) => !isExpired(a.expiresAt));
	const expired = announcements.filter((a) => isExpired(a.expiresAt));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Announcements</h3>
				<Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
					{showCreate ? "Cancel" : "📢 New Announcement"}
				</Button>
			</div>

			{/* ── Create Form ─────────────────── */}
			{showCreate && (
				<Card className="space-y-4">
					<input placeholder="Announcement title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
					<textarea placeholder="Body — what do you want to tell everyone?" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className={inputCls} />

					{/* Duration Picker */}
					<div>
						<label className="mb-2 block text-xs font-medium text-text-muted">Duration</label>
						<div className="flex flex-wrap gap-2">
							{PRESETS.map((p, i) => (
								<button
									key={p.label}
									onClick={() => { setDurationType("preset"); setPresetIdx(i); }}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${durationType === "preset" && presetIdx === i
										? "bg-accent text-white"
										: "bg-panel2 text-text-muted hover:text-text-primary"}`}
								>
									{p.label}
								</button>
							))}
							<button
								onClick={() => setDurationType("custom")}
								className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${durationType === "custom"
									? "bg-accent text-white"
									: "bg-panel2 text-text-muted hover:text-text-primary"}`}
							>
								Custom
							</button>
						</div>
						{durationType === "custom" && (
							<input
								type="datetime-local"
								value={customDateTime}
								onChange={(e) => setCustomDateTime(e.target.value)}
								className={`mt-2 ${inputCls}`}
							/>
						)}
					</div>

					<Button variant="primary" size="sm" disabled={submitting || !title || !body} onClick={create}>
						Publish Announcement
					</Button>
				</Card>
			)}

			{/* ── Active Announcements ────────── */}
			{active.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-xs font-semibold uppercase text-green-400">Active ({active.length})</h4>
					{active.map((a) => (
						<Card key={a.id} className="flex items-start justify-between gap-4">
							<div className="min-w-0 space-y-1">
								<p className="font-semibold text-text-primary">{a.title}</p>
								<p className="text-sm text-text-muted line-clamp-2">{a.body}</p>
								<div className="flex items-center gap-3 text-[10px] text-text-muted">
									<span>by @{a.createdBy.login}</span>
									<span>{formatDate(a.createdAt)}</span>
									<span className="rounded bg-green-900/40 px-1.5 py-0.5 font-semibold text-green-400">{timeLeft(a.expiresAt)}</span>
									<span>{a._count.dismissals} dismissed</span>
								</div>
							</div>
							<Button variant="ghost" size="sm" className="shrink-0 text-accent-urgency" disabled={submitting} onClick={() => remove(a.id)}>
								Delete
							</Button>
						</Card>
					))}
				</div>
			)}

			{/* ── Expired Announcements ───────── */}
			{expired.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-xs font-semibold uppercase text-text-muted">Expired ({expired.length})</h4>
					{expired.map((a) => (
						<Card key={a.id} className="flex items-start justify-between gap-4 opacity-50">
							<div className="min-w-0 space-y-1">
								<p className="font-semibold text-text-primary">{a.title}</p>
								<p className="text-sm text-text-muted line-clamp-1">{a.body}</p>
								<div className="flex items-center gap-3 text-[10px] text-text-muted">
									<span>by @{a.createdBy.login}</span>
									<span>Expired {formatDate(a.expiresAt)}</span>
									<span>{a._count.dismissals} dismissed</span>
								</div>
							</div>
							<Button variant="ghost" size="sm" className="shrink-0 text-accent-urgency" disabled={submitting} onClick={() => remove(a.id)}>
								Delete
							</Button>
						</Card>
					))}
				</div>
			)}

			{announcements.length === 0 && !showCreate && (
				<Card className="border-dashed">
					<div className="space-y-2 py-8 text-center">
						<p className="text-lg">📢</p>
						<p className="font-semibold text-text-primary">No announcements yet</p>
						<p className="text-sm text-text-muted">Create one to notify all platform members.</p>
					</div>
				</Card>
			)}
		</div>
	);
}
