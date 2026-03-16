"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function RegistrationLaunchStep({ 
	project, 
	selectedMembers
}: { project: any; selectedMembers: any[]; }) {
	const [isLaunching, setIsLaunching] = useState(false);
	const { toast } = useToast();
	const router = useRouter();

	const deadline = new Date();
	deadline.setDate(deadline.getDate() + project.blackholeDays);
	const deadlineStr = deadline.toLocaleDateString("en-US", { 
		month: "short", 
		day: "numeric", 
		year: "numeric" 
	});

	// Note: Actual launch is now handled by RegistrationModal for better UX
	return (
		<div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
			<Card className="bg-panel-2 border-border p-5 border-2 shadow-inner">
				<div className="flex flex-col items-center gap-4">
					<div className="flex flex-col items-center gap-1">
						<Badge rank={project.rank || "E"} size="lg" />
						<h3 className="text-xl font-black uppercase tracking-tighter text-text-primary">{project.title}</h3>
					</div>

					<div className="w-full space-y-3">
						<div className="flex justify-between items-center border-b border-white/5 pb-1">
							<span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Squad Strength</span>
							<span className="text-sm font-black text-text-primary">{selectedMembers.length + 1} Makers</span>
						</div>
						
						<div className="flex -space-x-2 justify-center py-1">
							{selectedMembers.map((m) => (
								<div key={m.id} className="h-10 w-10 rounded-full border-4 border-panel overflow-hidden bg-panel-2 shadow-lg">
									<Image 
										src={m.image || `https://cdn.intra.42.fr/users/medium_${m.login}.jpg`}
										alt={m.login}
										width={40} height={40}
									/>
								</div>
							))}
						</div>

						<div className="flex justify-between items-center border-b border-white/5 pb-1">
							<span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Blackhole Target</span>
							<span className="text-sm font-black text-accent-urgency">{deadlineStr}</span>
						</div>

						<div className="flex justify-between items-center border-b border-white/5 pb-1">
							<span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Reporting Duty</span>
							<span className="text-sm font-black text-emerald-400">Weekly</span>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
