"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { SoundProvider } from "./SoundProvider";
import { DatabaseKeepAlive } from "../utils/DatabaseKeepAlive";

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
	return (
		<SessionProvider session={session}>
			<ToastProvider>
				<SoundProvider>
					{children}
					<DatabaseKeepAlive />
				</SoundProvider>
			</ToastProvider>
		</SessionProvider>
	);
}
