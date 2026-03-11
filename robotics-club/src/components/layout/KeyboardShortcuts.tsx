"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcutsProps {
	hasAdminAccess?: boolean;
}

export function KeyboardShortcuts({ hasAdminAccess = false }: KeyboardShortcutsProps) {
	const router = useRouter();
	const gPressedRef = useRef(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const hintRef = useRef<HTMLDivElement | null>(null);

	const showHint = useCallback((text: string) => {
		if (!hintRef.current) return;
		hintRef.current.textContent = text;
		hintRef.current.style.opacity = "1";
		hintRef.current.style.transform = "translateX(-50%) translateY(0)";
		setTimeout(() => {
			if (hintRef.current) {
				hintRef.current.style.opacity = "0";
				hintRef.current.style.transform = "translateX(-50%) translateY(8px)";
			}
		}, 1200);
	}, []);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// Don't trigger in inputs/textareas
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			if ((e.target as HTMLElement)?.isContentEditable) return;

			const key = e.key.toLowerCase();

			if (key === "g" && !gPressedRef.current) {
				gPressedRef.current = true;
				showHint("G → H/C/P/S" + (hasAdminAccess ? "/A" : ""));
				timeoutRef.current = setTimeout(() => {
					gPressedRef.current = false;
				}, 1500);
				return;
			}

			if (gPressedRef.current) {
				gPressedRef.current = false;
				if (timeoutRef.current) clearTimeout(timeoutRef.current);

				switch (key) {
					case "h":
						router.push("/home");
						showHint("→ Home");
						break;
					case "c":
						router.push("/cursus");
						showHint("→ Cursus");
						break;
					case "p":
						router.push("/profile");
						showHint("→ Profile");
						break;
					case "s":
						router.push("/showcase");
						showHint("→ Showcase");
						break;
					case "a":
						if (hasAdminAccess) {
							router.push("/admin");
							showHint("→ Admin");
						}
						break;
				}
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [router, hasAdminAccess, showHint]);

	return (
		<div
			ref={hintRef}
			className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border-color bg-panel px-4 py-2 text-xs font-medium text-text-muted shadow-lg backdrop-blur-sm"
			style={{
				opacity: 0,
				transform: "translateX(-50%) translateY(8px)",
				transition: "opacity 0.3s ease, transform 0.3s ease",
				pointerEvents: "none",
			}}
		/>
	);
}
