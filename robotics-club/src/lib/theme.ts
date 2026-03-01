"use client";

export function applyTheme(theme: "FORGE" | "FIELD") {
	if (theme === "FIELD") {
		document.body.classList.add("theme-field");
	} else {
		document.body.classList.remove("theme-field");
	}
	localStorage.setItem("rc-theme", theme);
}

export function initTheme(userPreference: "FORGE" | "FIELD" | null) {
	// Add smooth transition for theme switches
	document.body.style.transition = "background-color 2s, color 2s";

	if (userPreference) {
		applyTheme(userPreference);
		return;
	}

	const saved = localStorage.getItem("rc-theme") as "FORGE" | "FIELD" | null;
	if (saved) {
		applyTheme(saved);
		return;
	}

	const hour = new Date().getHours();
	if (hour >= 19 || hour < 7) {
		applyTheme("FORGE");
	} else {
		const lastUsed = localStorage.getItem("rc-theme");
		if (lastUsed === "FIELD") {
			applyTheme("FIELD");
		} else {
			applyTheme("FORGE");
		}
	}
}
