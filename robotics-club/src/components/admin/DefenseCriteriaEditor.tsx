"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function DefenseCriteriaEditor() {
	const { toast } = useToast();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [criteria, setCriteria] = useState<any[]>([]);
	const [settings, setSettings] = useState({
		ratingScale: 5,
		passThreshold: 60,
		overallMinChars: 150,
		maxCriteria: 15,
		minCriteria: 5,
	});
	const [showPreview, setShowPreview] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/defenses/criteria");
				const json = await res.json();
				if (json.success) {
					setCriteria(json.data.criteria || []);
					if (json.data.settings) {
						setSettings(prev => ({ ...prev, ...json.data.settings }));
					}
				}
			} catch (err) {
				toast("Failed to load criteria", "error");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [toast]);

	const activeCount = criteria.filter(c => c.isActive).length;

	const addCriterion = () => {
		if (criteria.length >= settings.maxCriteria) {
			toast(`Maximum ${settings.maxCriteria} criteria allowed`, "error");
			return;
		}
		setCriteria(prev => [
			...prev,
			{
				id: `new-${Date.now()}`,
				name: "",
				description: "",
				order: prev.length + 1,
				minChars: 100,
				isActive: true,
				isNew: true,
			},
		]);
	};

	const updateCriterion = (idx: number, field: string, value: any) => {
		setCriteria(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
	};

	const removeCriterion = (idx: number) => {
		const c = criteria[idx];
		if (c.isActive && activeCount <= settings.minCriteria) {
			toast(`Cannot delete — minimum ${settings.minCriteria} active criteria required`, "error");
			return;
		}
		setCriteria(prev => prev.filter((_, i) => i !== idx));
	};

	const moveUp = (idx: number) => {
		if (idx === 0) return;
		setCriteria(prev => {
			const next = [...prev];
			[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
			return next.map((c, i) => ({ ...c, order: i + 1 }));
		});
	};

	const moveDown = (idx: number) => {
		if (idx >= criteria.length - 1) return;
		setCriteria(prev => {
			const next = [...prev];
			[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
			return next.map((c, i) => ({ ...c, order: i + 1 }));
		});
	};

	const saveAll = async () => {
		const emptyNames = criteria.filter(c => !c.name.trim());
		if (emptyNames.length > 0) {
			toast("All criteria must have a name", "error");
			return;
		}

		setSaving(true);
		try {
			const res = await fetch("/api/admin/defenses/criteria", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					criteria: criteria.map((c, i) => ({
						id: c.isNew ? undefined : c.id,
						name: c.name,
						description: c.description,
						order: i + 1,
						minChars: c.minChars,
						isActive: c.isActive,
					})),
					settings: {
						ratingScale: settings.ratingScale,
						passThreshold: settings.passThreshold,
						overallMinChars: settings.overallMinChars,
					},
				}),
			});
			const json = await res.json();
			if (json.success) {
				toast("Criteria saved successfully");
			} else {
				toast(json.error || "Failed to save", "error");
			}
		} catch { toast("Network error", "error"); }
		finally { setSaving(false); }
	};

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40";

	if (loading) return <div className="p-12 text-center text-text-muted animate-pulse font-black tracking-widest uppercase text-[10px]">Loading Criteria...</div>;

	return (
		<div className="space-y-8">
			{/* Global Settings */}
			<Card className="p-6 space-y-6">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Global Settings</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div>
						<label className="block text-xs font-medium text-text-muted mb-1">Stars per criterion</label>
						<input
							type="number"
							min={3}
							max={10}
							value={settings.ratingScale}
							onChange={e => setSettings(prev => ({ ...prev, ratingScale: Math.max(3, Math.min(10, Number(e.target.value))) }))}
							className={inputCls}
						/>
						<p className="text-[9px] text-text-muted/50 mt-1">Evaluators rate each criterion out of this number</p>
					</div>
					<div>
						<label className="block text-xs font-medium text-text-muted mb-1">Pass threshold %</label>
						<input
							type="number"
							min={1}
							max={100}
							value={settings.passThreshold}
							onChange={e => setSettings(prev => ({ ...prev, passThreshold: Math.max(1, Math.min(100, Number(e.target.value))) }))}
							className={inputCls}
						/>
						<p className="text-[9px] text-text-muted/50 mt-1">Minimum score to pass</p>
					</div>
					<div>
						<label className="block text-xs font-medium text-text-muted mb-1">Overall review min chars</label>
						<input
							type="number"
							min={50}
							value={settings.overallMinChars}
							onChange={e => setSettings(prev => ({ ...prev, overallMinChars: Math.max(50, Number(e.target.value)) }))}
							className={inputCls}
						/>
					</div>
				</div>
			</Card>

			{/* Criteria List */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Defense Criteria</h3>
						<span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">{activeCount} active</span>
					</div>
					<div className="flex items-center gap-2">
						{activeCount < settings.minCriteria && (
							<span className="text-[9px] font-black uppercase tracking-widest text-red-400">Min {settings.minCriteria} required</span>
						)}
						{criteria.length >= settings.maxCriteria && (
							<span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Max {settings.maxCriteria} reached</span>
						)}
						<Button size="sm" variant="primary" className="text-[10px] font-black uppercase tracking-widest" onClick={addCriterion} disabled={criteria.length >= settings.maxCriteria}>
							+ Add Criterion
						</Button>
					</div>
				</div>

				<div className="space-y-3">
					{criteria.map((c, idx) => (
						<Card key={c.id} className={`p-4 space-y-3 ${!c.isActive ? "opacity-50" : ""}`}>
							<div className="flex items-start gap-3">
								{/* Reorder Buttons */}
								<div className="flex flex-col gap-1 pt-1">
									<button className="text-[10px] text-text-muted hover:text-accent transition-colors" onClick={() => moveUp(idx)} disabled={idx === 0}>▲</button>
									<button className="text-[10px] text-text-muted hover:text-accent transition-colors" onClick={() => moveDown(idx)} disabled={idx >= criteria.length - 1}>▼</button>
								</div>

								{/* Content */}
								<div className="flex-1 space-y-2">
									<input
										placeholder="Criterion name"
										value={c.name}
										onChange={e => updateCriterion(idx, "name", e.target.value)}
										className={`${inputCls} font-bold`}
										autoFocus={c.isNew}
									/>
									<textarea
										placeholder="Description"
										value={c.description}
										onChange={e => updateCriterion(idx, "description", e.target.value)}
										rows={2}
										className={inputCls}
									/>
									<div className="flex items-center gap-4">
										<div className="flex items-center gap-2">
											<label className="text-[10px] text-text-muted font-bold">Min chars:</label>
											<input
												type="number"
												min={0}
												value={c.minChars}
												onChange={e => updateCriterion(idx, "minChars", Math.max(0, Number(e.target.value)))}
												className="w-20 rounded-md border border-border-color bg-background p-1 text-xs text-text-primary text-center"
											/>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="flex flex-col items-end gap-2">
									<label className="flex items-center gap-2 cursor-pointer">
										<span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{c.isActive ? "Active" : "Hidden"}</span>
										<input
											type="checkbox"
											checked={c.isActive}
											onChange={e => {
												if (!e.target.checked && activeCount <= settings.minCriteria) {
													toast(`Cannot deactivate — minimum ${settings.minCriteria} active criteria required`, "error");
													return;
												}
												updateCriterion(idx, "isActive", e.target.checked);
											}}
											className="accent-accent"
										/>
									</label>
									<button
										className="text-[10px] text-accent-urgency hover:text-red-400 transition-colors disabled:opacity-30"
										disabled={c.isActive && activeCount <= settings.minCriteria}
										onClick={() => removeCriterion(idx)}
										title={c.isActive && activeCount <= settings.minCriteria ? `Cannot delete — minimum ${settings.minCriteria} active criteria required` : "Delete"}
									>
										🗑
									</button>
								</div>
							</div>
						</Card>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-between pt-4 border-t border-white/5">
				<Button
					variant="ghost"
					size="sm"
					className="text-[10px] font-black uppercase tracking-widest"
					onClick={() => setShowPreview(true)}
				>
					Preview Form
				</Button>
				<Button
					variant="primary"
					size="lg"
					className="font-black uppercase tracking-[0.2em]"
					disabled={saving || activeCount < settings.minCriteria}
					onClick={saveAll}
				>
					{saving ? "Saving..." : "Save All Changes"}
				</Button>
			</div>

			{/* Preview Modal */}
			{showPreview && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
					<Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 space-y-6 bg-panel border-accent/20 shadow-2xl">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-black uppercase tracking-[0.2em] text-text-primary">Evaluation Form Preview</h2>
							<Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
						</div>
						{criteria.filter(c => c.isActive).map(c => (
							<div key={c.id} className="space-y-3 p-4 rounded-xl bg-panel2/30 border border-white/5">
								<h3 className="text-sm font-black text-text-primary">{c.name || "Untitled"}</h3>
								<p className="text-[10px] text-text-muted">{c.description || "No description"}</p>
								<div className="flex gap-1">
									{Array.from({ length: settings.ratingScale }, (_, i) => (
										<span key={i} className="text-xl text-text-muted/20">☆</span>
									))}
								</div>
								<div className="h-16 rounded-xl bg-background border border-border/20 flex items-center justify-center">
									<span className="text-[9px] text-text-muted/30 uppercase tracking-widest">Text area ({c.minChars} min chars)</span>
								</div>
							</div>
						))}
					</Card>
				</div>
			)}
		</div>
	);
}
