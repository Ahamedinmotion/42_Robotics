import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Fetch a user profile with common relations.
 */
export const getUserProfile = (userId: string) => 
	unstable_cache(
		async () => {
			return prisma.user.findUnique({
				where: { id: userId },
				include: {
					achievements: {
						include: { achievement: true },
						orderBy: { unlockedAt: "desc" },
					},
					skillProgress: { orderBy: { projectsCompleted: "desc" } },
					_count: {
						select: {
							evaluationsGiven: { where: { status: "COMPLETED" } },
						},
					}
				},
			});
		},
		[`user-profile-${userId}`],
		{ revalidate: 300, tags: [`user-${userId}`] }
	)();

/**
 * Fetch user's active team.
 */
export const getUserActiveTeam = (userId: string) =>
	unstable_cache(
		async () => {
			return prisma.teamMember.findFirst({
				where: {
					userId,
					team: { status: { in: ["ACTIVE", "EVALUATING"] } },
				},
				include: {
					team: {
						include: {
							project: true,
							members: {
								include: {
									user: { select: { id: true, login: true, image: true, name: true } },
								},
							},
							weeklyReports: { orderBy: { createdAt: "desc" }, take: 1 },
							evaluationSlots: {
								where: { status: "OPEN" },
								include: { evaluations: { select: { id: true, status: true } } },
							},
						},
					},
				},
			});
		},
		[`user-active-team-${userId}`],
		{ revalidate: 60, tags: [`user-${userId}-team`, `team-activity`] }
	)();
