"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Achievement {
	id: string;
	key: string;
	title: string;
	description: string;
	icon: string;
}

export function AchievementEditor() {
	const router = useRouter();
	const { toast } = useToast();
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);

	// Form state
	const [form, setForm] = useState({ key: "", title: "", description: "", icon: "🏆" });

	useEffect(() => {
		fetchAchievements();
	}, []);

	async function fetchAchievements() {
		try {
			const res = await fetch("/api/admin/achievements");
			if (res.ok) setAchievements(await res.json());
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
				setForm({ key: "", title: "", description: "", icon: "🏆" });
				setShowAdd(false);
				fetchAchievements();
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
				fetchAchievements();
			}
		} catch {
			toast("Error deleting", "error");
		}
	};

	if (loading) return <div className="py-12 text-center text-text-muted">Loading achievements...</div>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Achievement & Title Gallery</h3>
				<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? "Cancel" : "Add Achievement"}
				</Button>
			</div>

			{showAdd && (
				<Card className="space-y-3">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<input
							placeholder="Unique Key (e.g. FIRST_BUILD)"
							value={form.key}
							onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
							className={inputCls}
						/>
						<input
							placeholder="Display Title"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							className={inputCls}
						/>
					</div>
					<textarea
						placeholder="Achievement Description"
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
						rows={2}
						className={inputCls}
					/>
					<div className="flex items-center gap-3">
						<input
							placeholder="Icon (emoji)"
							value={form.icon}
							onChange={(e) => setForm({ ...form, icon: e.target.value })}
							className="w-20 rounded-md border border-border-color bg-background p-2 text-center text-xl"
						/>
						<p className="text-xs text-text-muted">Pick an emoji that represents this achievement.</p>
					</div>
					<Button variant="primary" size="sm" onClick={handleAdd} disabled={!form.key || !form.title}>
						Create Achievement
					</Button>
				</Card>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{achievements.map((a) => (
					<Card key={a.id} className="group relative flex items-start gap-4">
						<span className="text-3xl grayscale transition-all group-hover:grayscale-0">{a.icon}</span>
						<div className="flex-1 space-y-1">
							<div className="flex items-center justify-between">
								<h4 className="font-bold text-text-primary">{a.title}</h4>
								<span className="text-[10px] text-text-muted font-mono">{a.key}</span>
							</div>
							<p className="text-sm text-text-muted">{a.description}</p>
						</div>
						<button
							onClick={() => handleDelete(a.id)}
							className="absolute right-2 bottom-2 p-1 text-text-muted opacity-0 hover:text-red-400 group-hover:opacity-100 transition-opacity"
							title="Delete"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</Card>
				))}
			</div>
		</div>
	);
}
