"use client";

import { useState } from "react";
import { FeatureRequestList } from "@/components/feature-requests/FeatureRequestList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MaterialRequestList } from "./MaterialRequestList";
import { FabricationRequestList } from "./FabricationRequestList";

type RequestTab = "features" | "materials" | "fabrication" | "checkouts";

export function RequestsDashboard({ isAdmin = false }: { isAdmin?: boolean }) {
	const [activeTab, setActiveTab] = useState<RequestTab>("features");

	const tabs: { key: RequestTab; label: string; icon: string }[] = [
		{ key: "features", label: "Feature Requests", icon: "💡" },
		{ key: "materials", label: "Material Procurement", icon: "📦" },
		{ key: "fabrication", label: "3D Print & CNC", icon: "⚙️" },
		{ key: "checkouts", label: "Equipment Loans", icon: "🛠️" },
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-text-primary">Requests Dashboard</h1>
					<p className="text-sm text-text-muted">Manage all your club-related requests in one place</p>
				</div>
			</div>

			<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === tab.key
								? "bg-accent text-white shadow-lg shadow-accent/20"
								: "bg-panel2 text-text-muted hover:bg-panel hover:text-text-primary"
							}`}
					>
						<span>{tab.icon}</span>
						{tab.label}
					</button>
				))}
			</div>

			<div className="mt-4">
				{activeTab === "features" && <FeatureRequestList isAdmin={isAdmin} />}
				{activeTab === "materials" && <MaterialRequestList />}
				{activeTab === "fabrication" && <FabricationRequestList />}
				{activeTab === "checkouts" && <ComingSoon title="Equipment Loans" />}
			</div>
		</div>
	);
}

function ComingSoon({ title }: { title: string }) {
	return (
		<Card className="flex flex-col items-center justify-center py-20 text-center">
			<div className="mb-4 text-4xl opacity-20">🏗️</div>
			<h3 className="text-lg font-semibold text-text-primary">{title} Module</h3>
			<p className="max-w-xs text-sm text-text-muted">
				This module is being upgraded to support personal projects and categorization. Check back soon!
			</p>
		</Card>
	);
}
