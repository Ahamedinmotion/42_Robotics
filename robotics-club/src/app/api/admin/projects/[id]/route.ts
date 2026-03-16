import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_MANAGE_PROJECTS");
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const { permissions } = auth;

		// Status changes restricted to users with CAN_MANAGE_PROJECTS
		if (body.status) {
			const st = body.status;
			if ((st === "ACTIVE" || st === "RETIRED") && !hasPermission(permissions, "CAN_MANAGE_PROJECTS")) {
				return err("Insufficient permissions to publish, retire, or reactivate projects", 403);
			}
		}

		const data: any = {};
		if (body.title) data.title = body.title;
		if (body.description !== undefined) data.description = body.description;
		if (body.rank) data.rank = body.rank;
		if (body.status) data.status = body.status;
		if (body.teamSizeMin !== undefined) data.teamSizeMin = Number(body.teamSizeMin);
		if (body.teamSizeMax !== undefined) data.teamSizeMax = Number(body.teamSizeMax);
		if (body.blackholeDays !== undefined) data.blackholeDays = Number(body.blackholeDays);
		if (body.skillTags !== undefined) {
			data.skillTags = typeof body.skillTags === "string"
				? body.skillTags.split(",").map((s: string) => s.trim()).filter(Boolean)
				: body.skillTags;
		}
		if (body.isUnique !== undefined) data.isUnique = body.isUnique;
		if (body.subjectSheetUrl !== undefined) data.subjectSheetUrl = body.subjectSheetUrl;
		if (body.evaluationSheetUrl !== undefined) data.evaluationSheetUrl = body.evaluationSheetUrl;
		if (body.objectives !== undefined) data.objectives = body.objectives;
		if (body.deliverables !== undefined) data.deliverables = body.deliverables;

		const updated = await prisma.project.update({ where: { id: params.id }, data });

		// Cascade updates to active teams if requested
		if (body.updateActiveTeams && body.blackholeDays !== undefined) {
			const teams = await prisma.team.findMany({
				where: { 
					projectId: params.id,
					status: "ACTIVE",
					activatedAt: { not: null }
				}
			});

			// Update each team's deadline based on its own activatedAt + new blackholeDays
			for (const team of teams) {
				if (team.activatedAt) {
					const newDeadline = new Date(team.activatedAt);
					newDeadline.setDate(newDeadline.getDate() + Number(body.blackholeDays));
					
					await prisma.team.update({
						where: { id: team.id },
						data: { blackholeDeadline: newDeadline }
					});
				}
			}
		}
		
		revalidatePath("/cursus");
		revalidatePath("/admin");
		revalidateTag("projects");

		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
