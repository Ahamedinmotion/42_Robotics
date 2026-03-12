"use client";

import { useState, useEffect as effect } from "react";

interface ActiveAnnouncement {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	expiresAt: string;
}

export function AnnouncementBanners() {
	const [items, setItems] = useState<ActiveAnnouncement[]>([]);
	const [dismissing, setDismissing] = useState<string | null>(null);

	effect(() => {
		fetch("/api/announcements/active")
			.then((r) => r.json())
			.then((j) => {
				if (j.data) setItems(j.data);
			})
			.catch(() => {});
	}, []);

	const dismiss = async (id: string) => {
		setDismissing(id);
		try {
			await fetch("/api/announcements/dismiss", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ announcementId: id }),
			});
			setItems((prev) => prev.filter((a) => a.id !== id));
		} catch { /* silent */ }
		setDismissing(null);
	};

	if (items.length === 0) return null;

	return (
		<div className="space-y-2">
			{items.map((a) => (
				<div
					key={a.id}
					className="flex items-start justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 backdrop-blur-sm animate-in slide-in-from-top-2"
				>
					<div className="min-w-0">
						<p className="text-sm font-bold text-accent">{a.title}</p>
						<p className="mt-0.5 text-xs text-text-muted">{a.body}</p>
					</div>
					<button
						onClick={() => dismiss(a.id)}
						disabled={dismissing === a.id}
						className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-panel2 hover:text-text-primary disabled:opacity-50"
						aria-label="Dismiss announcement"
					>
						✕
					</button>
				</div>
			))}
		</div>
	);
}
