"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface AlumniToggleProps {
	isOptedIn: boolean;
}

export function AlumniToggle({ isOptedIn: initial }: AlumniToggleProps) {
	const [optedIn, setOptedIn] = useState(initial);
	const [loading, setLoading] = useState(false);

	const toggle = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/user/alumni-evaluator", { method: "PATCH" });
			if (res.ok) {
				const json = await res.json();
				setOptedIn(json.data.isActive);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-between">
			<div>
				<h3 className="text-sm font-bold text-text-primary">Alumni Evaluator</h3>
				<p className="text-xs text-text-muted">
					As an S rank alumni, you can opt in to evaluate active projects.
					You will be treated as S rank for all evaluation purposes.
				</p>
			</div>
			<Button
				variant={optedIn ? "secondary" : "primary"}
				size="sm"
				onClick={toggle}
				disabled={loading}
			>
				{optedIn ? "Opt out" : "Opt in to evaluate"}
			</Button>
		</div>
	);
}
