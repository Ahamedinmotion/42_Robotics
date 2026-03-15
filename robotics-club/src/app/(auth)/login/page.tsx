"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function LoginPage() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		setScrolled(true);
	}, []);

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
			{/* Dramatic radial background behind everything */}
			<div className="absolute inset-0 z-0 bg-background mix-blend-multiply" />
			<div className="absolute -left-1/4 -top-1/4 z-0 h-[150%] w-[150%] bg-[radial-gradient(circle_at_center,var(--glow-secondary),transparent_50%)] opacity-30 blur-3xl animate-pulse" />
			<div className="absolute -bottom-1/4 -right-1/4 z-0 h-[100%] w-[100%] bg-[radial-gradient(circle_at_center,var(--glow-primary),transparent_50%)] opacity-20 blur-[100px]" />

			<div className={`relative z-10 flex min-h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border-color bg-panel2/60 shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-1000 ease-out md:flex-row ${scrolled ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
				
				{/* Left Hero Section */}
				<div className="relative flex flex-col justify-between overflow-hidden border-b border-border-color bg-panel/40 p-12 md:w-3/5 md:border-b-0 md:border-r">
					{/* Glowing corner accent */}
					<div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-accent opacity-20 blur-[60px]" />
					
					<div className="z-10 mt-8 space-y-6">
						<h1 className="text-glow text-6xl font-black tracking-tighter text-text-white lg:text-8xl">
							ROBOTICS
							<br />
							<span className="text-glow text-accent">CLUB</span>
						</h1>
						<p className="max-w-md text-lg font-medium tracking-wide text-text-primary/90">
							A ranked engineering curriculum for the makers, builders, and breakers at 42.
						</p>
					</div>

					{/* Structural graphic element */}
					<div className="relative mt-16 h-48 w-full">
						<div className="absolute inset-0 flex items-end">
							<svg viewBox="0 0 400 100" className="w-full opacity-60 mix-blend-screen">
								{/* Grid base */}
								<path d="M0 80 L400 80 M0 90 L400 90 M0 100 L400 100" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
								{/* Glowing Rank Path */}
								<path d="M20 90 L100 50 L180 80 L260 20 L340 60" fill="none" stroke="var(--accent-secondary)" strokeWidth="3" className="drop-shadow-[0_0_8px_var(--glow-secondary)]" />
								{/* Nodes */}
								{["E", "D", "C", "B", "A", "S"].map((rank, i) => {
									const x = 20 + i * ((400 - 40) / 5);
									const ys = [90, 50, 80, 20, 60, 10];
									return (
										<g key={rank}>
											<circle cx={x} cy={ys[i]} r="6" fill="var(--panel)" stroke="var(--accent)" strokeWidth="2" />
											<text x={x} y={ys[i] - 15} textAnchor="middle" fontSize="12" fill="var(--text-white)" fontWeight="800" className="drop-shadow-[0_0_4px_var(--glow-primary)]">{rank}</text>
										</g>
									);
								})}
							</svg>
						</div>
					</div>
				</div>

				{/* Right Login Section */}
				<div className="relative flex flex-col items-center justify-center p-12 md:w-2/5">
					<div className="w-full max-w-sm space-y-8">
						<div className="space-y-2">
							<h2 className="text-3xl font-bold text-text-white">Authorization</h2>
							<p className="text-sm text-text-muted">Enter the network to access your projects, material allocations, and evaluations.</p>
						</div>

						<div className="space-y-4">
							<button
								onClick={() => signIn("42-school", { callbackUrl: "/home" })}
								className="glowing-primary group relative w-full rounded-lg px-6 py-4 text-center font-bold text-text-white transition-all hover:scale-[1.02]"
							>
								{/* Animated inner border line */}
								<div className="absolute inset-0 rounded-lg border border-accent/0 mix-blend-overlay transition-colors group-hover:border-accent/100" />
								<span className="relative z-10 flex items-center justify-center gap-3">
									<svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
										{/* 42 Logo Path Placeholder */}
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" />
									</svg>
									Authenticate via 42
								</span>
							</button>

							<p className="text-center text-xs text-text-muted">
								Unauthorised access is strictly prohibited. Logging in implies agreement to the robotics-club evaluation manifest.
							</p>

							{process.env.NODE_ENV === "development" && (
								<div className="pt-4 border-t border-border-color/30">
									<button
										onClick={() => signIn("credentials", { callbackUrl: "/home" })}
										className="group flex w-full items-center justify-center gap-2 rounded-lg border border-border-color bg-panel/30 py-3 text-xs font-black uppercase tracking-[0.2em] text-text-muted transition-all hover:bg-panel/60 hover:text-accent"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
										</svg>
										Developer Access
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
