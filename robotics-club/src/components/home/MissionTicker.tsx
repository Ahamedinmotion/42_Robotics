import prisma from "@/lib/prisma";

export async function MissionTicker({ userId }: { userId: string }) {
	const now = new Date();
	
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			teams: {
				where: {
					team: { status: { in: ["ACTIVE", "EVALUATING"] } },
				},
				include: {
					team: {
						include: {
							weeklyReports: { orderBy: { createdAt: "desc" }, take: 1 },
						},
					},
				},
				take: 1,
			},
		},
	});

	if (!user) return null;

	const activeTeam = user.teams[0]?.team ?? null;
	const lastReport = activeTeam?.weeklyReports[0] ?? null;

	// Today's Mission
	let mission = "Keep building.";
	if (!activeTeam) {
		mission = "You're not on a project. Check the cursus and get started.";
	} else if (lastReport && (now.getTime() - lastReport.createdAt.getTime()) > 7 * 24 * 60 * 60 * 1000) {
		const days = Math.floor((now.getTime() - lastReport.createdAt.getTime()) / (24 * 60 * 60 * 1000));
		mission = `Your last report was ${days} days ago. Submit one today.`;
	} else {
		const availableSlots = await prisma.evaluationSlot.count({
			where: { 
				status: "OPEN", 
				team: { project: { rank: user.currentRank as any } } 
			}
		});
		if (availableSlots > 0) {
			mission = `${availableSlots} evaluation slots are open for your rank right now.`;
		}
	}

	// Did You Know
	const showcaseTeams = await prisma.team.findMany({
		where: { status: "COMPLETED" },
		include: { 
			project: { select: { title: true, description: true } }, 
			members: { include: { user: { select: { login: true } } }, take: 1 } 
		},
		take: 20 // Limit to avoid heavy fetch
	});
	
	let didYouKnow = null;
	if (showcaseTeams.length > 0) {
		const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
		const factTeam = showcaseTeams[dayOfYear % showcaseTeams.length];
		const memberLogin = factTeam.members[0]?.user.login || "a member";
		const description = factTeam.project.description || "";
		const desc = description.slice(0, 100).trim() + (description.length > 100 ? "..." : "");
		didYouKnow = `Did you know @${memberLogin}'s ${factTeam.project.title}: ${desc}`;
	}

	return (
		<div className="space-y-1">
			<p className="text-sm font-semibold text-accent">{mission}</p>
			{didYouKnow && <p className="text-xs text-text-muted">{didYouKnow}</p>}
		</div>
	);
}
