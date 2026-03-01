"use client";

import Link from "next/link";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
			<p className="mt-2 max-w-md text-sm text-text-muted">{error.message}</p>
			<div className="mt-6 flex gap-3">
				<button
					onClick={reset}
					className="rounded-xl bg-accent px-6 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
				>
					Try again
				</button>
				<Link
					href="/home"
					className="rounded-xl border border-border-color bg-panel px-6 py-2 text-sm font-bold text-text-primary transition-colors hover:border-accent"
				>
					Go home
				</Link>
			</div>
		</div>
	);
}
