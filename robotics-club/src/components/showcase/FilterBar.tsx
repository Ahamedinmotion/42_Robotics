"use client";

import { useRouter, useSearchParams } from "next/navigation";

function titleCase(str: string) {
	return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FilterBarProps {
	ranks: string[];
	skillTags: string[];
	totalCount: number;
}

export function FilterBar({ ranks, skillTags, totalCount }: FilterBarProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const activeRank = searchParams.get("rank");
	const activeSkill = searchParams.get("skill");

	const setFilter = (key: string, value: string | null) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		router.push(`/showcase?${params.toString()}`);
	};

	const clearFilters = () => {
		router.push("/showcase");
	};

	const isAll = !activeRank && !activeSkill;

	const chipBase = "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer";
	const chipActive = "bg-accent text-background";
	const chipInactive = "bg-panel border border-border-color text-text-muted hover:text-text-primary";

	return (
		<div className="space-y-2">
			<p className="text-sm text-text-muted">{totalCount} projects completed</p>
			<div className="flex gap-2 overflow-x-auto pb-1">
				<button
					onClick={clearFilters}
					className={`${chipBase} ${isAll ? chipActive : chipInactive}`}
				>
					All
				</button>
				{ranks.map((r) => (
					<button
						key={r}
						onClick={() => setFilter("rank", activeRank === r ? null : r)}
						className={`${chipBase} ${activeRank === r ? chipActive : chipInactive}`}
					>
						{r}
					</button>
				))}
				{skillTags.slice(0, 8).map((tag) => (
					<button
						key={tag}
						onClick={() => setFilter("skill", activeSkill === tag ? null : tag)}
						className={`${chipBase} ${activeSkill === tag ? chipActive : chipInactive}`}
					>
						{titleCase(tag)}
					</button>
				))}
			</div>
		</div>
	);
}
