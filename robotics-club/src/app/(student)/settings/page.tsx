"use client";

import { useSound } from "@/components/providers/SoundProvider";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { THEMES } from "@/lib/themes";
import { ThemeEngine } from "@/lib/theme-engine";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
	const { soundsEnabled, setSoundsEnabled, playSFX } = useSound();
	const { data: session, update: updateSession } = useSession();
	const [unlockedThemes, setUnlockedThemes] = useState<string[]>([]);
	const [activeTheme, setActiveTheme] = useState<string>("FORGE");

	useEffect(() => {
		// Fetch actual DB state to bypass session lag
		fetch("/api/user/me")
			.then(res => res.json())
			.then(res => {
				const data = res.data;
				console.log("Settings hydration data:", data);
				if (data?.unlockedThemes) setUnlockedThemes(data.unlockedThemes);
				if (data?.activeTheme) setActiveTheme(data.activeTheme);
			})
			.catch(err => console.error("Settings hydration error:", err));
	}, []);


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
				<Card className="p-6 overflow-hidden relative">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h3 className="font-bold text-text-primary text-lg">Visual Basis</h3>
							<p className="text-xs text-text-muted">Choose your foundational theme.</p>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{THEMES.map(theme => {
							const isUnlocked = unlockedThemes.includes(theme.id) || (session?.user as any)?.unlockedThemes?.includes(theme.id);
							const isActive = activeTheme === theme.id || (session?.user as any)?.activeTheme === theme.id;
							
							return (
								<div 
									key={theme.id} 
									className={`group relative p-5 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden ${
										isActive 
											? 'border-accent bg-accent/5 ring-1 ring-accent/20 scale-[1.02] shadow-lg shadow-accent/5' 
											: isUnlocked 
												? 'border-border-color bg-panel/50 hover:bg-panel hover:border-text-muted/30'
												: 'border-dashed border-border-color/50 bg-panel2/30 grayscale opacity-60'
									}`}
									onClick={() => isUnlocked && ThemeEngine.activateTheme(theme.id)}
								>
									{/* Lock icon for locked themes */}
									{!isUnlocked && (
										<div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px] z-10">
											<div className="bg-panel2/80 p-2 rounded-full border border-border-color shadow-sm">
												<svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
												</svg>
											</div>
										</div>
									)}

									{/* Theme indicator accent */}
									<div className="absolute top-0 right-0 p-3">
										<div className="flex gap-1.5 items-center">
											{isActive && <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
											<div className={`h-1.5 w-1.5 rounded-full transition-opacity ${isActive ? 'bg-accent' : 'bg-text-muted opacity-20'}`} />
										</div>
									</div>

									<div className="space-y-1">
										<h4 className={`font-black tracking-tighter text-sm uppercase transition-colors ${isActive ? 'text-accent' : 'text-text-primary'}`}>
											{isUnlocked ? theme.name : "Locked Theme"}
										</h4>
										<p className="text-[10px] text-text-muted line-clamp-1 leading-relaxed">
											{isUnlocked ? theme.description : "Keep exploring to unlock this visual basis."}
										</p>
									</div>

									{/* Color preview bar */}
									{isUnlocked && (
										<div className="mt-4 flex h-1 w-full gap-1 rounded-full overflow-hidden opacity-30 group-hover:opacity-60 transition-opacity">
											<div className="flex-1 bg-accent" />
											<div className="flex-1 bg-accent-secondary" />
											<div className="flex-1 bg-accent-tertiary" />
										</div>
									)}
								</div>
							);
						})}
					</div>
				</Card>
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
