"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ProjectProposalForm() {
	const [form, setForm] = useState({ title: "", description: "", referenceMaterials: "", recommendedTech: "" });
	const [submitting, setSubmitting] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title || !form.description) {
			toast("Please fill in the concept title and description.", "error");
			return;
		}
		
		setSubmitting(true);
		try {
			// Mocking API call for now. Future PR will wire this up to PR proposals API if needed.
			await new Promise(r => setTimeout(r, 1500));
			toast("Project Proposal submitted to Headquarters successfully!");
			setForm({ title: "", description: "", referenceMaterials: "", recommendedTech: "" });
		} catch {
			toast("Network error occurred.", "error");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Card className="max-w-2xl mx-auto p-8 space-y-8 bg-panel2/40 border border-accent/20 shadow-[0_0_30px_rgba(var(--accent-rgb),0.05)] backdrop-blur-xl">
			<div className="space-y-3 text-center border-b border-accent/10 pb-6">
				<div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
					<span className="text-2xl">✨</span>
				</div>
				<h2 className="text-2xl font-black uppercase tracking-[0.2em] text-accent">Project Proposal</h2>
				<p className="text-[10px] uppercase font-bold tracking-widest text-text-muted leading-relaxed max-w-md mx-auto">
					Propose a new mission or concept to the curriculum. This is a Rank B+ privilege. Your proposal will be reviewed by the Project Managers.
				</p>
			</div>
			
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Concept Title</label>
					<input 
						className="w-full rounded-xl border border-white/5 bg-background p-4 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all placeholder:text-text-muted/30 font-medium"
						placeholder="e.g. Autonomous Drone Navigation"
						value={form.title}
						onChange={(e) => setForm({...form, title: e.target.value})}
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Mission Description</label>
					<textarea 
						className="w-full rounded-xl border border-white/5 bg-background p-4 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all min-h-[120px] placeholder:text-text-muted/30 leading-relaxed"
						placeholder="Describe your project idea in detail. What are the objectives? What will students learn?"
						value={form.description}
						onChange={(e) => setForm({...form, description: e.target.value})}
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Recommended Technologies</label>
					<input 
						className="w-full rounded-xl border border-white/5 bg-background p-4 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all placeholder:text-text-muted/30"
						placeholder="e.g. ROS2, Python, Computer Vision"
						value={form.recommendedTech}
						onChange={(e) => setForm({...form, recommendedTech: e.target.value})}
					/>
				</div>
				<div className="space-y-2">
					<label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Reference Materials / Links</label>
					<textarea 
						className="w-full rounded-xl border border-white/5 bg-background p-4 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all min-h-[80px] placeholder:text-text-muted/30"
						placeholder="Links to research papers, existing implementations, datasets..."
						value={form.referenceMaterials}
						onChange={(e) => setForm({...form, referenceMaterials: e.target.value})}
					/>
				</div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 pb-1 block">Concept Content</label>
                    <div className="w-full rounded-2xl border-2 border-dashed border-white/10 bg-background/30 p-10 text-center hover:border-accent/40 transition-colors cursor-pointer group">
						<div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-accent/10 transition-colors">
							<svg className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
							</svg>
						</div>
                        <p className="text-xs text-text-muted font-bold">Drag & drop concept art or diagrams here</p>
                        <p className="text-[9px] font-black mt-2 opacity-40 uppercase tracking-[0.2em]">(Feature Coming Soon)</p>
                    </div>
                </div>

				<div className="pt-6">
					<Button variant="primary" size="lg" className="w-full h-14 font-black uppercase tracking-[0.2em]" disabled={submitting}>
						{submitting ? "Transmitting Proposal..." : "Submit Proposal →"}
					</Button>
				</div>
			</form>
		</Card>
	);
}
