"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSound } from "@/components/providers/SoundProvider";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface RegistrationTeamStepProps {
	project: any;
	selectedMembers: any[];
	setSelectedMembers: (members: any[]) => void;
	onNext: () => void;
	onOptionB: () => void;
}

export function RegistrationTeamStep({ 
	project, 
	selectedMembers, 
	setSelectedMembers, 
	onNext,
	onOptionB 
}: RegistrationTeamStepProps) {
	const { data: session } = useSession();
	const { playSFX } = useSound();
	const [mode, setMode] = useState<"A" | "B" | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [warnings, setWarnings] = useState<Record<string, string>>({});

	const handleSearch = async (query: string) => {
		setSearchQuery(query);
		if (query.length < 2) {
			setSearchResults([]);
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch(`/api/user/search?q=${query}`);
			const data = await res.json();
			if (data.success) {
				setSearchResults(data.data);
			}
		} catch (error) {
			console.error("Search failed", error);
		} finally {
			setIsLoading(false);
		}
	};

	const addMember = async (user: any) => {
		if (selectedMembers.find(m => m.id === user.id)) return;
		if (selectedMembers.length + 1 >= project.teamSizeMax) return;

		playSFX("button");
		setSelectedMembers([...selectedMembers, user]);
		setSearchQuery("");
		setSearchResults([]);

		// Check for previous pairing warning
		try {
			const res = await fetch(`/api/teams/check-pairing?userId1=${session?.user?.id}&userId2=${user.id}&rank=${project.rank}`);
			const data = await res.json();
			if (data.success && data.data.hasWorkedTogether) {
				setWarnings(prev => ({
					...prev,
					[user.id]: `You've worked with ${user.login} before at this rank`
				}));
			}
		} catch (error) {
			console.error("Pairing check failed", error);
		}
	};

	const removeMember = (userId: string) => {
		playSFX("button");
		setSelectedMembers(selectedMembers.filter(m => m.id !== userId));
		setWarnings(prev => {
			const next = { ...prev };
			delete next[userId];
			return next;
		});
	};

	const handleOptionB = async () => {
		playSFX("button");
		setIsLoading(true);
		try {
			const res = await fetch("/api/teams", {
				method: "POST",
				body: JSON.stringify({
					projectId: project.id,
					status: "FORMING",
				}),
			});
			if (res.ok) {
				onOptionB();
			}
		} catch (error) {
			console.error("Option B failed", error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!mode) {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card 
					onClick={() => { playSFX("button"); setMode("A"); }}
					className="group flex flex-col items-center gap-4 p-6 text-center bg-panel-2 border-border border-2 hover:border-accent transition-all cursor-pointer"
				>
					<div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
						👥
					</div>
					<div>
						<h3 className="text-lg font-black uppercase tracking-tighter text-text-primary">I have a team</h3>
						<p className="text-[10px] text-text-muted font-bold mt-1">Form a squad and launch immediately</p>
					</div>
				</Card>

				<Card 
					onClick={handleOptionB}
					className="group flex flex-col items-center gap-4 p-6 text-center bg-panel-2 border-border border-2 hover:border-emerald-500/50 transition-all cursor-pointer"
				>
					<div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
						🔍
					</div>
					<div>
						<h3 className="text-lg font-black uppercase tracking-tighter text-text-primary">Find teammates</h3>
						<p className="text-[10px] text-text-muted font-bold mt-1">Post a listing and meet other makers</p>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h3 className="text-xs font-black uppercase tracking-[0.2em] text-accent">Assemble Squad</h3>
					<span className="text-[10px] font-bold text-text-muted uppercase">
						{selectedMembers.length + 1} / {project.teamSizeMax} Members
					</span>
				</div>

				{/* Search Input */}
				<div className="relative">
					<input 
						type="text"
						value={searchQuery}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Search by login..."
						className="w-full h-12 bg-panel-2 border border-border rounded-xl px-5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors font-bold"
					/>
					{isLoading && (
						<div className="absolute right-4 top-1/2 -translate-y-1/2">
							<div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
						</div>
					)}

					{/* Search Results */}
					{searchResults.length > 0 && (
						<Card className="absolute top-full left-0 right-0 z-10 mt-2 p-2 bg-panel-2 border-border shadow-2xl space-y-1">
							{searchResults.map((user) => (
								<div 
									key={user.id}
									onClick={() => addMember(user)}
									className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${user.isAvailable ? "hover:bg-accent/10" : "opacity-50 cursor-not-allowed bg-red-500/5"}`}
								>
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 rounded-full bg-panel-2 overflow-hidden border border-border">
											<Image 
												src={user.image || `https://cdn.intra.42.fr/users/medium_${user.login}.jpg`}
												alt={user.login}
												width={32} height={32}
											/>
										</div>
										<div>
											<p className="text-sm font-black text-text-primary">{user.login}</p>
											<p className="text-[10px] uppercase font-bold text-text-muted">Rank {user.currentRank}</p>
										</div>
									</div>
									<div className="text-right">
										{user.isAvailable ? (
											<span className="text-[10px] font-black uppercase tracking-widest text-accent">Add +</span>
										) : (
											<span className="text-[10px] font-black uppercase tracking-widest text-red-400">Busy: {user.activeProject}</span>
										)}
									</div>
								</div>
							))}
						</Card>
					)}
				</div>

				{/* Selection chips */}
				<div className="flex flex-wrap gap-3">
					{/* Current User (Always included) */}
					<div className="flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-full pl-1 pr-4 py-1">
						<div className="h-6 w-6 rounded-full overflow-hidden border border-accent/20">
							<Image 
								src={session?.user?.image || ""}
								alt="Me"
								width={24} height={24}
							/>
						</div>
						<span className="text-xs font-black text-text-primary">{session?.user?.login}</span>
						<span className="text-[8px] font-black uppercase tracking-widest text-accent bg-accent/20 px-2 py-0.5 rounded-full">Leader</span>
					</div>

					{selectedMembers.map((member) => (
						<div key={member.id} className="relative group">
							<div className="flex items-center gap-2 bg-panel-2 border border-border rounded-full pl-1 pr-2 py-1 transition-all hover:pr-8">
								<div className="h-6 w-6 rounded-full overflow-hidden border border-border">
									<Image 
										src={member.image || `https://cdn.intra.42.fr/users/medium_${member.login}.jpg`}
										alt={member.login}
										width={24} height={24}
									/>
								</div>
								<span className="text-xs font-black text-text-primary">{member.login}</span>
								<button 
									onClick={() => removeMember(member.id)}
									className="absolute right-2 opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-full bg-panel text-[10px] transition-opacity"
								>
									✕
								</button>
							</div>
							
							{warnings[member.id] && (
								<div className="absolute top-full left-0 mt-2 z-20 w-48 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/50 text-[8px] font-bold text-yellow-200 uppercase tracking-tighter shadow-xl">
									⚠️ {warnings[member.id]}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

		</div>
	);
}
