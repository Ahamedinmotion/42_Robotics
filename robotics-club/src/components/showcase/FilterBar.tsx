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
	const isInProgress = searchParams.get("inProgress") === "true";

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

	const surpriseMe = () => {
		const cards = document.querySelectorAll("[data-showcase-card]");
		if (cards.length === 0) return;
		
		const randomIndex = Math.floor(Math.random() * cards.length);
		const selectedCard = cards[randomIndex] as HTMLElement;
		
		selectedCard.scrollIntoView({ behavior: "smooth", block: "center" });
		
		selectedCard.style.transition = "all 0.5s ease";
		selectedCard.style.boxShadow = "0 0 20px 5px var(--accent)";
		selectedCard.style.transform = "scale(1.02)";
		
		setTimeout(() => {
			selectedCard.style.boxShadow = "";
			selectedCard.style.transform = "";
		}, 1500);
	};

	const isAll = !activeRank && !activeSkill && !isInProgress;

	const chipBase = "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer";
	const chipActive = "bg-accent text-background";
	const chipInactive = "bg-panel border border-border-color text-text-muted hover:text-text-primary";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-text-muted">{totalCount} projects completed</p>
				<button 
					onClick={surpriseMe}
					className="text-xs font-bold uppercase tracking-wider text-accent hover:opacity-80"
				>
					✨ Surprise me
				</button>
			</div>
			<div className="flex gap-2 overflow-x-auto pb-1">
				<button
					onClick={clearFilters}
					className={`${chipBase} ${isAll ? chipActive : chipInactive}`}
				>
					All
				</button>
				<button
					onClick={() => setFilter("inProgress", isInProgress ? null : "true")}
					className={`${chipBase} ${isInProgress ? chipActive : chipInactive}`}
				>
					In Progress
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
