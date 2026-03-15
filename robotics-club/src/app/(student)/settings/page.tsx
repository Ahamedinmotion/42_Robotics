"use client";

import { useSound } from "@/components/providers/SoundProvider";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { THEMES } from "@/lib/themes";
import { ThemeEngine } from "@/lib/theme-engine";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
	const { soundsEnabled, setSoundsEnabled, playSFX } = useSound();
	const { data: session } = useSession();

	const handleToggleSounds = (enabled: boolean) => {
		setSoundsEnabled(enabled);
		if (enabled) {
			// Small delay to ensure state update if needed, though useSound handles it
			setTimeout(() => playSFX("button"), 50);
		}
	};

	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showToggleLevel, setShowToggleLevel] = useState(false);
	const [understandChecked, setUnderstandChecked] = useState(false);
	const [soulMode, setSoulMode] = useState(false);
	const [isApplying, setIsApplying] = useState(false);

	const handleSoulToggle = async () => {
		if (!understandChecked || isApplying) return;
		
		setIsApplying(true);
		setTimeout(async () => {
			setSoulMode(true);
			setIsApplying(false);
			
			// Unlock achievement
			try {
				await fetch("/api/user/achievements/unlock", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ key: "FOUND_NOTHING" }),
				});
			} catch (e) {
				console.error("Failed to unlock Found Nothing:", e);
			}
		}, 2000);
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
					<div className="flex items-center justify-between mb-6">
						<div>
							<h3 className="font-bold text-text-primary">Visual Basis</h3>
							<p className="text-xs text-text-muted">Choose your foundational lighting.</p>
						</div>
					</div>
					<div className="flex justify-center p-4 bg-background rounded-xl border border-border-color">
						<ThemeToggle />
					</div>
				</Card>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{THEMES.filter(t => (session?.user as any).unlockedThemes?.includes(t.id)).map(theme => (
						<Card key={theme.id} className={`p-4 transition-all hover:scale-[1.02] cursor-pointer ${ (session?.user as any).activeTheme === theme.id ? 'ring-2 ring-accent' : ''}`} onClick={() => ThemeEngine.activateTheme(theme.id)}>
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-bold text-sm text-text-primary">{theme.name}</h4>
									<p className="text-[10px] text-text-muted">{theme.description}</p>
								</div>
								<div className="flex gap-1">
									<div className="h-3 w-3 rounded-full bg-accent" />
									<div className="h-3 w-3 rounded-full bg-accent-secondary" />
									<div className="h-3 w-3 rounded-full bg-accent-tertiary" />
								</div>
							</div>
						</Card>
					))}
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Account</h2>
				<Card className="p-6 opacity-50 mb-4">
					<p className="text-sm text-center italic text-text-muted">Additional account settings coming soon.</p>
				</Card>

				{!showAdvanced ? (
					<button 
						onClick={() => setShowAdvanced(true)}
						className="text-[10px] text-text-muted hover:text-accent transition-colors block mx-auto uppercase tracking-widest"
					>
						Show advanced settings
					</button>
				) : (
					<div className="space-y-4 pt-4 border-t border-border-color animate-in fade-in slide-in-from-top-2 duration-500">
						<h3 className="text-xs font-bold uppercase tracking-widest text-red-500/50">Advanced</h3>
						<Card className="p-6">
							{!showToggleLevel ? (
								<div className="text-center">
									<p className="text-sm text-text-muted mb-4">Are you sure you want to see this?</p>
									<button 
										onClick={() => setShowToggleLevel(true)}
										className="rounded-lg bg-panel2 px-4 py-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
									>
										Yes, show me
									</button>
								</div>
							) : (
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<div>
											<h4 className="font-bold text-text-primary">Dark mode for your soul</h4>
											<p className="text-xs text-text-muted">This cannot be undone. Probably.</p>
										</div>
										<div className="flex items-center gap-4">
											{isApplying && <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
											<button
												onClick={handleSoulToggle}
												disabled={!understandChecked || soulMode || isApplying}
												className={`relative h-6 w-11 rounded-full transition-colors ${soulMode ? "bg-accent" : "bg-panel2"} ${(!understandChecked || soulMode || isApplying) ? "opacity-30 cursor-not-allowed" : ""}`}
											>
												<div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${soulMode ? "translate-x-5" : "translate-x-0"}`} />
											</button>
										</div>
									</div>
									
									{!soulMode && (
										<label className="flex items-center gap-3 cursor-pointer group">
											<input 
												type="checkbox" 
												checked={understandChecked}
												onChange={(e) => setUnderstandChecked(e.target.checked)}
												className="h-4 w-4 rounded border-border-color bg-background checked:bg-accent focus:ring-accent transition-all"
											/>
											<span className="text-[10px] text-text-muted group-hover:text-text-primary transition-colors">
												I understand the gravity of my actions.
											</span>
										</label>
									)}
								</div>
							)}
						</Card>
					</div>
				)}
			</section>

			<div className="pt-8 text-center">
				<p className="text-[10px] text-text-muted uppercase tracking-widest">Robotics Club v2.4.0 — Forge Edition</p>
			</div>
		</div>
	);
}
