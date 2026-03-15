"use client";

import { useState } from "react";

interface Notification {
	id: string;
	type: string;
	title: string;
	body: string | null;
	createdAt: string;
	readAt: string | null;
}

const typeDotColour: Record<string, string> = {
	EVAL_SLOT_AVAILABLE: "var(--accent)",
	BLACKHOLE_WARNING: "var(--accent-urgency)",
	PRINT_APPROVED: "#44FF88",
};

function timeAgo(dateStr: string) {
	const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
	const [notifications, setNotifications] = useState(initial);

	const markAsRead = async (id: string, e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		try {
			await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
			);
		} catch {
			// Silently fail
		}
	};

	const dismissNotification = async (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			// Optimistic UI
			setNotifications((prev) => prev.filter((n) => n.id !== id));
			
			await fetch(`/api/notifications/${id}`, { method: "DELETE" });
			
			// Dispatch event for EasterEggManager
			window.dispatchEvent(new CustomEvent("rc-notification-dismissed", { detail: { id } }));
		} catch {
			// Silently fail
		}
	};

	if (notifications.length === 0) {
		return <p className="text-sm italic text-text-muted">You're all caught up.</p>;
	}

	return (
		<ul className="space-y-3">
			{notifications.map((n) => (
				<li
					key={n.id}
					onClick={() => !n.readAt && markAsRead(n.id)}
					className={`group relative flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-panel2 ${!n.readAt ? "bg-panel2/40" : "opacity-60"
						}`}
				>
					<button 
						onClick={(e) => dismissNotification(n.id, e)}
						className="absolute right-1 top-1 p-1 opacity-0 group-hover:opacity-100 hover:text-accent transition-opacity rounded-full hover:bg-black/10"
					>
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
					<span
						className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
						style={{
							backgroundColor: typeDotColour[n.type] || "var(--text-muted)",
						}}
					/>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-bold text-text-primary">{n.title}</p>
						{n.body && (
							<p className="truncate text-xs text-text-muted">{n.body}</p>
						)}
						<p className="mt-0.5 text-xs text-text-muted">{timeAgo(n.createdAt)}</p>
					</div>
				</li>
			))}
		</ul>
	);
}
