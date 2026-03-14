"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSound } from "@/components/providers/SoundProvider";
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
	const { playSFX } = useSound();

	// Reset state when opening/closing
	useEffect(() => {
		if (isOpen) {
			setStep(1);
			setSelectedMembers([]);
			setIsOptionB(false);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const nextStep = () => {
		playSFX("button");
		setStep((s) => s + 1);
	};
	
	const prevStep = () => {
		playSFX("button");
		setStep((s) => s - 1);
	};

	return (
		<div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-12">
			{/* Backdrop */}
			<div 
				className="absolute inset-0 bg-background/95 backdrop-blur-2xl animate-in fade-in duration-500" 
				onClick={onClose} 
			/>

			<Card className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border-border bg-panel p-0 shadow-2xl animate-in fade-in zoom-in duration-300">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-white/5 p-6 pb-4">
					<div>
						<h2 className="text-xl font-black uppercase tracking-tighter text-text-primary">Project Registration</h2>
						<p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{project.title} • Step {step} of {isOptionB ? 1 : 3}</p>
					</div>
					<button 
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-2 text-lg font-bold text-text-primary transition-colors hover:bg-panel hover:text-accent"
					>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="max-h-[70vh] overflow-y-auto p-6 custom-scrollbar">
					{step === 1 && (
						<RegistrationTeamStep 
							project={project}
							selectedMembers={selectedMembers}
							setSelectedMembers={setSelectedMembers}
							onNext={nextStep}
							onOptionB={() => { setIsOptionB(true); onClose(); }} // Handle Option B closing immediately
						/>
					)}

					{step === 2 && !isOptionB && (
						<RegistrationCommitStep 
							project={project}
							onNext={nextStep}
							onBack={prevStep}
						/>
					)}

					{step === 3 && !isOptionB && (
						<RegistrationLaunchStep 
							project={project}
							selectedMembers={selectedMembers}
							onBack={prevStep}
							onSuccess={onClose}
						/>
					)}
				</div>

				{/* Progress Indicator */}
				{!isOptionB && (
					<div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
						<div 
							className="h-full bg-accent transition-all duration-500"
							style={{ width: `${(step / 3) * 100}%` }}
						/>
					</div>
				)}
			</Card>
		</div>
	);
}
