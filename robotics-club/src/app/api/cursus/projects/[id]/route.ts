// GET /api/cursus/projects/[id]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const projectId = params.id;

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				createdBy: {
					select: {
						name: true,
						login: true,
					},
				},
				teams: {
					where: {
						status: {
							in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
						},
					},
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
					},
				},
			},
		});

		if (!project) {
			return err("Project not found", 404);
		}

		return ok(project);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
