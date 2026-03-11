"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface TitleSelectorProps {
	initialTitle: string | null;
	unlockedTitles: string[];
}

export function TitleSelector({ initialTitle, unlockedTitles }: TitleSelectorProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [selected, setSelected] = useState(initialTitle || "");
	const [loading, setLoading] = useState(false);

	const handleEquip = async (newTitle: string) => {
		setSelected(newTitle);
		setLoading(true);
		try {
			const res = await fetch("/api/user/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ equippedTitle: newTitle }),
			});

			if (res.ok) {
				toast(newTitle ? `Title equipped: ${newTitle}` : "Title removed");
				router.refresh();
			} else {
				const data = await res.json();
				toast(data.error || "Failed to equip title", "error");
			}
		} catch {
			toast("Network error", "error");
		} finally {
			setLoading(false);
		}
	};

	if (unlockedTitles.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="text-xs font-bold uppercase tracking-wider text-text-muted">Equip Title:</span>
			<select
				value={selected}
				onChange={(e) => handleEquip(e.target.value)}
				disabled={loading}
				className="rounded-md border border-border-color bg-background px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
			>
				<option value="">None</option>
				{unlockedTitles.map((t) => (
					<option key={t} value={t}>
						{t}
					</option>
				))}
			</select>
		</div>
	);
}
