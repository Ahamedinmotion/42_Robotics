import React from "react";

type RankValue = "E" | "D" | "C" | "B" | "A" | "S";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
	rank: RankValue;
	size?: BadgeSize;
	className?: string;
}

const rankColours: Record<RankValue, string> = {
	E: "#888888",
	D: "#44AAFF",
	C: "#44FF88",
	B: "#FFD700",
	A: "#FF6B00",
	S: "#CC44FF",
};

const sizeStyles: Record<BadgeSize, string> = {
	sm: "w-6 h-6 text-xs",
	md: "w-8 h-8 text-sm",
	lg: "w-12 h-12 text-lg",
};

export function Badge({ rank, size = "md", className = "" }: BadgeProps) {
	const colour = rankColours[rank];
	const isS = rank === "S";

	return (
		<span
			className={`inline-flex items-center justify-center rounded-md border-2 font-bold uppercase tracking-wider ${sizeStyles[size]} ${className}`}
			style={{
				color: colour,
				borderColor: colour,
				...(isS
					? { boxShadow: `0 0 8px ${colour}, 0 0 16px ${colour}40` }
					: {}),
			}}
		>
			{rank}
		</span>
	);
}
