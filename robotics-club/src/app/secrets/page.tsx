"use client";

import { useSession } from "next-auth/react";
import { THEMES } from "@/lib/themes";
import { ThemeEngine } from "@/lib/theme-engine";
import { Card } from "@/components/ui/Card";

export default function SecretsPage() {
	const { data: session } = useSession();

	if (!session?.user) {
		return <div className="min-h-screen bg-black" />; // Hidden if not authed
	}

	const unlockedThemes = (session.user as any).unlockedThemes || [];
	const activeTheme = (session.user as any).activeTheme;

	return (
		<div className="min-h-screen bg-[#050505] text-text-primary p-8 md:p-16">
			<div className="max-w-5xl mx-auto space-y-12">
				<div className="text-center space-y-2">
					<p className="text-[10px] uppercase tracking-[0.3em] text-text-muted opacity-50">
						You found it. We weren't sure anyone would.
					</p>
					<h1 className="text-4xl font-black uppercase tracking-tighter">The Vault</h1>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{THEMES.map((theme) => {
						const isUnlocked = unlockedThemes.includes(theme.id);
						return (
							<Card
								key={theme.id}
								className={`relative overflow-hidden p-6 border-2 transition-all duration-500 ${
									isUnlocked
										? "border-accent/20 bg-panel/40 hover:border-accent/50 cursor-pointer"
										: "border-white/5 bg-white/2 opacity-40 grayscale"
								} ${activeTheme === theme.id ? "ring-2 ring-accent shadow-[0_0_20px_rgba(255,107,0,0.2)]" : ""}`}
								onClick={() => isUnlocked && ThemeEngine.activateTheme(theme.id)}
							>
								{!isUnlocked && (
									<div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-10">
										<svg className="w-8 h-8 text-text-muted opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
								)}

								<div className="space-y-4">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="text-lg font-black uppercase tracking-tight">
												{isUnlocked ? theme.name : "???"}
											</h3>
											<p className="text-[10px] text-text-muted italic">
												{isUnlocked ? theme.description : theme.unlockHint}
											</p>
										</div>
										{isUnlocked && (
											<div className="flex gap-1">
												<div className="h-2 w-2 rounded-full bg-accent" />
												<div className="h-2 w-2 rounded-full bg-accent-secondary" />
											</div>
										)}
									</div>

									{isUnlocked && (
										<div className="pt-4 flex justify-end">
											<span className="text-[10px] uppercase font-bold tracking-widest text-accent">
												{activeTheme === theme.id ? "ACTIVE" : "EQUIP"}
											</span>
										</div>
									)}
								</div>
							</Card>
						);
					})}
				</div>

				<div className="pt-16 border-t border-white/5">
					<h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-8 text-center">
						Discoveries
					</h2>
					<div className="flex justify-center italic text-sm text-text-muted/30">
						More discoveries coming...
					</div>
				</div>
			</div>
		</div>
	);
}
