"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface Compliment {
	id: string;
	message: string;
	createdAt: string;
}

export function ComplimentWall() {
	const [compliments, setCompliments] = useState<Compliment[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchCompliments() {
			try {
				const res = await fetch("/api/compliments");
				if (res.ok) {
					setCompliments(await res.json());
				}
			} finally {
				setLoading(false);
			}
		}
		fetchCompliments();
	}, []);

	if (loading) return <div className="text-sm text-text-muted">Loading compliments...</div>;
	if (compliments.length === 0) return null;

	return (
		<Card className="space-y-3">
			<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
				Compliment Wall
			</h3>
			<p className="text-xs text-text-muted">Anonymous feedback from teammates and evaluators</p>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{compliments.map((c) => (
					<div
						key={c.id}
						className="relative rounded-lg border border-border-color bg-panel2 p-3 text-sm italic text-text-primary shadow-sm"
					>
						<span className="absolute -left-1 -top-1 text-lg">✨</span>
						"{c.message}"
						<div className="mt-2 text-right text-[10px] text-text-muted">
							{new Date(c.createdAt).toLocaleDateString()}
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
