import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ThemeManager } from "@/components/layout/ThemeManager";
import { StudentNav } from "@/components/layout/StudentNav";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { TerminalProvider } from "@/components/ui/TerminalProvider";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { ClientLogo } from "@/components/layout/ClientLogo";

interface StudentLayoutProps {
	children: React.ReactNode;
	user: {
		login: string;
		image: string | null;
		activeTheme: "FORGE" | "FIELD";
		role?: string;
		isAdmin?: boolean;
		isImpersonating?: boolean;
	};
}

export function StudentLayout({ children, user }: StudentLayoutProps) {
	return (
		<>
			<ThemeManager />
			<ImpersonationBanner isImpersonating={!!user.isImpersonating} login={user.login} />

			{/* Top navigation bar */}
			<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-color bg-background/90 px-4 backdrop-blur-sm">
				{/* Left: Logo */}
				<div className="flex items-center">
					<ClientLogo />
				</div>
				{/* Center: Nav links (client component for active state) */}
				<Suspense fallback={<div className="w-20" />}>
					<StudentNav role={user.role} isAdmin={user.isAdmin} />
				</Suspense>

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
			<KeyboardShortcuts hasAdminAccess={!!user.isAdmin} />
			<TerminalProvider />
		</>
	);
}

