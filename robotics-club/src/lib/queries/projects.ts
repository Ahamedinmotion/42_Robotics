import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ProjectStatus } from "@prisma/client";

/**
 * Fetch all active projects for the cursus.
 */
export const getActiveProjects = () =>
	unstable_cache(
		async () => {
			return prisma.project.findMany({
				where: { status: ProjectStatus.ACTIVE },
				include: {
					teams: {
						where: {
							status: {
								in: ["FORMING", "ACTIVE", "EVALUATING"],
							},
						},
						select: { id: true },
					},
				},
				orderBy: { rank: "asc" },
			});
		},
		["active-projects"],
		{ revalidate: 3600, tags: ["projects"] }
	)();

/**
 * Fetch a single project by ID.
 */
export const getProjectById = (id: string) =>
	unstable_cache(
		async () => {
			return prisma.project.findUnique({
				where: { id },
				include: { _count: { select: { teams: true } } },
			});
		},
		[`project-${id}`],
		{ revalidate: 3600, tags: [`project-${id}`, "projects"] }
	)();
