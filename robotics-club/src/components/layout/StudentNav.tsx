"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudentNav({ role, isAdmin }: { role?: string; isAdmin?: boolean }) {
	const pathname = usePathname();

	const navLinks = [
		{ href: "/home", label: "Home" },
		{ href: "/cursus", label: "Cursus" },
		{ href: "/profile", label: "Profile" },
		{ href: "/evaluations", label: "Evaluations" },
		{ href: "/showcase", label: "Showcase" },
		{ href: "/requests", label: "Requests" },
		{ href: "/settings", label: "Settings" },
	];

	if (isAdmin) {
		navLinks.push({ href: "/admin", label: "Admin Space" });
	}

	return (
		<nav className="flex items-center gap-6">
			{navLinks.map((link) => {
				const isActive = pathname.startsWith(link.href);
				return (
					<Link
						key={link.href}
						href={link.href}
						className={`text-sm font-medium transition-colors ${isActive
								? "border-b-2 border-accent pb-0.5 text-accent"
								: "text-text-muted hover:text-text-primary"
							}`}
					>
						{link.label}
					</Link>
				);
			})}
		</nav>
	);
}
