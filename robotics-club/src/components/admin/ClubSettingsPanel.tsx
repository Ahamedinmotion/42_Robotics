"use client";

import { useState, useEffect, useCallback } from "react";

interface Settings {
	clubName: string;
	clubTagline: string;
	maxActiveMembers: number;
	labOpenTime: string;
	labCloseTime: string;
	defaultBlackholeDays: number;
	minTeamSize: number;
	maxTeamSize: number;
	evalCooldownHours: number;
	antiSnipeMinutes: number;
	allowAlumniEvals: boolean;
	maintenanceMode: boolean;
	maintenanceMessage: string;
}

const DEFAULT: Settings = {
	clubName: "Robotics Club",
	clubTagline: "A ranked engineering curriculum for the makers, builders, and breakers at 42.",
	maxActiveMembers: 30,
	labOpenTime: "09:00",
	labCloseTime: "21:00",
	defaultBlackholeDays: 60,
	minTeamSize: 2,
	maxTeamSize: 5,
	evalCooldownHours: 24,
	antiSnipeMinutes: 5,
	allowAlumniEvals: true,
	maintenanceMode: false,
	maintenanceMessage: "The platform is currently under maintenance. Please check back later.",
};

export function ClubSettingsPanel() {
	const [settings, setSettings] = useState<Settings>(DEFAULT);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/settings");
			const json = await res.json();
			if (json.success) {
				setSettings({
					clubName: json.data.clubName,
					clubTagline: json.data.clubTagline,
					maxActiveMembers: json.data.maxActiveMembers,
					labOpenTime: json.data.labOpenTime,
					labCloseTime: json.data.labCloseTime,
					defaultBlackholeDays: json.data.defaultBlackholeDays,
					minTeamSize: json.data.minTeamSize,
					maxTeamSize: json.data.maxTeamSize,
					evalCooldownHours: json.data.evalCooldownHours,
					antiSnipeMinutes: json.data.antiSnipeMinutes,
					allowAlumniEvals: json.data.allowAlumniEvals,
					maintenanceMode: json.data.maintenanceMode,
					maintenanceMessage: json.data.maintenanceMessage,
				});
			}
		} catch {
			// use defaults
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	const save = async () => {
		setSaving(true);
		setToast(null);
		try {
			const res = await fetch("/api/admin/settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			const json = await res.json();
			if (json.success) {
				setToast({ type: "ok", msg: "Settings saved!" });
			} else {
				setToast({ type: "err", msg: json.error || "Save failed" });
			}
		} catch {
			setToast({ type: "err", msg: "Network error" });
		} finally {
			setSaving(false);
			setTimeout(() => setToast(null), 3000);
		}
	};

	const set = <K extends keyof Settings>(key: K, val: Settings[K]) =>
		setSettings((prev) => ({ ...prev, [key]: val }));

	if (loading) {
		return <div className="animate-pulse text-text-muted py-12 text-center">Loading settings…</div>;
	}

	const inputClass =
		"w-full rounded-lg border border-border-color bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
	const labelClass = "block text-xs font-medium uppercase tracking-wider text-text-muted mb-1";
	const sectionClass = "rounded-xl border border-border-color bg-surface/50 p-5 space-y-4";
	const sectionTitle = "text-base font-semibold text-text-primary mb-3 flex items-center gap-2";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-text-primary">Club Settings</h2>
					<p className="text-sm text-text-muted">Global platform configuration — President only</p>
				</div>
				<button
					onClick={save}
					disabled={saving}
					className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					{saving ? "Saving…" : "Save Changes"}
				</button>
			</div>

			{/* Toast */}
			{toast && (
				<div
					className={`rounded-lg px-4 py-2 text-sm font-medium ${
						toast.type === "ok"
							? "border border-green-500/30 bg-green-500/10 text-green-400"
							: "border border-red-500/30 bg-red-500/10 text-red-400"
					}`}
				>
					{toast.msg}
				</div>
			)}

			{/* ── Branding ── */}
			<section className={sectionClass}>
				<h3 className={sectionTitle}>🏷️ Branding</h3>
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className={labelClass}>Club Name</label>
						<input className={inputClass} value={settings.clubName} onChange={(e) => set("clubName", e.target.value)} />
					</div>
					<div className="sm:col-span-2">
						<label className={labelClass}>Tagline</label>
						<input className={inputClass} value={settings.clubTagline} onChange={(e) => set("clubTagline", e.target.value)} />
					</div>
				</div>
			</section>

			{/* ── Capacity & Timers ── */}
			<section className={sectionClass}>
				<h3 className={sectionTitle}>⚙️ Capacity &amp; Timers</h3>
				<div className="grid gap-4 sm:grid-cols-3">
					<div>
						<label className={labelClass}>Max Active Members</label>
						<input type="number" min={1} className={inputClass}
							value={settings.maxActiveMembers}
							onChange={(e) => set("maxActiveMembers", parseInt(e.target.value) || 0)} />
					</div>
					<div>
						<label className={labelClass}>Lab Open Time</label>
						<input type="time" className={inputClass}
							value={settings.labOpenTime}
							onChange={(e) => set("labOpenTime", e.target.value)} />
					</div>
					<div>
						<label className={labelClass}>Lab Close Time</label>
						<input type="time" className={inputClass}
							value={settings.labCloseTime}
							onChange={(e) => set("labCloseTime", e.target.value)} />
					</div>
					<div>
						<label className={labelClass}>Default Blackhole Days</label>
						<input type="number" min={1} className={inputClass}
							value={settings.defaultBlackholeDays}
							onChange={(e) => set("defaultBlackholeDays", parseInt(e.target.value) || 0)} />
					</div>
					<div>
						<label className={labelClass}>Min Team Size</label>
						<input type="number" min={1} className={inputClass}
							value={settings.minTeamSize}
							onChange={(e) => set("minTeamSize", parseInt(e.target.value) || 0)} />
					</div>
					<div>
						<label className={labelClass}>Max Team Size</label>
						<input type="number" min={1} className={inputClass}
							value={settings.maxTeamSize}
							onChange={(e) => set("maxTeamSize", parseInt(e.target.value) || 0)} />
					</div>
				</div>
			</section>

			{/* ── Evaluations ── */}
			<section className={sectionClass}>
				<h3 className={sectionTitle}>📋 Evaluations</h3>
				<div className="grid gap-4 sm:grid-cols-3">
					<div>
						<label className={labelClass}>Eval Cooldown (hours)</label>
						<input type="number" min={0} className={inputClass}
							value={settings.evalCooldownHours}
							onChange={(e) => set("evalCooldownHours", parseInt(e.target.value) || 0)} />
					</div>
					<div>
						<label className={labelClass}>Anti-Snipe (minutes)</label>
						<input type="number" min={0} className={inputClass}
							value={settings.antiSnipeMinutes}
							onChange={(e) => set("antiSnipeMinutes", parseInt(e.target.value) || 0)} />
					</div>
					<div className="flex items-end gap-3 pb-1">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={settings.allowAlumniEvals}
								onChange={(e) => set("allowAlumniEvals", e.target.checked)}
								className="h-4 w-4 rounded border-border-color accent-accent"
							/>
							<span className="text-sm text-text-primary">Allow Alumni Evaluations</span>
						</label>
					</div>
				</div>
			</section>

			{/* ── Maintenance ── */}
			<section className={`${sectionClass} ${settings.maintenanceMode ? "border-red-500/40 bg-red-500/5" : ""}`}>
				<h3 className={sectionTitle}>
					🔧 Maintenance Mode
					{settings.maintenanceMode && (
						<span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">ACTIVE</span>
					)}
				</h3>
				<div className="space-y-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={settings.maintenanceMode}
							onChange={(e) => set("maintenanceMode", e.target.checked)}
							className="h-4 w-4 rounded border-border-color accent-accent"
						/>
						<span className="text-sm text-text-primary">Enable maintenance mode</span>
					</label>
					<p className="text-xs text-text-muted">
						When enabled, non-admin users will be locked out and shown a maintenance page.
					</p>
					<div>
						<label className={labelClass}>Custom Message</label>
						<textarea
							className={inputClass + " resize-y min-h-[60px]"}
							rows={2}
							value={settings.maintenanceMessage}
							onChange={(e) => set("maintenanceMessage", e.target.value)}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
