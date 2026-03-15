"use client";

import { useState, useEffect } from "react";
import { applyTheme } from "@/lib/theme";

export function ThemeToggle({ variant = "fixed" }: { variant?: "fixed" | "minimal" }) {
	const [current, setCurrent] = useState<"FORGE" | "FIELD">("FORGE");

	useEffect(() => {
		const saved = localStorage.getItem("rc-theme") as "FORGE" | "FIELD" | null;
		if (saved) setCurrent(saved);
		else {
			const hour = new Date().getHours();
			setCurrent(hour >= 19 || hour < 7 ? "FORGE" : "FIELD");
		}
	}, []);

	const toggle = async () => {
		const next = current === "FORGE" ? "FIELD" : "FORGE";
		setCurrent(next);
		applyTheme(next);
		localStorage.setItem("rc-theme-override", "true");

		try {
			await fetch("/api/user/theme", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ theme: next }),
			});
		} catch {
			// Silently fail
		}
	};

	if (variant === "minimal") {
		return (
			<button
				onClick={toggle}
				className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-panel2 hover:text-accent"
				title={`Switch to ${current === "FORGE" ? "FIELD" : "FORGE"}`}
			>
				<span
					className="inline-block h-2 w-2 rounded-full"
					style={{ backgroundColor: current === "FORGE" ? "#FF6B00" : "#8B9A46" }}
				/>
				{current}
			</button>
		);
	}

	return (
		<button
			onClick={toggle}
			className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border-color bg-panel px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-accent"
		>
			<span
				className="inline-block h-3 w-3 rounded-full"
				style={{
					backgroundColor: current === "FORGE" ? "#FF6B00" : "#8B9A46",
				}}
			/>
			{current}
		</button>
	);
}
