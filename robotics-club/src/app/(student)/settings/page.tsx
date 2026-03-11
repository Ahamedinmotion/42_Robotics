"use client";

import { useSound } from "@/components/providers/SoundProvider";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
	const { soundsEnabled, setSoundsEnabled, playSFX } = useSound();

	const handleToggleSounds = (enabled: boolean) => {
		setSoundsEnabled(enabled);
		if (enabled) {
			// Small delay to ensure state update if needed, though useSound handles it
			setTimeout(() => playSFX("button"), 50);
		}
	};

	return (
		<div className="mx-auto max-w-2xl space-y-8">
			<div>
				<h1 className="text-2xl font-black uppercase tracking-tighter text-text-primary">Settings</h1>
				<p className="text-sm text-text-muted">Personalize your Robotics Club experience.</p>
			</div>

			<section className="space-y-4">
				<h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Audio Feedback</h2>
				<Card className="flex items-center justify-between p-6">
					<div>
						<h3 className="font-bold text-text-primary">Sound Effects</h3>
						<p className="text-xs text-text-muted">Play subtle chimes for unlocks and actions.</p>
					</div>
					<button
						onClick={() => handleToggleSounds(!soundsEnabled)}
						className={`relative h-6 w-11 rounded-full transition-colors ${soundsEnabled ? "bg-accent" : "bg-panel2"}`}
					>
						<div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${soundsEnabled ? "translate-x-5" : "translate-x-0"}`} />
					</button>
				</Card>
			</section>

			<section className="space-y-4">
				<h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Theme</h2>
				<Card className="p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="font-bold text-text-primary">Visual Mode</h3>
							<p className="text-xs text-text-muted">Switch between Forge (Dark) and Field (Light) themes.</p>
						</div>
					</div>
					<div className="flex justify-center py-4 bg-background rounded-xl border border-border-color">
						<ThemeToggle />
					</div>
				</Card>
			</section>

			<section className="space-y-4">
				<h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Account</h2>
				<Card className="p-6 opacity-50">
					<p className="text-sm text-center italic text-text-muted">Additional account settings coming soon.</p>
				</Card>
			</section>

			<div className="pt-8 text-center">
				<p className="text-[10px] text-text-muted uppercase tracking-widest">Robotics Club v2.4.0 — Forge Edition</p>
			</div>
		</div>
	);
}
