"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface PostMortemFormProps {
	team: any;
	onSuccess: () => void;
}

export function PostMortemForm({ team, onSuccess }: PostMortemFormProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [isLoading, setIsLoading] = useState(false);
	
	const [whatWorked, setWhatWorked] = useState("");
	const [whatDidnt, setWhatDidnt] = useState("");
	const [wouldDoBetter, setWouldDoBetter] = useState("");

	const handleSubmit = async () => {
		if (!whatWorked || !whatDidnt || !wouldDoBetter) {
			return toast("All fields are required", "error");
		}
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/post-mortem`, {
				method: "POST",
				body: JSON.stringify({ whatWorked, whatDidnt, wouldDoBetter }),
			});
			if (!res.ok) throw new Error("Failed to submit post-mortem");
			toast("Reflection submitted. Thank you for your feedback!", "success");
			playSFX("achievement");
			onSuccess();
		} catch (err) {
			toast("Failed to submit reflection", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
			<div className="text-center space-y-4">
				<h3 className="text-4xl font-black tracking-tight text-text-primary italic">Mission Post-Mortem</h3>
				<p className="text-sm text-text-muted max-w-md mx-auto">
					Mission Complete. Take a moment to reflect on the squad&apos;s journey. Your insights help improve the curriculum for future cadets.
				</p>
			</div>

			<Card className="p-10 space-y-10 bg-panel-2 border-accent/20">
				<div className="space-y-4">
					<label className="text-xs font-black uppercase tracking-[0.2em] text-accent">Section 1: The Victories</label>
					<h4 className="text-lg font-bold text-text-primary">What worked well during this mission?</h4>
					<textarea 
						value={whatWorked}
						onChange={(e) => setWhatWorked(e.target.value)}
						placeholder="Technical wins, team dynamics, tools that helped..."
						className="w-full h-32 bg-background border border-border rounded-2xl p-6 text-sm outline-none focus:ring-2 ring-accent/20 resize-none"
					/>
				</div>

				<div className="space-y-4">
					<label className="text-xs font-black uppercase tracking-[0.2em] text-accent-urgency">Section 2: The Hurdles</label>
					<h4 className="text-lg font-bold text-text-primary">What didn&apos;t go as planned?</h4>
					<textarea 
						value={whatDidnt}
						onChange={(e) => setWhatDidnt(e.target.value)}
						placeholder="Bottlenecks, failures, miscommunications..."
						className="w-full h-32 bg-background border border-border rounded-2xl p-6 text-sm outline-none focus:ring-2 ring-accent/20 resize-none"
					/>
				</div>

				<div className="space-y-4">
					<label className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Section 3: The Future</label>
					<h4 className="text-lg font-bold text-text-primary">What would you do differently next time?</h4>
					<textarea 
						value={wouldDoBetter}
						onChange={(e) => setWouldDoBetter(e.target.value)}
						placeholder="Better planning? Different Tech? More collaboration?"
						className="w-full h-32 bg-background border border-border rounded-2xl p-6 text-sm outline-none focus:ring-2 ring-accent/20 resize-none"
					/>
				</div>

				<div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
					<Button 
						size="lg" 
						disabled={isLoading}
						onClick={handleSubmit}
						className="w-full h-16 text-sm font-black uppercase tracking-[0.3em]"
					>
						{isLoading ? "Archiving..." : "Archive Reflection"}
					</Button>
					<p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
						Your reflection is private to moderators and staff
					</p>
				</div>
			</Card>
		</div>
	);
}
