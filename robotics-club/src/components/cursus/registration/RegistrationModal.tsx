"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/components/providers/SoundProvider";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { RegistrationTeamStep } from "./RegistrationTeamStep";
import { RegistrationCommitStep } from "./RegistrationCommitStep";
import { RegistrationLaunchStep } from "./RegistrationLaunchStep";

interface RegistrationModalProps {
	project: any;
	isOpen: boolean;
	onClose: () => void;
}

export function RegistrationModal({ project, isOpen, onClose }: RegistrationModalProps) {
	const [step, setStep] = useState(1);
	const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
	const [isOptionB, setIsOptionB] = useState(false);
	const [commits, setCommits] = useState({ brief: false, blackhole: false, reports: false });
	const [isLaunching, setIsLaunching] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { playSFX } = useSound();
	const { toast } = useToast();
	const router = useRouter();

	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleMaximize = (e?: React.MouseEvent) => {
		if (e) {
			if (e.target !== e.currentTarget) return;
			e.stopPropagation();
		}
		playSFX("button");
		setIsMaximized(!isMaximized);
	};

	// Reset state when opening/closing
	useEffect(() => {
		if (isOpen) {
			setStep(1);
			setSelectedMembers([]);
			setIsOptionB(false);
			setCommits({ brief: false, blackhole: false, reports: false });
		}
	}, [isOpen]);

	// Auto-scroll to top on step change
	useEffect(() => {
		const main = document.getElementById("modal-scroll-area");
		if (main) main.scrollTop = 0;
	}, [step]);

	if (!isOpen || !mounted) return null;

	const nextStep = () => {
		playSFX("button");
		setStep((s) => s + 1);
	};
	
	const prevStep = () => {
		playSFX("button");
		setStep((s) => s - 1);
	};

	const handleLaunch = async () => {
		setIsLaunching(true);
		playSFX("button");
		try {
			const res = await fetch("/api/teams", {
				method: "POST",
				body: JSON.stringify({
					projectId: project.id,
					memberIds: selectedMembers.map(m => m.id),
					status: "ACTIVE",
				}),
			});
			const data = await res.json();

			if (data.success) {
				toast("Project Launched Successfully! 🚀", "success");
				onClose();
				router.push(`/cursus/projects/${project.id}/cockpit`);
			} else {
				toast(data.error || "Failed to launch project", "error");
			}
		} catch (error) {
			toast("An unexpected error occurred", "error");
		} finally {
			setIsLaunching(false);
		}
	};

	const modalContent = (
		<div className={`fixed inset-0 z-[9999] flex flex-col ${isMaximized ? "" : "items-center justify-center p-4 md:p-8"} bg-background/95 backdrop-blur-3xl animate-in fade-in duration-500`}>
			{/* Backdrop Overlay (Click to close) */}
			{!isMaximized && <div className="absolute inset-0 -z-10" onClick={onClose} />}
			
			{/* Modal Container */}
			<div 
				className={`relative flex flex-col overflow-hidden bg-panel shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] animate-in fade-in zoom-in-95 ${
					isMaximized 
						? "fixed inset-0 w-screen h-screen border-0 rounded-none z-[10000]" 
						: "h-full w-full md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-[2.5rem] md:border md:border-white/5"
				}`}
			>
				
				{/* Fixed Header */}
				<header className={`shrink-0 border-b border-white/5 p-4 md:p-8 ${isMaximized ? "bg-panel/50 backdrop-blur-md" : ""}`}>
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-accent leading-none">Registration</h2>
							<p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">
								{project.title} • STEP {step}/3
							</p>
						</div>
						<div className="flex gap-2">
							<button 
								onClick={onClose}
								className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-panel-2 text-lg md:text-xl font-bold text-text-primary transition-all hover:bg-white hover:text-background active:scale-95"
							>
								✕
							</button>
						</div>
					</div>
				</header>

				{/* Scrollable Content Area */}
				<main 
					id="modal-scroll-area" 
					className="min-h-0 flex-1 overflow-y-auto px-6 py-2 custom-scrollbar md:px-12 scroll-smooth cursor-default"
					onClick={toggleMaximize}
				>
					<div 
						className={`mx-auto pb-32 pointer-events-auto transition-all duration-500 ${
							isMaximized ? "max-w-none w-full px-4 md:px-8 py-8" : "max-w-xl"
						}`} 
						onClick={(e) => e.stopPropagation()}
					>
						{step === 1 && (
							<RegistrationTeamStep 
								project={project}
								selectedMembers={selectedMembers}
								setSelectedMembers={setSelectedMembers}
								onNext={nextStep}
								onOptionB={() => { setIsOptionB(true); onClose(); }}
							/>
						)}

						{step === 2 && !isOptionB && (
							<RegistrationCommitStep 
								project={project}
								commits={commits}
								setCommits={setCommits}
							/>
						)}

						{step === 3 && !isOptionB && (
							<RegistrationLaunchStep 
								project={project}
								selectedMembers={selectedMembers}
							/>
						)}
					</div>
				</main>

				{/* Fixed Footer */}
				{!isOptionB && (
					<footer className={`relative shrink-0 border-t border-white/5 bg-panel-2/30 p-4 md:p-6 backdrop-blur-md md:px-12 pb-safe ${isMaximized ? "bg-panel/50" : ""}`}>
						<div 
							className={`mx-auto flex gap-3 md:gap-4 transition-all duration-500 ${
								isMaximized ? "max-w-none w-full" : "max-w-xl"
							}`}
						>
							{step > 1 && (
								<Button 
									variant="ghost" 
									onClick={prevStep} 
									disabled={isLaunching} 
									className="h-12 md:h-14 flex-1 rounded-2xl border-white/10 font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-white hover:text-background"
								>
									Prev
								</Button>
							)}
							
							<div className="flex-[2] flex flex-col gap-2">
								{step === 1 && (
									<Button 
										variant="primary" 
										className="h-12 md:h-14 w-full rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl shadow-accent/10" 
										onClick={nextStep}
										disabled={selectedMembers.length + 1 < (project.teamSizeMin || 2)}
									>
										Continue
									</Button>
								)}
								{step === 2 && (
									<Button 
										variant="primary" 
										className="h-12 md:h-14 w-full rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl shadow-accent/10" 
										onClick={nextStep}
										disabled={!Object.values(commits).every(Boolean)}
									>
										Acknowledge & Confirm
									</Button>
								)}
								{step === 3 && (
									<Button 
										variant="primary" 
										className="h-12 md:h-14 w-full flex-1 rounded-2xl bg-accent font-black uppercase tracking-widest text-[10px] md:text-[11px] text-background hover:bg-white shadow-xl shadow-accent/20" 
										onClick={handleLaunch}
										disabled={isLaunching}
									>
										{isLaunching ? "INITIALIZING..." : "LAUNCH_PROJ.SH"}
									</Button>
								)}
							</div>
						</div>

						{/* Maximize Icon Bottom Right */}
						<button 
							onClick={() => toggleMaximize()}
							className="absolute bottom-4 right-4 hidden md:flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-accent hover:border-accent/40 transition-all opacity-40 hover:opacity-100"
							title={isMaximized ? "Minimize View" : "Maximize View"}
						>
							{isMaximized ? (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/></svg>
							) : (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
							)}
						</button>
					</footer>
				)}

				{/* Tactical Progress Line */}
				{!isOptionB && (
					<div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/5">
						<div 
							className="h-full bg-accent transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(255,107,0,0.5)]"
							style={{ width: `${(step / 3) * 100}%` }}
						/>
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}
