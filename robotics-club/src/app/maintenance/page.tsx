import { getClubSettings } from "@/lib/club-settings";

export default async function MaintenancePage() {
	const settings = await getClubSettings();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<div className="mx-auto max-w-md space-y-6">
				<div className="text-6xl">🔧</div>
				<h1 className="text-3xl font-bold text-text-primary">
					{settings.clubName}
				</h1>
				<p className="text-lg text-text-muted">
					{settings.maintenanceMessage}
				</p>
				<a
					href="/login"
					className="inline-block rounded-lg border border-border-color px-4 py-2 text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
				>
					← Back to Login
				</a>
			</div>
		</div>
	);
}
