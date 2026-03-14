"use client";

import { useState } from "react";
import { CockpitHeader } from "./CockpitHeader";
import { CockpitOverview } from "./CockpitOverview";
import { CockpitReports } from "./CockpitReports";
import { CockpitMaterials } from "./CockpitMaterials";
import { CockpitDanger } from "./CockpitDanger";
import { CockpitSubmission } from "./CockpitSubmission";
import { PostMortemForm } from "./PostMortemForm";

interface CockpitShellProps {
	team: any;
	currentUser: any;
	isAdmin: boolean;
	hasSubmittedPostMortem: boolean;
}

export function CockpitShell({ team, currentUser, isAdmin, hasSubmittedPostMortem }: CockpitShellProps) {
	const [activeTab, setActiveTab] = useState("overview");

	const isCompleted = team.status === "COMPLETED";

	const tabs = [
		{ id: "overview", label: "Overview", icon: "🛰️" },
		{ id: "reports", label: "Reports", icon: "📊" },
		{ id: "materials", label: "Materials", icon: "🛠️" },
		{ id: "danger", label: "Danger Zone", icon: "⚠️" },
		{ id: "submission", label: "Submission", icon: "🚀" },
	];

	if (isCompleted) {
		tabs.push({ id: "post-mortem", label: "Post-Mortem", icon: "📝" });
	}

	return (
		<div className="flex flex-col h-screen overflow-hidden">
			{/* Persistent Header */}
			<CockpitHeader team={team} currentUser={currentUser} isAdmin={isAdmin} />

			{/* Tab Navigation */}
			<div className="sticky top-0 z-10 bg-background border-b border-white/5 px-4">
				<div className="container mx-auto max-w-6xl">
					<div className="flex gap-8">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
									activeTab === tab.id
										? "border-accent text-accent"
										: "border-transparent text-text-muted hover:text-text-primary"
								}`}
							>
								<span>{tab.icon}</span>
								{tab.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Content Area */}
			<div className="flex-1 overflow-y-auto custom-scrollbar">
				<div className="container mx-auto max-w-6xl py-12 px-4 pb-32">
					{activeTab === "overview" && <CockpitOverview team={team} isAdmin={isAdmin} />}
					{activeTab === "reports" && <CockpitReports team={team} isAdmin={isAdmin} />}
					{activeTab === "materials" && <CockpitMaterials team={team} isAdmin={isAdmin} />}
					{activeTab === "danger" && <CockpitDanger team={team} isAdmin={isAdmin} currentUser={currentUser} />}
					{activeTab === "submission" && <CockpitSubmission team={team} isAdmin={isAdmin} />}
					{activeTab === "post-mortem" && (
						hasSubmittedPostMortem ? (
							<div className="max-w-2xl mx-auto text-center space-y-8 py-20">
								<div className="text-4xl">✅</div>
								<h3 className="text-2xl font-black">Reflection Archived</h3>
								<p className="text-text-muted">You have already submitted your post-mortem for this project. Your insights are locked in the archives.</p>
							</div>
						) : (
							<PostMortemForm team={team} onSuccess={() => window.location.reload()} />
						)
					)}
				</div>
			</div>
		</div>
	);
}
