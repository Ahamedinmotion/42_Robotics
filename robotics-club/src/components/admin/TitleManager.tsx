"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Title {
	id: string;
	name: string;
	description: string | null;
	isCustom: boolean;
	createdAt: string;
}

export function TitleManager() {
	const { toast } = useToast();
	const [titles, setTitles] = useState<Title[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [form, setForm] = useState({ name: "", description: "" });

	useEffect(() => {
		fetchTitles();
	}, []);

	async function fetchTitles() {
		try {
			const res = await fetch("/api/admin/titles");
			if (res.ok) setTitles(await res.json());
		} finally {
			setLoading(false);
		}
	}

	const handleAdd = async () => {
		try {
			const res = await fetch("/api/admin/titles", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			if (res.ok) {
				toast("Title created!");
				setForm({ name: "", description: "" });
				setShowAdd(false);
				fetchTitles();
			} else {
				const data = await res.json();
				toast(data.error || "Failed", "error");
			}
		} catch {
			toast("Network error", "error");
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this title? This will remove it from all users.")) return;
		try {
			const res = await fetch(`/api/admin/titles/${id}`, { method: "DELETE" });
			if (res.ok) {
				toast("Title deleted");
				fetchTitles();
			}
		} catch {
			toast("Error", "error");
		}
	};

	if (loading) return <div className="py-6 text-center text-xs text-text-muted">Loading titles...</div>;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="text-xs font-bold uppercase tracking-widest text-text-muted">Available Titles</h4>
				<Button variant="secondary" size="sm" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? "Cancel" : "New Title"}
				</Button>
			</div>

			{showAdd && (
				<Card className="space-y-3 bg-panel2/50">
					<input
						placeholder="Title Name (e.g. Master of Chips)"
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						className="w-full rounded border border-border-color bg-background p-2 text-sm text-text-primary"
					/>
					<textarea
						placeholder="Short description (optional)"
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
						className="w-full rounded border border-border-color bg-background p-2 text-sm text-text-primary"
						rows={2}
					/>
					<Button variant="primary" size="sm" onClick={handleAdd} disabled={!form.name}>
						Create Title
					</Button>
				</Card>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{titles.map((t) => (
					<div key={t.id} className="flex items-center justify-between rounded-lg border border-border-color bg-panel p-3">
						<div className="min-w-0">
							<p className="font-bold text-accent">{t.name}</p>
							<p className="truncate text-[10px] text-text-muted">{t.description || "No description"}</p>
						</div>
						<button 
							onClick={() => handleDelete(t.id)}
							className="text-text-muted hover:text-red-400 transition-colors"
						>
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				))}
				{titles.length === 0 && <p className="col-span-2 py-4 text-center text-xs italic text-text-muted">No titles defined yet.</p>}
			</div>
		</div>
	);
}
