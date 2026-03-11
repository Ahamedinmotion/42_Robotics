"use client";

import { useEffect, useState } from "react";

export function QuoteBar() {
	const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		fetch("/api/quote")
			.then((r) => r.json())
			.then((data) => {
				setQuote(data);
				setLoaded(true);
			})
			.catch(() => {
				setLoaded(false);
			});
	}, []);

	if (!loaded && quote === null) {
		return (
			<div className="py-3 text-center">
				<div className="h-3 w-48 animate-pulse rounded bg-panel2 mx-auto" />
			</div>
		);
	}

	if (!quote) return null;

	return (
		<div
			className="py-3 text-center"
			style={{
				opacity: loaded ? 1 : 0,
				transition: "opacity 0.6s ease",
			}}
		>
			<p>
				<span className="italic text-sm text-text-muted">&ldquo;{quote.quote}&rdquo;</span>
				<span className="text-xs text-accent ml-2">&mdash; {quote.author}</span>
			</p>
			<a
				href="https://zenquotes.io"
				target="_blank"
				className="text-[10px] text-text-muted hover:text-accent mt-1 inline-block"
			>
				Quotes by ZenQuotes.io
			</a>
		</div>
	);
}
