"use client";

import { useState } from "react";

interface WorkshopRsvpButtonProps {
	workshopId: string;
	initialStatus: "GOING" | "NOT_GOING" | null;
}

export function WorkshopRsvpButton({ workshopId, initialStatus }: WorkshopRsvpButtonProps) {
	const [status, setStatus] = useState<"GOING" | "NOT_GOING" | null>(initialStatus);
	const [loading, setLoading] = useState(false);

	const toggle = async () => {
		setLoading(true);
		try {
			if (status === "GOING") {
				await fetch(`/api/workshops/${workshopId}/rsvp`, { method: "DELETE" });
				setStatus("NOT_GOING");
			} else {
				await fetch(`/api/workshops/${workshopId}/rsvp`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status: "GOING" }),
				});
				setStatus("GOING");
			}
		} catch {
			// Silently fail
		} finally {
			setLoading(false);
		}
	};

	return (
		<button
			onClick={toggle}
			disabled={loading}
			className="text-sm font-medium text-accent underline-offset-4 transition-colors hover:underline disabled:opacity-40"
		>
			{status === "GOING" ? "Attending ✓" : "RSVP"}
		</button>
	);
}
