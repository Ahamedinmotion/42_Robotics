"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function AdminNav({ userRole }: { userRole?: string }) {
	const searchParams = useSearchParams();
	const active = searchParams.get("section") || "members";

	const sections = [
		{ key: "members", label: "Members" },
		{ key: "queue", label: "Queue" },
		{ key: "analytics", label: "Analytics" },
		{ key: "content", label: "Content" },
		{ key: "access", label: "Access" },
	];

	if (userRole === "PRESIDENT") {
		sections.push({ key: "roles", label: "Roles" });
	}

	return (
		<nav className="flex items-center gap-5">
			{sections.map((s) => (
				<Link
					key={s.key}
					href={`/admin?section=${s.key}`}
					className={`text-sm font-medium transition-colors ${active === s.key
							? "border-b-2 border-accent pb-0.5 text-accent"
							: "text-text-muted hover:text-text-primary"
						}`}
				>
					{s.label}
				</Link>
			))}
		</nav>
	);
}
