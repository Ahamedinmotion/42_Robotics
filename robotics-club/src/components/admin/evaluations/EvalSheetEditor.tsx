"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { QuestionType } from "@prisma/client";

interface EvalSheetEditorProps {
	projectId: string;
	projectTitle: string;
}

export function EvalSheetEditor({ projectId, projectTitle }: EvalSheetEditorProps) {
	const { toast } = useToast();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [sheet, setSheet] = useState<any>(null);
	const [sections, setSections] = useState<any[]>([]);

	useEffect(() => {
		fetch(`/api/admin/eval-sheets/${projectId}`)
			.then((res) => res.json())
			.then((json) => {
				if (json.success) {
					setSheet(json.data);
					setSections(json.data.sections || []);
				} else {
					// Initialize empty if not found
					setSections([
						{ title: "Technical Implementation", weight: 50, questions: [] },
						{ title: "Code Quality & Documentation", weight: 50, questions: [] },
					]);
				}
			})
			.finally(() => setLoading(false));
	}, [projectId]);

	const addSection = () => {
		setSections([...sections, { title: "New Section", weight: 0, questions: [] }]);
	};

	const removeSection = (idx: number) => {
		setSections(sections.filter((_, i) => i !== idx));
	};

	const addQuestion = (sIdx: number) => {
		const newSections = [...sections];
		newSections[sIdx].questions.push({
			type: "STAR_RATING",
			label: "New Question",
			description: "",
			required: true,
			isHardRequirement: false,
			weight: 1,
		});
		setSections(newSections);
	};

	const removeQuestion = (sIdx: number, qIdx: number) => {
		const newSections = [...sections];
		newSections[sIdx].questions = newSections[sIdx].questions.filter((_: any, i: number) => i !== qIdx);
		setSections(newSections);
	};

	const totalWeight = sections.reduce((acc, s) => acc + (Number(s.weight) || 0), 0);
	const isWeightValid = totalWeight === 100;

	const saveSheet = async () => {
		if (!isWeightValid) {
			toast("Total section weight must sum to 100%", "error");
			return;
		}

		setSaving(true);
		try {
			const method = sheet ? "PATCH" : "POST";
			const url = sheet ? `/api/admin/eval-sheets/${sheet.id}` : "/api/admin/eval-sheets";
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					projectId,
					passMark: sheet?.passMark || 60,
					sections,
				}),
			});

			const json = await res.json();
			if (json.success) {
				toast("Evaluation sheet saved successfully", "success");
				setSheet(json.data);
			} else {
				toast(json.error || "Failed to save", "error");
			}
		} catch (error) {
			toast("Network error", "error");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <div className="p-12 text-center text-text-muted animate-pulse font-mono uppercase tracking-[0.2em] text-[10px]">Loading mission rubric...</div>;

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between border-b border-border-color pb-4">
				<div>
					<h2 className="text-xl font-black uppercase tracking-widest text-text-primary">Evaluation Rubric</h2>
					<p className="text-xs text-text-muted mt-1 uppercase tracking-wider">Project: {projectTitle}</p>
				</div>
				<div className="flex items-center gap-4">
					<div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isWeightValid ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
						Total Weight: {totalWeight}%
					</div>
					<Button variant="primary" size="sm" onClick={saveSheet} disabled={saving}>
						{saving ? "Saving..." : sheet ? `Save Version ${sheet.version + 1}` : "Create Rubric"}
					</Button>
				</div>
			</div>

			<div className="space-y-6">
				{sections.map((section, sIdx) => (
					<Card key={sIdx} className="overflow-hidden border-border-color/50">
						<div className="bg-panel p-4 flex items-center justify-between border-b border-border-color/50">
							<div className="flex items-center gap-4 flex-1">
								<input
									className="bg-transparent text-sm font-bold uppercase tracking-widest text-text-primary focus:outline-none focus:border-b border-accent/30 w-full max-w-md"
									value={section.title}
									placeholder="Section Title"
									onChange={(e) => {
										const newSections = [...sections];
										newSections[sIdx].title = e.target.value;
										setSections(newSections);
									}}
								/>
								<div className="flex items-center gap-2">
									<label className="text-[10px] font-black uppercase tracking-widest text-text-muted whitespace-nowrap">Weight (%)</label>
									<input
										type="number"
										className="bg-panel2 border border-border-color rounded px-2 py-1 text-xs w-16 focus:outline-none focus:border-accent"
										value={section.weight}
										onChange={(e) => {
											const newSections = [...sections];
											newSections[sIdx].weight = Number(e.target.value);
											setSections(newSections);
										}}
									/>
								</div>
							</div>
							<Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={() => removeSection(sIdx)}>Remove</Button>
						</div>

						<div className="p-4 space-y-4">
							{section.questions.map((q: any, qIdx: number) => (
								<div key={qIdx} className={`p-4 rounded-xl bg-panel2 border ${q.isHardRequirement ? 'border-red-500/20' : 'border-border-color/30'} space-y-4`}>
									<div className="flex items-start justify-between gap-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
											<div className="space-y-2">
												<label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Label</label>
												<input
													className="w-full bg-panel border-border-color border rounded px-3 py-1.5 text-xs text-text-primary mb-2"
													value={q.label}
													onChange={(e) => {
														const newSections = [...sections];
														newSections[sIdx].questions[qIdx].label = e.target.value;
														setSections(newSections);
													}}
												/>
												<label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Description (Optional)</label>
												<input
													className="w-full bg-panel border-border-color border rounded px-3 py-1.5 text-xs text-text-primary"
													value={q.description || ""}
													onChange={(e) => {
														const newSections = [...sections];
														newSections[sIdx].questions[qIdx].description = e.target.value;
														setSections(newSections);
													}}
												/>
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div className="space-y-2">
													<label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Type</label>
													<select
														className="w-full bg-panel border-border-color border rounded px-3 py-1.5 text-xs text-text-primary"
														value={q.type}
														onChange={(e) => {
															const newSections = [...sections];
															newSections[sIdx].questions[qIdx].type = e.target.value;
															setSections(newSections);
														}}
													>
														{Object.values(QuestionType).map((t) => (
															<option key={t} value={t}>{t}</option>
														))}
													</select>
												</div>
												<div className="space-y-2">
													<label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Rel. Weight</label>
													<input
														type="number"
														className="w-full bg-panel border-border-color border rounded px-3 py-1.5 text-xs text-text-primary"
														value={q.weight}
														onChange={(e) => {
															const newSections = [...sections];
															newSections[sIdx].questions[qIdx].weight = Number(e.target.value);
															setSections(newSections);
														}}
													/>
												</div>
												<div className="col-span-2 flex items-center gap-6 pt-2">
													<label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-primary cursor-pointer">
														<input
															type="checkbox"
															className="accent-accent"
															checked={q.required}
															onChange={(e) => {
																const newSections = [...sections];
																newSections[sIdx].questions[qIdx].required = e.target.checked;
																setSections(newSections);
															}}
														/>
														Required
													</label>
													<label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 cursor-pointer">
														<input
															type="checkbox"
															className="accent-red-500"
															checked={q.isHardRequirement}
															onChange={(e) => {
																const newSections = [...sections];
																newSections[sIdx].questions[qIdx].isHardRequirement = e.target.checked;
																setSections(newSections);
															}}
														/>
														Auto-Fail Threshold
													</label>
												</div>
											</div>
										</div>
										<button 
											className="p-2 text-text-muted hover:text-red-500 transition-colors"
											onClick={() => removeQuestion(sIdx, qIdx)}
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
										</button>
									</div>
								</div>
							))}
							<button
								onClick={() => addQuestion(sIdx)}
								className="w-full py-3 border-2 border-dashed border-border-color/50 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-text-muted hover:border-accent/50 hover:text-accent transition-all bg-panel/30"
							>
								+ Add Question to {section.title}
							</button>
						</div>
					</Card>
				))}

				<button
					onClick={addSection}
					className="w-full py-6 border-2 border-dashed border-accent/20 rounded-2xl text-sm font-black uppercase tracking-[0.3em] text-accent/60 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
				>
					+ Deploy New Section
				</button>
			</div>
		</div>
	);
}
