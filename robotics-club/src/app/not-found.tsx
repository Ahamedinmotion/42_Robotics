import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<p className="text-8xl font-black text-accent">404</p>
			<h1 className="mt-4 text-2xl font-bold text-text-primary">Page not found</h1>
			<p className="mt-2 text-sm text-text-muted">
				The page you&apos;re looking for doesn&apos;t exist.
			</p>
			<Link
				href="/home"
				className="mt-6 inline-block rounded-xl bg-accent px-6 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90"
			>
				Go home
			</Link>
		</div>
	);
}
