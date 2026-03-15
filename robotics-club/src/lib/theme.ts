"use client";

export function applyTheme(theme: string) {
	const body = document.body;
	// Remove all theme classes first
	const themeClasses = Array.from(body.classList).filter((c) => c.startsWith("theme-"));
	themeClasses.forEach((c) => body.classList.remove(c));

	if (theme && theme !== "FORGE") {
		body.classList.add(`theme-${theme.toLowerCase()}`);
	}
	localStorage.setItem("rc-theme", theme);
}

export function initTheme(userPreference: string | null) {
	// Add smooth transition for theme switches
	document.body.style.transition = "background-color 2s, color 2s, filter 1s";

	if (userPreference) {
		applyTheme(userPreference);
		return;
	}

	const saved = localStorage.getItem("rc-theme");
	if (saved) {
		applyTheme(saved);
		return;
	}

	const hour = new Date().getHours();
	if (hour >= 19 || hour < 7) {
		applyTheme("FORGE");
	} else {
		applyTheme("FIELD");
	}
}
