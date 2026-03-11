"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { TitleManager } from "./TitleManager";

interface Achievement {
	id: string;
	key: string;
	title: string;
	description: string;
	icon: string;
	unlockedTitleId: string | null;
}

const PREMIUM_ICONS = [
	{ id: "zap", label: "⚡ Zap", char: "⚡" },
	{ id: "shield", label: "🛡 Shield", char: "🛡" },
	{ id: "award", label: "🏆 Award", char: "🏆" },
	{ id: "star", label: "⭐ Star", char: "⭐" },
	{ id: "flame", label: "🔥 Flame", char: "🔥" },
	{ id: "target", label: "🎯 Target", char: "🎯" },
	{ id: "crown", label: "👑 Crown", char: "👑" },
	{ id: "gem", label: "💎 Gem", char: "💎" },
];

interface Title {
	id: string;
	name: string;
}

export function AchievementEditor() {
	const router = useRouter();
	const { toast } = useToast();
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [titles, setTitles] = useState<Title[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [activeTab, setActiveTab] = useState<"achievements" | "titles">("achievements");

	// Form state
	const [form, setForm] = useState({ key: "", title: "", description: "", icon: "zap", unlockedTitleId: "" });

	useEffect(() => {
		fetchData();
	}, []);

	async function fetchData() {
		try {
			const [aRes, tRes] = await Promise.all([
				fetch("/api/admin/achievements"),
				fetch("/api/admin/titles")
			]);
			if (aRes.ok) setAchievements(await aRes.json());
			if (tRes.ok) setTitles(await tRes.json());
		} finally {
			setLoading(false);
		}
	}

	const handleAdd = async () => {
		try {
			const res = await fetch("/api/admin/achievements", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (res.ok) {
				toast("Achievement created!");
				setForm({ key: "", title: "", description: "", icon: "zap", unlockedTitleId: "" });
				setShowAdd(false);
				fetchData();
			} else {
				const data = await res.json();
				toast(data.error || "Failed to create", "error");
			}
		} catch {
			toast("Network error", "error");
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this achievement?")) return;
		try {
			const res = await fetch(`/api/admin/achievements/${id}`, { method: "DELETE" });
			if (res.ok) {
				toast("Deleted");
				fetchData();
			}
		} catch {
			toast("Error deleting", "error");
		}
	};

	if (loading) return <div className="py-12 text-center text-text-muted">Loading rewards system...</div>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-8">
			{/* Tabs */}
			<div className="flex border-b border-border-color gap-8">
				<button 
					onClick={() => setActiveTab("achievements")}
					className={`pb-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === "achievements" ? "border-b-2 border-accent text-accent" : "text-text-muted hover:text-text-primary"}`}
				>
					Achievements
				</button>
				<button 
					onClick={() => setActiveTab("titles")}
					className={`pb-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === "titles" ? "border-b-2 border-accent text-accent" : "text-text-muted hover:text-text-primary"}`}
				>
					Titles
				</button>
			</div>

			{activeTab === "titles" && <TitleManager />}

			{activeTab === "achievements" && (
				<>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Master Achievement List</h3>
						<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
							{showAdd ? "Cancel" : "Add Achievement"}
						</Button>
					</div>

					{showAdd && (
						<Card glowing className="space-y-4">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-[10px] font-bold uppercase text-text-muted">System Key</label>
									<input
										placeholder="E.G. FIRST_BUILD"
										value={form.key}
										onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
										className={inputCls}
									/>
								</div>
								<div>
									<label className="mb-1 block text-[10px] font-bold uppercase text-text-muted">Display Title</label>
									<input
										placeholder="Achievement Name"
										value={form.title}
										onChange={(e) => setForm({ ...form, title: e.target.value })}
										className={inputCls}
									/>
								</div>
							</div>

							<div>
								<label className="mb-1 block text-[10px] font-bold uppercase text-text-muted">Description</label>
								<textarea
									placeholder="Tell the story of this unlock..."
									value={form.description}
									onChange={(e) => setForm({ ...form, description: e.target.value })}
									rows={2}
									className={inputCls}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-[10px] font-bold uppercase text-text-muted">Abstract Icon</label>
									<div className="flex flex-wrap gap-2">
										{PREMIUM_ICONS.map((i) => (
											<button
												key={i.id}
												onClick={() => setForm({ ...form, icon: i.id })}
												className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
													form.icon === i.id ? "border-accent bg-accent/20 text-accent shadow-lg shadow-accent/20" : "border-border-color hover:border-text-muted"
												}`}
												title={i.label}
											>
												<span className="text-lg">{i.char}</span>
											</button>
										))}
									</div>
								</div>
								<div>
									<label className="mb-1 block text-[10px] font-bold uppercase text-text-muted">Linked Title (Optional)</label>
									<select
										value={form.unlockedTitleId}
										onChange={(e) => setForm({ ...form, unlockedTitleId: e.target.value })}
										className={inputCls}
									>
										<option value="">No title attached</option>
										{titles.map((t: Title) => (
											<option key={t.id} value={t.id}>{t.name}</option>
										))}
									</select>
									<p className="mt-1 text-[10px] text-text-muted italic">Users will automatically receive this title when they unlock the achievement.</p>
								</div>
							</div>

							<Button variant="primary" size="md" className="w-full" onClick={handleAdd} disabled={!form.key || !form.title}>
								Create Achievement
							</Button>
						</Card>
					)}

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{achievements.map((a) => (
							<Card key={a.id} className="group relative flex items-start gap-4 hover:border-accent/40 transition-colors">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-panel2 text-2xl shadow-inner">
									{PREMIUM_ICONS.find(i => i.id === a.icon)?.char || "🏆"}
								</div>
								<div className="flex-1 space-y-1">
									<div className="flex items-center justify-between">
										<h4 className="font-bold text-text-primary">{a.title}</h4>
										<span className="text-[10px] font-mono text-text-muted">{a.key}</span>
									</div>
									<p className="text-xs text-text-muted line-clamp-2">{a.description}</p>
									{a.unlockedTitleId && titles.some((t: Title) => t.id === a.unlockedTitleId) && (
										<div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-forge-purple/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-forge-purple">
											<span>Title:</span>
											<span>{titles.find((t: Title) => t.id === a.unlockedTitleId)?.name}</span>
										</div>
									)}
								</div>
								<button
									onClick={() => handleDelete(a.id)}
									className="absolute right-2 top-2 p-1 text-text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</Card>
						))}
					</div>
				</>
			)}
		</div>
	);
}
