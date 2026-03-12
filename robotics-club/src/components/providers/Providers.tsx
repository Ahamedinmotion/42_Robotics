"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { SoundProvider } from "./SoundProvider";

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
	return (
		<SessionProvider session={session}>
			<ToastProvider>
				<SoundProvider>
					{children}
				</SoundProvider>
			</ToastProvider>
		</SessionProvider>
	);
}
