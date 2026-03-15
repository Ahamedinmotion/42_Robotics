"use client";

import { useEffect } from "react";
import { initTheme } from "@/lib/theme";

interface ThemeInitializerProps {
	theme: string;
}

export function ThemeInitializer({ theme }: ThemeInitializerProps) {
	useEffect(() => {
		initTheme(theme);
	}, [theme]);

	return null;
}
