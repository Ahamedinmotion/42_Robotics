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
 * Fetch a single project by ID with basic count.
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

/**
 * Fetch full project detail including teams, evaluations, and feedback.
 */
export const getProjectFullDetail = (id: string) =>
	unstable_cache(
		async () => {
			return prisma.project.findUnique({
				where: { id },
				include: {
					teams: {
						include: {
							members: {
								include: {
									user: {
										select: {
											id: true,
											login: true,
											name: true,
											image: true,
										},
									},
								},
							},
							evaluations: {
								where: { status: "COMPLETED" },
								include: {
									evaluator: {
										include: {
											alumniEvaluatorOptIn: true,
										},
									},
									feedback: true,
								},
							},
							weeklyReports: {
								orderBy: { weekNumber: "desc" },
								select: {
									id: true,
									photoUrls: true,
									weekNumber: true,
									milestoneTitle: true,
								}
							}
						},
						orderBy: { createdAt: "desc" },
					},
					_count: {
						select: {
							teams: true,
						},
					},
				},
			});
		},
		[`project-detail-${id}`],
		{ revalidate: 3600, tags: [`project-${id}`, "projects"] }
	)();
