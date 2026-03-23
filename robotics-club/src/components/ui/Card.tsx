import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
	className?: string;
	glowing?: boolean;
}

export function Card({ children, className = "", onClick, glowing = false, ...rest }: CardProps) {
	const interactive = onClick ? "cursor-pointer hover:border-accent transition-colors" : "";

	return (
		<div
			onClick={onClick}
			className={`rounded-xl border border-border-color bg-panel p-4 ${interactive} ${className}`}
			style={
				glowing
					? {
						boxShadow:
							"0 0 0 1px var(--accent), 0 0 20px rgba(var(--accent-rgb), 0.15)",
					}
					: undefined
			}
			{...rest}
		>
			{children}
		</div>
	);
}

