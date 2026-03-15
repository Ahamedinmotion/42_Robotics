"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { SoundProvider } from "./SoundProvider";
import { DatabaseKeepAlive } from "../utils/DatabaseKeepAlive";
import { useCheatCodes } from "@/hooks/useCheatCodes";
import { MatrixRain } from "../layout/MatrixRain";
import { useState, useEffect } from "react";
import { THEMES } from "@/lib/themes";
import { ThemeEngine } from "@/lib/theme-engine";
import { useSession } from "next-auth/react";

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
	return (
		<SessionProvider session={session}>
			<ToastProvider>
				<SoundProvider>
					<CheatCodeWrapper>
						{children}
						<DatabaseKeepAlive />
					</CheatCodeWrapper>
				</SoundProvider>
			</ToastProvider>
		</SessionProvider>
	);
}

function CheatCodeWrapper({ children }: { children: React.ReactNode }) {
	const [isMatrix, setIsMatrix] = useState(false);
	const { data: session } = useSession();
	useCheatCodes();

	useEffect(() => {
		if (session?.user && (session.user as any).currentRank === "S") {
			const unlocked = (session.user as any).unlockedThemes || [];
			if (!unlocked.includes("gold")) {
				ThemeEngine.unlockTheme((session.user as any).id, "gold");
			}
		}
	}, [session]);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsMatrix(document.body.classList.contains("theme-matrix"));
		});

		observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	return (
		<>
			{isMatrix && <MatrixRain />}
			{children}
		</>
	);
}
