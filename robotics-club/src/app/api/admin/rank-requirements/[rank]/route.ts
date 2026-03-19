import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateRequirements } from "@/lib/rank-requirements";
import { Rank } from "@prisma/client";

export async function PATCH(
	req: Request,
	{ params }: { params: { rank: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		const userPermissions = (session?.user as any)?.dynamicRole?.permissions || [];
		
		if (!userPermissions.includes("CAN_MANAGE_CLUB_SETTINGS") && !userPermissions.includes("CAN_EDIT_CONTENT")) {
			return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
		}

		const rank = params.rank as Rank;
		const body = await req.json();
		const projectsRequired = Number(body.projectsRequired);

		if (isNaN(projectsRequired) || projectsRequired < 1) {
			return NextResponse.json({ ok: false, error: "Invalid projects required count" }, { status: 400 });
		}

		// Validation
		const validation = await validateRequirements(rank, undefined, projectsRequired);
		if (!validation.isValid) {
			return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
		}

		const updated = await prisma.rankRequirement.upsert({
			where: { rank },
			update: { projectsRequired, updatedById: session!.user.id },
			create: { rank, projectsRequired, updatedById: session!.user.id },
		});

		return NextResponse.json({ ok: true, data: updated });
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}
