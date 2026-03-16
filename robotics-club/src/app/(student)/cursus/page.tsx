import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { SkillTreeSection } from "@/components/cursus/SkillTreeSection";
import prisma from "@/lib/prisma";
import { TeamStatus } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function CursusPage({
	searchParams,
}: {
	searchParams: { tab?: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const userId = session.user.id;
	const tab = searchParams.tab === "project" ? "project" : "overview";

	// Fetch active team to enable direct routing
	const activeTeamMember = await prisma.teamMember.findFirst({
		where: {
			userId,
			team: { status: { in: [TeamStatus.ACTIVE, TeamStatus.EVALUATING] } },
		},
		select: { teamId: true },
	});

	// If the user lands on the 'project' tab, redirect them to the full cockpit if available
	if (tab === "project" && activeTeamMember) {
		redirect(`/cursus/projects/${activeTeamMember.teamId}/cockpit`);
	}

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
					href={activeTeamMember ? `/cursus/projects/${activeTeamMember.teamId}/cockpit` : "/cursus?tab=project"}
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
			<div className="space-y-6">
				{tab === "overview" ? (
					<Suspense fallback={<div className="h-96 w-full animate-pulse rounded bg-panel" />}>
						<SkillTreeSection userId={userId} />
					</Suspense>
				) : (
					<Card className="space-y-4 py-12 text-center">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-panel-2 text-2xl text-text-muted">🛰️</div>
						<div className="space-y-1">
							<p className="font-bold text-text-primary">No mission currently active.</p>
							<p className="text-sm text-text-muted italic">Select a module from the skill tree to begin deployment.</p>
						</div>
						<Button variant="primary" href="/cursus?tab=overview" className="mx-auto mt-4">
							Browse Modules
						</Button>
					</Card>
				)}
			</div>
		</div>
	);
}
