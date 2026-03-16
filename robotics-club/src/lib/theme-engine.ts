import { THEMES, getThemeById } from "./themes";
import { toast } from "@/components/ui/Toast";

export class ThemeEngine {
	private static activeTimer: NodeJS.Timeout | null = null;

	static async unlockTheme(userId: string, themeId: string) {
		const theme = getThemeById(themeId);
		if (!theme) return;

		try {
			const res = await fetch("/api/user/theme", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ unlockTheme: themeId }),
			});

			if (res.ok) {
				const data = await res.json();
				if (data.newlyUnlocked) {
					toast(`🎨 Theme Unlocked: ${theme.name}`, "success");
					
					// If it's a toggle theme, maybe we want to activate it immediately?
					// For now, just unlock it.
				}
			}
		} catch (error) {
			console.error("Failed to unlock theme:", error);
		}
	}

	static activateTheme(themeId: string, duration?: number | "permanent" | "toggle", unlockForUserId?: string) {
		const theme = getThemeById(themeId);
		const effectiveDuration = duration || (theme?.duration);

		// Cleanup existing timers
		if (this.activeTimer) {
			clearTimeout(this.activeTimer);
			this.activeTimer = null;
		}

		// Apply CSS class
		const body = document.body;
		// Remove existing theme classes
		const themeClasses = Array.from(body.classList).filter((c) => c.startsWith("theme-"));
		themeClasses.forEach((c) => body.classList.remove(c));

		if (themeId !== "FORGE") {
			body.classList.add(`theme-${themeId.toLowerCase()}`);
		}

		// Handle persistence if toggle
		if (effectiveDuration === "toggle" || effectiveDuration === "permanent") {
			localStorage.setItem("rc-theme", themeId);
			
			// Prepare payload for single sync to DB
			const payload: any = { theme: themeId };
			if (unlockForUserId) {
				payload.unlockTheme = themeId;
			}

			// Sync to DB
			fetch("/api/user/theme", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			}).then(async res => {
				if (res.ok && unlockForUserId) {
					const data = await res.json();
					if (data.newlyUnlocked && theme) {
						toast(`🎨 Theme Unlocked & Activated: ${theme.name}`, "success");
					}
				}
			});
		}


		// Handle timed themes
		if (typeof effectiveDuration === "number") {
			this.activeTimer = setTimeout(() => {
				this.deactivateTheme();
			}, effectiveDuration * 1000);
		}
	}

	static deactivateTheme() {
		if (this.activeTimer) {
			clearTimeout(this.activeTimer);
			this.activeTimer = null;
		}

		const body = document.body;
		const themeClasses = Array.from(body.classList).filter((c) => c.startsWith("theme-"));
		themeClasses.forEach((c) => body.classList.remove(c));

		// Fallback to last saved theme or FORGE
		const saved = localStorage.getItem("rc-theme") || "FORGE";
		if (saved !== "FORGE") {
			body.classList.add(`theme-${saved.toLowerCase()}`);
		}
	}

	static detectCheatCode(sequence: string): string | null {
		const lowerSeq = sequence.toLowerCase();
		for (const theme of THEMES) {
			if (theme.triggerType === "type" && lowerSeq.endsWith(theme.triggerValue.toLowerCase())) {
				return theme.id;
			}
		}
		
		// Special cases
		if (lowerSeq.endsWith("idkfa")) return "idkfa";
		if (lowerSeq.endsWith("noclip")) return "noclip";
		if (lowerSeq.endsWith("xyzzy")) return "xyzzy";
		if (lowerSeq.endsWith("rosebud")) return "rosebud";
		if (lowerSeq.endsWith("devconsole")) return "devconsole";
		if (lowerSeq.endsWith("help")) return "help";

		return null;
	}
}
