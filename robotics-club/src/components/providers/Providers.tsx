"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { SoundProvider } from "./SoundProvider";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ToastProvider>
			<SoundProvider>
				{children}
			</SoundProvider>
		</ToastProvider>
	);
}
