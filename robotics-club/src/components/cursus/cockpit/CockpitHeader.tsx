"use client";

import { useState } from "react";
import Image from "next/image";
import { BlackholeTimer } from "@/components/ui/BlackholeTimer";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface CockpitHeaderProps {
	team: any;
	currentUser: any;
	isAdmin: boolean;
}

export function CockpitHeader({ team, currentUser, isAdmin }: CockpitHeaderProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [name, setName] = useState(team.name || "Unnamed Squad");
	const [isEditing, setIsEditing] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const isLeader = team.leaderId === currentUser.id;
	const canEdit = isLeader || isAdmin;

	const handleSaveName = async () => {
		if (!name.trim()) return setIsEditing(false);
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}`, {
				method: "PATCH",
				body: JSON.stringify({ name: name.trim() }),
			});
			if (!res.ok) throw new Error("Failed to update name");
			toast("Team name updated!", "success");
			playSFX("achievement");
			setIsEditing(false);
		} catch (err) {
			toast("Failed to update name", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const activatedDate = new Date(team.activatedAt || team.createdAt);
	const projectDay = Math.ceil((new Date().getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24));

	return (
		<div className="bg-panel border-b border-white/5 p-6 shadow-2xl backdrop-blur-3xl">
			<div className="container mx-auto max-w-6xl">
				<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					{/* Left: Back & Project Info */}
					<div className="flex items-center gap-6">
						<a 
							href="/cursus" 
							className="group flex h-10 w-10 items-center justify-center rounded-full bg-panel-2 border border-white/5 text-text-muted hover:text-accent hover:border-accent/20 transition-all"
							title="Back to Cursus"
						>
							<span className="text-xl transition-transform group-hover:-translate-x-1">←</span>
						</a>
						<div className="h-10 w-px bg-white/5" />
						<Badge rank={team.project.rank} size="lg" />
						<div className="space-y-1">
							<p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Mission Active</p>
							<div className="flex items-center gap-3">
								<h1 className="text-3xl font-black tracking-tighter text-text-primary">
									{team.project.title}
								</h1>
								<span className="text-2xl text-text-muted/30">/</span>
								{isEditing ? (
									<div className="flex items-center gap-2">
										<input
											autoFocus
											value={name}
											onChange={(e) => setName(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
											className="bg-background border border-accent/50 rounded-lg px-3 py-1 text-xl font-black outline-none focus:ring-2 ring-accent/20 min-w-[200px]"
										/>
										<button 
											disabled={isLoading}
											onClick={handleSaveName}
											className="text-xs font-black uppercase tracking-widest text-accent hover:text-accent-bright transition-colors"
										>
											{isLoading ? "..." : "Save"}
										</button>
									</div>
								) : (
									<div className="flex items-center gap-2 group">
										<h2 className="text-2xl font-black tracking-tight text-text-muted group-hover:text-text-primary transition-colors">
											{name}
										</h2>
										{canEdit && (
											<button 
												onClick={() => setIsEditing(true)}
												className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5 rounded"
											>
												<span className="text-xs">✏️</span>
											</button>
										)}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Center: Mission Health */}
					<div className="flex items-center gap-8 border-l border-white/10 pl-8 md:border-l-0 md:pl-0">
						<div className="text-center">
							<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Day</p>
							<p className="text-2xl font-black text-text-primary">{projectDay}</p>
						</div>
						<div className="h-10 w-px bg-white/10" />
						<div className="text-center">
							<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Health</p>
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
								<p className="text-base font-black text-emerald-400 uppercase tracking-tighter transition-all">On Track</p>
							</div>
						</div>
					</div>

					{/* Right: Blackhole & Members */}
					<div className="flex flex-col gap-4 md:items-end">
						{team.blackholeDeadline && (
							<BlackholeTimer 
								deadline={team.blackholeDeadline} 
								activatedAt={team.activatedAt || team.createdAt}
								className="w-48"
							/>
						)}
						<div className="flex -space-x-3">
							{team.members.map((m: any) => (
								<div 
									key={m.userId}
									className="group relative h-10 w-10 overflow-hidden rounded-full border-2 border-panel bg-panel-2 transition-transform hover:scale-110 hover:z-10"
								>
									<Image
										src={m.user.image || `https://ui-avatars.com/api/?name=${m.user.login}&background=random`}
										alt={m.user.login}
										fill
										className="object-cover"
									/>
									<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
										<p className="text-[8px] font-black uppercase tracking-widest text-white">{m.user.login}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
