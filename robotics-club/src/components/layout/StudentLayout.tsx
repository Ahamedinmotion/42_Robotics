import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { StudentNav } from "@/components/layout/StudentNav";

interface StudentLayoutProps {
	children: React.ReactNode;
	user: {
		login: string;
		image: string | null;
		activeTheme: "FORGE" | "FIELD";
	};
}

export function StudentLayout({ children, user }: StudentLayoutProps) {
	return (
		<>
			<ThemeInitializer theme={user.activeTheme} />

			{/* Top navigation bar */}
			<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-color bg-background/90 px-4 backdrop-blur-sm">
				{/* Left: Logo */}
				<Link href="/home" className="text-xl font-bold text-accent">
					RC
				</Link>

				{/* Center: Nav links (client component for active state) */}
				<StudentNav />

				{/* Right: Bell + Avatar + Login */}
				<div className="flex items-center gap-4">
					<NotificationBell />
					<div className="flex items-center gap-2">
						{user.image ? (
							<Image
								src={user.image}
								alt={user.login}
								width={32}
								height={32}
								className="h-8 w-8 rounded-full border border-border-color object-cover"
							/>
						) : (
							<div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-color bg-panel2 text-xs font-bold text-text-muted">
								{user.login.charAt(0).toUpperCase()}
							</div>
						)}
						<span className="hidden text-sm text-text-muted sm:inline">
							{user.login}
						</span>
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

			{/* Theme toggle */}
			<ThemeToggle />
		</>
	);
}

