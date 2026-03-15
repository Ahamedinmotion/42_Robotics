import { useEffect, useState } from "react";
import { ThemeEngine } from "@/lib/theme-engine";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/Toast";

export function useCheatCodes() {
	const [buffer, setBuffer] = useState("");
	const { data: session } = useSession();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
				return;
			}

			const key = e.key.length === 1 ? e.key.toLowerCase() : "";
			if (!key) return;

			setBuffer((prev) => {
				const newBuffer = (prev + key).slice(-30);
				
				// Detect theme codes
				const themeId = ThemeEngine.detectCheatCode(newBuffer);
				if (themeId && session?.user) {
					if (themeId === "idkfa") {
						window.dispatchEvent(new CustomEvent("rc-idkfa"));
					} else if (themeId === "xyzzy") {
						window.dispatchEvent(new CustomEvent("rc-xyzzy"));
					} else if (themeId === "rosebud") {
						window.dispatchEvent(new CustomEvent("rc-rosebud"));
					} else if (themeId === "noclip") {
						window.dispatchEvent(new CustomEvent("rc-noclip"));
					} else if (themeId === "devconsole") {
						window.dispatchEvent(new CustomEvent("rc-devconsole"));
					} else if (themeId === "help") {
						window.dispatchEvent(new CustomEvent("rc-help"));
					} else {
						// Regular theme unlock/activate
						ThemeEngine.unlockTheme((session.user as any).id, themeId);
						ThemeEngine.activateTheme(themeId);
					}
					return ""; // Clear buffer on match
				}
				
				// Konami Code
				if (newBuffer.endsWith("arrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightarrowba")) {
					ThemeEngine.activateTheme("8bit"); // Assuming 8-bit exists or will be added
					toast("🎮 Konami Code! Old school mode activated.", "success");
					return "";
				}

				return newBuffer;
			});
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [session]);
}
