import prisma from "@/lib/prisma";
import { MemberControl } from "@/components/admin/MemberControl";
import { getClubSettings } from "@/lib/club-settings";

function daysAgoFrom(date: Date | string) {
	return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export async function AdminMembersSection() {
	const activeUsers = await prisma.user.findMany({
		where: { status: "ACTIVE" },
		include: {
			teams: {
				where: { team: { status: { in: ["ACTIVE", "EVALUATING"] } } },
				include: { team: { include: { project: { select: { title: true } } } } },
				take: 1,
			},
			notifications: { where: { readAt: { not: null } }, orderBy: { readAt: "desc" }, take: 1, select: { readAt: true } },
			_count: { select: { teams: true } },
		},
		orderBy: { name: "asc" },
	});

	const completedCounts = await prisma.teamMember.groupBy({
		by: ["userId"],
		where: { userId: { in: activeUsers.map((u) => u.id) }, team: { status: "COMPLETED" } },
		_count: true,
	});
	const completedMap = new Map(completedCounts.map((c) => [c.userId, c._count]));

	const activeMembers = activeUsers.map((u) => {
		const activeTeam = u.teams[0]?.team ?? null;
		const lastRead = u.notifications[0]?.readAt;
		return {
			id: u.id, login: u.login, name: u.name, image: u.image,
			currentRank: u.currentRank, status: u.status,
			labAccessEnabled: u.labAccessEnabled,
			joinedAt: u.joinedAt.toISOString(), updatedAt: u.updatedAt.toISOString(),
			projectTitle: activeTeam?.project?.title ?? null,
			teamId: activeTeam?.id ?? null,
			blackholeDeadline: activeTeam?.blackholeDeadline?.toISOString() ?? null,
			daysAgo: lastRead ? daysAgoFrom(lastRead) : daysAgoFrom(u.joinedAt),
			completedCount: completedMap.get(u.id) || 0,
		};
	});

	const [waitlist, blackholed, alumniRaw, settings] = await Promise.all([
		prisma.user.findMany({ where: { status: "WAITLIST" }, orderBy: { joinedAt: "asc" } }),
		prisma.user.findMany({ where: { status: "BLACKHOLED" } }),
		prisma.user.findMany({ where: { status: "ALUMNI" }, include: { alumniEvaluatorOptIn: true } }),
		getClubSettings()
	]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ser = (u: any) => ({ ...u, joinedAt: u.joinedAt.toISOString(), updatedAt: u.updatedAt.toISOString() });

	return (
		<MemberControl
			activeMembers={activeMembers}
			waitlist={waitlist.map(ser)}
			blackholed={blackholed.map(ser)}
			alumni={alumniRaw.map((u: any) => ({ ...ser(u), alumniOptedIn: u.alumniEvaluatorOptIn?.isActive ?? false }))}
			activeCount={activeMembers.length}
			maxActiveMembers={settings.maxActiveMembers}
		/>
	);
}
