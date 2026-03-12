import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { SkillTreeSection } from "@/components/cursus/SkillTreeSection";
import { ProjectCockpitSection } from "@/components/cursus/ProjectCockpitSection";

export default async function CursusPage({
	searchParams,
}: {
	searchParams: { tab?: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const userId = session.user.id;
	const tab = searchParams.tab === "project" ? "project" : "overview";

	return (
		<div className="space-y-6">
			{/* Tab switcher */}
			<div className="inline-flex rounded-full bg-panel p-1">
				<Link
					href="/cursus?tab=overview"
					className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
						tab === "overview"
							? "bg-accent font-bold text-background"
							: "text-text-muted hover:text-text-primary"
					}`}
				>
					Overview
				</Link>
				<Link
					href="/cursus?tab=project"
					className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
						tab === "project"
							? "bg-accent font-bold text-background"
							: "text-text-muted hover:text-text-primary"
					}`}
				>
					My Project
				</Link>
			</div>

			{/* Tab content */}
			<div className={tab === "overview" ? "" : "space-y-6"}>
				{tab === "overview" ? (
					<Suspense fallback={<div className="h-96 w-full animate-pulse rounded bg-panel" />}>
						<SkillTreeSection userId={userId} />
					</Suspense>
				) : (
					<Suspense fallback={<div className="h-96 w-full animate-pulse rounded bg-panel" />}>
						<ProjectCockpitSection userId={userId} />
					</Suspense>
				)}
			</div>
		</div>
	);
}
