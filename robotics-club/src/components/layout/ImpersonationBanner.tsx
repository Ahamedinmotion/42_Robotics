"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function ImpersonationBanner({ isImpersonating, login }: { isImpersonating: boolean; login: string }) {
	const router = useRouter();
	const { toast } = useToast();
	const [returning, setReturning] = useState(false);

	if (!isImpersonating) return null;

	const handleReturn = async () => {
		setReturning(true);
		try {
			const res = await fetch("/api/admin/impersonate", {
				method: "DELETE",
			});
			if (res.ok) {
				toast("Restoring your original session...");
				window.location.reload();
			} else {
				toast("Failed to end impersonation", "error");
				setReturning(false);
			}
		} catch {
			toast("Network error", "error");
			setReturning(false);
		}
	};

	return (
		<div className="flex h-10 w-full items-center justify-center gap-4 bg-accent-urgency/10 px-4 text-sm font-medium text-accent-urgency border-b border-accent-urgency/20 z-50 relative">
			<span className="animate-pulse">⚠️ You are currently impersonating @{login}</span>
			<button
				onClick={handleReturn}
				disabled={returning}
				className="rounded bg-accent-urgency px-3 py-1 text-xs font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90 disabled:opacity-50"
			>
				{returning ? "Returning..." : "Return to Self"}
			</button>
		</div>
	);
}
