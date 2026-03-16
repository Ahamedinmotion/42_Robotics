"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { ClientAvatar } from "./ClientAvatar";
import { ProfileCard } from "./ProfileCard";
import { THEMES } from "@/lib/themes";

const RANK_COLOURS: Record<string, string> = {
	E: "#888888", D: "#44AAFF", C: "#44FF88",
	B: "#FFD700", A: "#FF6B00", S: "#CC44FF",
};

function formatMonthYear(date: Date | string) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(date));
}

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="text-center">
			<p className="text-xl font-bold text-accent">{value}</p>
			<p className="text-xs text-text-muted">{label}</p>
		</div>
	);
}

interface Milestone {
	title: string;
	timestamp: Date | string;
}

interface FunStats {
	totalLabHours: number;
	longestReportWords: number;
	mostUsedWord: string;
	ungodlyCount: number;
}

interface ProfileHeaderProps {
	user: any;
	title: string | null;
	completedProjects: number;
	evalsGiven: number;
	milestones: Milestone[];
	funStats: FunStats;
}

export function ProfileHeader({ user, title, completedProjects, evalsGiven, milestones, funStats }: ProfileHeaderProps) {
	const [showFlashback, setShowFlashback] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [flashbackIndex, setFlashbackIndex] = useState(-1);
	const [clickCount, setClickCount] = useState(0);
	const [lastClickTime, setLastClickTime] = useState(0);
	const [patienceMessage, setPatienceMessage] = useState(false);
	const [showSimoleons, setShowSimoleons] = useState(false);

	const handleRankClick = async () => {
		const now = Date.now();
		if (now - lastClickTime > 2000) {
			setClickCount(1);
		} else {
			const newCount = clickCount + 1;
			setClickCount(newCount);
			
			if (newCount === 42) {
				// PATIENCE ASCENDED
				import('canvas-confetti').then((confetti) => {
					confetti.default({
						particleCount: 150,
						spread: 70,
						origin: { y: 0.6 },
						colors: ['#FFD700', '#FFA500', '#FF4500']
					});
				});
				setPatienceMessage(true);
				setTimeout(() => setPatienceMessage(false), 3000);
				
				// Unlock achievement
				try {
					await fetch("/api/user/achievements/unlock", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ key: "PATIENCE" }),
					});
				} catch (e) {
					console.error("Failed to unlock Patience:", e);
				}
			}
		}
		setLastClickTime(now);
	};

	useEffect(() => {
		const handleRosebud = () => {
			if (showStats) {
				setShowSimoleons(true);
				setTimeout(() => setShowSimoleons(false), 3000);
			}
		};
		window.addEventListener("rc-rosebud", handleRosebud);
		return () => window.removeEventListener("rc-rosebud", handleRosebud);
	}, [showStats]);

	const handleAvatarClick = () => {
		if (!user.isOwn) return;
		const newCount = clickCount + 1;
		if (newCount >= 3) {
			setShowStats(true);
			setClickCount(0);
		} else {
			setClickCount(newCount);
			// Reset count after 2 seconds of inactivity
			setTimeout(() => setClickCount(0), 2000);
		}
	};

	useEffect(() => {
		if (showFlashback) {
			setFlashbackIndex(-1);
			const interval = setInterval(() => {
				setFlashbackIndex(prev => {
					if (prev >= milestones.length - 1) {
						clearInterval(interval);
						setTimeout(() => setShowFlashback(false), 2000);
						return prev;
					}
					return prev + 1;
				});
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [showFlashback, milestones]);

	return (
		<div className="relative flex flex-col items-start justify-between gap-6 rounded-2xl bg-panel p-6 sm:flex-row sm:items-center">
			{/* Profile ID Card Trigger */}
			<div className="absolute right-4 top-4">
				<ProfileCard
					user={{
						id: user.id,
						name: user.name,
						login: user.login,
						avatar: user.image,
						currentRank: user.currentRank,
						joinedAt: user.joinedAt,
						skillProgress: user.skillProgress,
						completedProjects: completedProjects,
					}}
				/>
			</div>

			<div className="flex items-center gap-5">
				<div onClick={handleAvatarClick} className="cursor-pointer">
					<ClientAvatar src={user.image} login={user.login} isOwn={!!user.isOwn} />
				</div>
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold text-text-primary">{user.name}</h1>
						<div onClick={handleRankClick} className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
							<Badge rank={user.currentRank as any} size="lg" />
						</div>
					</div>

					{patienceMessage && (
						<div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
							<div className="bg-background/80 backdrop-blur-sm border border-accent p-6 rounded-lg shadow-2xl animate-in zoom-in duration-300 text-center">
								<p className="text-accent font-bold text-lg mb-1">42.</p>
								<p className="text-sm text-text-muted">You have too much free time.</p>
								<p className="text-sm text-text-muted">We respect that.</p>
							</div>
						</div>
					)}
					
					{title && (
						<span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
							{title}
						</span>
					)}
					
					<p className="text-sm text-text-muted mt-1">@{user.login}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-x-8 gap-y-3">
				<StatCard label="Projects Completed" value={completedProjects} />
				<StatCard label="Evaluations Given" value={evalsGiven} />
				<StatCard label="Member Since" value={formatMonthYear(user.joinedAt)} />
				<div className="text-center">
					<p className="text-xl font-bold" style={{ color: RANK_COLOURS[user.currentRank] || "#888" }}>
						{user.currentRank}
					</p>
					<p className="text-xs text-text-muted">Current Rank</p>
				</div>
			</div>

			{/* Flashback Overlay */}
			{showFlashback && (
				<div 
					className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-500"
					onClick={() => setShowFlashback(false)}
				>
					<div className="max-w-md space-y-8 text-center">
						<h2 className="text-4xl font-bold text-accent">Rank Flashback</h2>
						<div className="min-h-[200px] space-y-4">
							{milestones.slice(0, flashbackIndex + 1).map((m, i) => (
								<div key={i} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
									<p className="text-2xl font-bold text-text-primary">{m.title}</p>
									<p className="text-sm text-text-muted">{new Date(m.timestamp).toLocaleDateString()}</p>
								</div>
							))}
						</div>
						{flashbackIndex >= milestones.length - 1 && (
							<p className="animate-bounce pt-8 text-xl font-bold text-accent">RANK {user.currentRank} REACHED</p>
						)}
					</div>
				</div>
			)}

			{/* Stats Modal */}
			{showStats && (
				<div 
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
					onClick={() => setShowStats(false)}
				>
					<div 
						className="w-full max-w-sm rounded-2xl border border-border-color bg-panel p-8 shadow-2xl animate-in zoom-in-95 duration-300"
						onClick={e => e.stopPropagation()}
					>
						<h3 className="mb-6 text-center text-xl font-bold text-text-primary">Your Stats (the weird ones)</h3>
						<div className="space-y-6">
							<div className="relative flex items-center justify-between border-b border-border-color pb-2">
								<span className="text-sm text-text-muted">Total Lab Hours</span>
								<div className="flex flex-col items-end">
									<span className="text-lg font-bold text-accent">{funStats.totalLabHours}h</span>
									{showSimoleons && (
										<div className="absolute right-0 top-0 flex flex-col items-end animate-out fade-out slide-out-to-top duration-1000">
											<span className="text-xs font-bold text-green-500">§1000</span>
											<span className="text-[8px] text-green-400 opacity-50">Rosebud...</span>
										</div>
									)}
								</div>
							</div>
							<div className="flex items-center justify-between border-b border-border-color pb-2">
								<span className="text-sm text-text-muted">Longest Report</span>
								<span className="text-lg font-bold text-accent">{funStats.longestReportWords} words</span>
							</div>
							<div className="flex items-center justify-between border-b border-border-color pb-2">
								<span className="text-sm text-text-muted">Most Used Word</span>
								<span className="text-lg font-bold text-accent uppercase">{funStats.mostUsedWord}</span>
							</div>
							<div className="flex items-center justify-between border-b border-border-color pb-2">
								<span className="text-sm text-text-muted">Ungodly Hour Evals</span>
								<span className="text-lg font-bold text-accent">{funStats.ungodlyCount}</span>
							</div>
						</div>
						<button 
							onClick={() => setShowStats(false)}
							className="mt-8 w-full rounded-lg bg-panel2 py-2 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
