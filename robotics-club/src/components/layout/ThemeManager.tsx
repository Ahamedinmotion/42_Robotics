"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/theme";

export function ThemeManager() {
	useEffect(() => {
		// Add smooth transition
		document.body.style.transition = "background-color 2s, color 2s";

		const updateTheme = () => {
			const hasOverride = localStorage.getItem("rc-theme-override") === "true";
			
			// If explicitly overridden locally, use the local storage preference
			if (hasOverride) {
				const saved = localStorage.getItem("rc-theme") as "FORGE" | "FIELD" | null;
				if (saved) {
					applyTheme(saved);
				}
				return;
			}

			// Otherwise, auto-switch based on local time
			const hour = new Date().getHours();
			if (hour >= 19 || hour < 7) {
				applyTheme("FORGE");
			} else {
				applyTheme("FIELD");
			}
		};

		// Run immediately
		updateTheme();

		// Check every minute if we need to auto-switch
		const interval = setInterval(updateTheme, 60000);
		return () => clearInterval(interval);
	}, []);

	return null;
}
