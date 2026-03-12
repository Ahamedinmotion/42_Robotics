"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export function ClientAvatar({ src, login, isOwn }: { src: string | null; login: string; isOwn: boolean }) {
	const [isSpinning, setIsSpinning] = useState(false);
	const hoverTimer = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		if (!isOwn) return;
		hoverTimer.current = setTimeout(() => {
			setIsSpinning(true);
			setTimeout(() => setIsSpinning(false), 1000); // Reset after 1s spin
		}, 5000); // 5 seconds hover
	};

	const handleMouseLeave = () => {
		if (hoverTimer.current) {
			clearTimeout(hoverTimer.current);
			hoverTimer.current = null;
		}
	};

	return (
		<div 
			className={`relative transition-transform duration-1000 ${isSpinning ? "rotate-[360deg]" : ""}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{src ? (
				<Image
					src={src}
					alt={login}
					width={80}
					height={80}
					className="h-20 w-20 rounded-full border-2 border-accent object-cover"
				/>
			) : (
				<div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent bg-panel2 text-2xl font-bold text-text-muted">
					{login.charAt(0).toUpperCase()}
				</div>
			)}
		</div>
	);
}
