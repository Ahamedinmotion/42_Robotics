import prisma from "@/lib/prisma";
import { validateRequirements } from "@/lib/rank-requirements";
import { Rank } from "@prisma/client";
import { requireAnyPermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";

export async function PATCH(
	req: Request,
	{ params }: { params: { rank: string } }
) {
	try {
		const auth = await requireAnyPermission(["CAN_MANAGE_CLUB_SETTINGS", "CAN_EDIT_CONTENT"]);
		if (auth instanceof Response) return auth;

		const rank = params.rank as Rank;
		const body = await req.json();
		const projectsRequired = Number(body.projectsRequired);

		if (isNaN(projectsRequired) || projectsRequired < 1) {
			return err("Invalid projects required count", 400);
		}

		// Validation
		const validation = await validateRequirements(rank, undefined, projectsRequired);
		if (!validation.isValid) {
			return err(validation.error || "Invalid requirements", 400);
		}

		const updated = await prisma.rankRequirement.upsert({
			where: { rank },
			update: { projectsRequired, updatedById: (auth.user as any).id },
			create: { rank, projectsRequired, updatedById: (auth.user as any).id },
		});

		return ok(updated);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
