import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CockpitShell } from "@/components/cursus/cockpit/CockpitShell";

export default async function ProjectCockpitPage({ params }: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return redirect("/cursus");

	const teamId = params.id;
	const userId = session.user.id;

	const teamData = await prisma.team.findUnique({
		where: { id: teamId },
		include: {
			project: true,
			evaluations: { where: { status: "COMPLETED" } },
			evaluationSlots: { where: { status: { in: ["OPEN", "CLAIMED"] } } },
			members: {
				include: {
					user: {
						select: { id: true, login: true, image: true, currentRank: true },
					},
				},
			},
			weeklyReports: {
				orderBy: { weekNumber: "desc" },
				include: {
					submittedBy: {
						select: { login: true }
					}
				}
			},
			scratchpad: {
				include: {
					lastEditedBy: {
						select: { login: true }
					}
				}
			},
			materialRequests: {
				orderBy: { createdAt: "desc" }
			},
			fabricationRequests: {
				orderBy: { createdAt: "desc" }
			},
			extensionRequests: {
				orderBy: { createdAt: "desc" }
			},
			disputes: {
				orderBy: { createdAt: "desc" }
			},
			checkouts: {
				orderBy: { createdAt: "desc" },
				include: {
					user: {
						select: { login: true, image: true }
					}
				}
			},
			postMortems: {
				where: { userId }
			}
		},
	});

	if (!teamData) return redirect("/cursus");

	const team = teamData as any;
	const isAdmin = !!(session.user as any).isAdmin;
	const member = (team.members as any[]).find((m) => m.userId === userId);

	if (!isAdmin && !member) {
		return redirect("/cursus");
	}

	const hasSubmittedPostMortem = (team.postMortems?.length || 0) > 0;

	return (
		<main className="min-h-screen bg-background text-text-primary">
			<CockpitShell 
				team={team} 
				currentUser={session.user} 
				isAdmin={isAdmin} 
				hasSubmittedPostMortem={hasSubmittedPostMortem}
			/>
		</main>
	);
}
