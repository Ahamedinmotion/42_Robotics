import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function BlackholedPage() {
	const session = await getServerSession(authOptions);

	// If session exists and user is not blackholed, redirect
	if (session?.user?.id) {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true, name: true, login: true, currentRank: true },
		});
		if (user && user.status !== "BLACKHOLED") redirect("/home");

		// Fetch last blackholed team
		const lastTeam = await prisma.teamMember.findFirst({
			where: { userId: session.user.id, team: { status: "BLACKHOLED" } },
			include: { team: { include: { project: { select: { title: true } } } } },
			orderBy: { team: { updatedAt: "desc" } },
		});

		return <BlackholedUI projectTitle={lastTeam?.team.project.title} />;
	}

	// No session — still show the page
	return <BlackholedUI />;
}

function BlackholedUI({ projectTitle }: { projectTitle?: string | null }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md space-y-6 rounded-2xl bg-panel p-8 text-center">
				<p className="text-4xl font-bold text-accent-urgency">RC</p>

				<h1 className="text-xl font-bold text-accent-urgency">Blackholed</h1>

				<p className="text-sm text-text-muted">
					Your project deadline expired before a passing evaluation was submitted.
				</p>

				{projectTitle && (
					<p className="text-xs text-text-muted">
						Project: <span className="font-semibold text-text-primary">{projectTitle}</span>
					</p>
				)}

				<hr className="border-border-color" />

				<div className="space-y-2 text-left text-xs text-text-muted">
					<p>• Your progress and rank are preserved.</p>
					<p>• You&apos;ve been placed at the back of the waitlist.</p>
					<p>• When a spot opens, you can re-enter and continue from where you left off.</p>
				</div>

				<p className="text-sm italic text-text-muted">
					This isn&apos;t the end. Everyone who wants to come back can.
				</p>

				<SignOutButton />
			</div>
		</div>
	);
}
