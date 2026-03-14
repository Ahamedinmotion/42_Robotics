"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSound } from "@/components/providers/SoundProvider";

export function AdminNav({ userRole, permissions }: { userRole?: string; permissions?: string[] }) {
	const { playSFX } = useSound();
	const searchParams = useSearchParams();
	const active = searchParams.get("section") || "members";

	const sections = [
		{ key: "members", label: "Members" },
		{ key: "queue", label: "Queue" },
		{ key: "analytics", label: "Analytics" },
		{ key: "content", label: "Content" },
		{ key: "oversight", label: "Oversight" },
		{ key: "access", label: "Access" },
		{ key: "board", label: "Board" },
		{ key: "achievements", label: "Achievements" },
	];

	const perms = permissions || [];
	if (perms.includes("CAN_SEND_ANNOUNCEMENTS") || perms.includes("CAN_MANAGE_ANNOUNCEMENTS")) {
		sections.push({ key: "announce", label: "Announce" });
	}
	if (perms.includes("CAN_MANAGE_ROLES")) {
		sections.push({ key: "roles", label: "Roles" });
		sections.push({ key: "audit", label: "Audit" });
	}
	if (perms.includes("CAN_MANAGE_CLUB_SETTINGS")) {
		sections.push({ key: "settings", label: "Settings" });
	}

	return (
		<nav className="flex items-center gap-5">
			{sections.map((s) => (
				<Link
					key={s.key}
					href={`/admin?section=${s.key}`}
					onClick={() => playSFX("button")}
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
