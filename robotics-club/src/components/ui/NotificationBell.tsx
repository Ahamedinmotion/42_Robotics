"use client";

import { useState, useEffect, useRef } from "react";

interface Notification {
	id: string;
	title: string;
	body: string | null;
	createdAt: string;
	readAt: string | null;
	actionUrl: string | null;
}

export function NotificationBell() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const fetchNotifications = async () => {
		try {
			const res = await fetch("/api/notifications");
			if (!res.ok) return;
			const json = await res.json();
			if (json.success) {
				setNotifications(json.data.notifications.slice(0, 5));
				setUnreadCount(json.data.unreadCount);
			}
		} catch {
			// Silently fail
		}
	};

	useEffect(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 60_000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const markAsRead = async (id: string) => {
		try {
			await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch {
			// Silently fail
		}
	};

	const timeAgo = (dateStr: string) => {
		const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
		if (seconds < 60) return "just now";
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative text-text-primary transition-colors hover:text-accent"
			>
				{/* Bell SVG */}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="h-6 w-6"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
					/>
				</svg>
				{unreadCount > 0 && (
					<span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-urgency px-1 text-[10px] font-bold text-white">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border-color bg-panel shadow-lg">
					<div className="border-b border-border-color px-4 py-3">
						<h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
					</div>
					{notifications.length === 0 ? (
						<div className="px-4 py-6 text-center text-sm text-text-muted">
							No notifications yet
						</div>
					) : (
						<ul>
							{notifications.map((n) => (
								<li
									key={n.id}
									onClick={() => {
										if (!n.readAt) markAsRead(n.id);
									}}
									className={`cursor-pointer border-b border-border-color px-4 py-3 transition-colors last:border-0 hover:bg-panel2 ${!n.readAt ? "bg-panel2/50" : ""
										}`}
								>
									<div className="flex items-start justify-between gap-2">
										<p className="text-sm font-medium text-text-primary">{n.title}</p>
										<span className="shrink-0 text-[10px] text-text-muted">
											{timeAgo(n.createdAt)}
										</span>
									</div>
									{n.body && (
										<p className="mt-0.5 text-xs text-text-muted">
											{n.body.length > 80 ? n.body.slice(0, 80) + "…" : n.body}
										</p>
									)}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
