import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequirements } from "@/lib/rank-requirements";
import { requirePermission } from "@/lib/admin-auth";

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const auth = await requirePermission("CAN_MANAGE_PROJECTS");
		if (auth instanceof Response) return auth;

		const body = await req.json();
		const isRequired = Boolean(body.isRequired);

		const project = await prisma.project.findUnique({
			where: { id: params.id },
			select: { rank: true, isRequired: true }
		});

		if (!project) {
			return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
		}

		// Only validate if we are setting it to true AND it was false
		if (isRequired && !project.isRequired) {
			const currentCount = await prisma.project.count({
				where: { rank: project.rank, isRequired: true, status: "ACTIVE" }
			});

			const validation = await validateRequirements(project.rank, currentCount + 1, undefined);
			if (!validation.isValid) {
				return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
			}
		}

		const updated = await prisma.project.update({
			where: { id: params.id },
			data: { isRequired },
		});

		return NextResponse.json({ ok: true, data: updated });
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}
