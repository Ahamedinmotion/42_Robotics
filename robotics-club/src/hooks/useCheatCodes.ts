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

			const key = e.key;
			if (key.length > 1 && !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) return;

			setBuffer((prev) => {
				const char = key.length === 1 ? key.toLowerCase() : key;
				const newBuffer = (prev + char).slice(-100);

				
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
						// Unified theme unlock/activate to avoid race conditions
						ThemeEngine.activateTheme(themeId, undefined, (session.user as any).id);
					}
					return ""; // Clear buffer on match

				}
				
				// Konami Code (Retro)
				const konami = "ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRight";
				if (newBuffer.endsWith(konami) || newBuffer.endsWith(konami.toLowerCase()) || newBuffer.endsWith(konami + "ba")) {
					window.dispatchEvent(new CustomEvent("rc-retro"));
					toast("🎮 Konami Code! Retro mode activated.", "success");
					return "";
				}



				return newBuffer;
			});
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [session]);
}
