"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";
import { AvailableMissions } from "./AvailableMissions";
import { UpcomingMissions } from "./UpcomingMissions";
import { EvaluationHistory } from "./EvaluationHistory";

export default function EvaluationsPage() {
	const [activeTab, setActiveTab] = useState<"available" | "upcoming" | "history">("available");
	const { playSFX } = useSound();

	const handleTabChange = (tab: "available" | "upcoming" | "history") => {
		setActiveTab(tab);
		playSFX("button");
	};

	return (
		<div className="mx-auto max-w-6xl space-y-8 p-6">
			{/* Header */}
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight text-text-primary">Evaluation Hub</h1>
				<p className="text-text-muted">Broadcast your expertise or track your upcoming peer evaluations.</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 rounded-xl bg-panel p-1 border border-border/50">
				{(["available", "upcoming", "history"] as const).map((tab) => (
					<button
						key={tab}
						onClick={() => handleTabChange(tab)}
						className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
							activeTab === tab
								? "bg-accent text-white shadow-lg shadow-accent/20"
								: "text-text-muted hover:bg-white/5 hover:text-text-primary"
						}`}
					>
						{tab.toUpperCase()}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="min-h-[400px]">
				{activeTab === "available" && <AvailableMissions />}
				{activeTab === "upcoming" && <UpcomingMissions />}
				{activeTab === "history" && <EvaluationHistory />}
			</div>
		</div>
	);
}
