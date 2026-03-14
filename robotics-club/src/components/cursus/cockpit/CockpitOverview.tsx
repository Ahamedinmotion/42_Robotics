"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PhotoTimeline } from "./PhotoTimeline";

interface CockpitOverviewProps {
	team: any;
	isAdmin: boolean;
}

export function CockpitOverview({ team, isAdmin }: CockpitOverviewProps) {
	const { toast } = useToast();
	const [repoUrl, setRepoUrl] = useState(team.repoUrl || "");
	const [isEditingRepo, setIsEditingRepo] = useState(!team.repoUrl);
	const [githubStats, setGithubStats] = useState<any>(null);
	const [scratchpad, setScratchpad] = useState(team.scratchpad?.content || "");
	const [isSavingScratchpad, setIsSavingScratchpad] = useState(false);
	const [lastSavedBy, setLastSavedBy] = useState(team.scratchpad?.lastEditedBy?.login);

	// GitHub Stats Fetching
	useEffect(() => {
		if (repoUrl && repoUrl.includes("github.com")) {
			const repoPath = repoUrl.split("github.com/")[1];
			if (repoPath) {
				fetch(`https://api.github.com/repos/${repoPath}`)
					.then(res => res.json())
					.then(data => {
						if (data.stargazers_count !== undefined) {
							setGithubStats(data);
						}
					})
					.catch(() => setGithubStats(null));
			}
		}
	}, [repoUrl]);

	// Scratchpad Auto-save
	useEffect(() => {
		if (scratchpad === (team.scratchpad?.content || "")) return;

		const timer = setTimeout(async () => {
			setIsSavingScratchpad(true);
			try {
				const res = await fetch(`/api/teams/${team.id}/scratchpad`, {
					method: "PATCH",
					body: JSON.stringify({ content: scratchpad }),
				});
				if (res.ok) {
					// Optionally update lastSavedBy if needed
				}
			} catch (err) {
				console.error("Failed to save scratchpad", err);
			} finally {
				setIsSavingScratchpad(false);
			}
		}, 2000);

		return () => clearTimeout(timer);
	}, [scratchpad, team.id, team.scratchpad?.content]);

	const handleSaveRepo = async () => {
		try {
			const res = await fetch(`/api/teams/${team.id}`, {
				method: "PATCH",
				body: JSON.stringify({ repoUrl }),
			});
			if (res.ok) {
				toast("Repository updated!", "success");
				setIsEditingRepo(false);
			}
		} catch (err) {
			toast("Failed to update repository", "error");
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			{/* GitHub Panel */}
			<div className="space-y-6">
				<h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted">Command & Control</h3>
				<Card className="p-8 space-y-6 bg-panel-2/50 border-border/50">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<p className="text-xs font-black uppercase tracking-widest text-text-muted">GitHub Repository</p>
							{!isEditingRepo && (
								<button 
									onClick={() => setIsEditingRepo(true)}
									className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline"
								>
									Change
								</button>
							)}
						</div>
						
						{isEditingRepo ? (
							<div className="flex gap-2">
								<input 
									placeholder="https://github.com/user/repo"
									value={repoUrl}
									onChange={(e) => setRepoUrl(e.target.value)}
									className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-accent/20"
								/>
								<Button size="sm" onClick={handleSaveRepo}>Link</Button>
							</div>
						) : (
							<a 
								href={repoUrl} 
								target="_blank" 
								rel="noopener noreferrer"
								className="block p-4 rounded-xl bg-background border border-border hover:border-accent/50 transition-all group"
							>
								<div className="flex items-center justify-between">
									<p className="text-sm font-bold text-text-primary truncate">{repoUrl.split('github.com/')[1]}</p>
									<span className="text-accent group-hover:translate-x-1 transition-transform">↗</span>
								</div>
							</a>
						)}
					</div>

					{githubStats && (
						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 rounded-xl bg-background border border-border">
								<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stars</p>
								<p className="text-xl font-black text-text-primary">{githubStats.stargazers_count}</p>
							</div>
							<div className="p-4 rounded-xl bg-background border border-border">
								<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Forks</p>
								<p className="text-xl font-black text-text-primary">{githubStats.forks_count}</p>
							</div>
							<div className="p-4 rounded-xl bg-background border border-border col-span-2">
								<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Last Push</p>
								<p className="text-sm font-bold text-text-primary">
									{new Date(githubStats.pushed_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
								</p>
							</div>
						</div>
					)}

					<div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
						<p className="text-[10px] leading-relaxed text-accent/80 font-bold uppercase tracking-tight">
							Ensure your repository is PUBLIC for auto-sync. Stale repositories may trigger a health warning.
						</p>
					</div>
				</Card>
			</div>

			{/* Shared Scratchpad */}
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted">Shared Scratchpad</h3>
					{isSavingScratchpad ? (
						<span className="text-[10px] font-black uppercase tracking-widest text-accent animate-pulse">Syncing...</span>
					) : (
						<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Synced</span>
					)}
				</div>
				<Card className="h-[400px] flex flex-col overflow-hidden bg-panel-2/50 border-border/50">
					<textarea 
						placeholder="Start typing to collaborate with your team..."
						value={scratchpad}
						onChange={(e) => setScratchpad(e.target.value)}
						className="flex-1 w-full p-8 bg-transparent outline-none resize-none text-sm font-medium leading-relaxed custom-scrollbar"
					/>
					<div className="p-4 bg-background/50 border-t border-border flex items-center justify-between">
						<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
							Auto-saves as you type
						</p>
						{lastSavedBy && (
							<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
								Last edit: <span className="text-accent">{lastSavedBy}</span>
							</p>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
