import { NextResponse } from "next/server";

const FALLBACK = {
	quote: "The best way to predict the future is to invent it.",
	author: "Alan Kay",
};

export async function GET() {
	try {
		const res = await fetch("https://zenquotes.io/api/random", {
			cache: "no-store",
		});
		if (!res.ok) throw new Error("ZenQuotes fetch failed");

		const data = await res.json();
		const entry = data?.[0];
		if (!entry?.q || !entry?.a) throw new Error("Invalid response");

		return NextResponse.json({ quote: entry.q, author: entry.a });
	} catch {
		return NextResponse.json(FALLBACK);
	}
}
