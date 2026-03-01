import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requireAdmin(["PROJECT_MANAGER", "VP", "PRESIDENT"]);
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const auth2 = auth as { user: any };
		const role = auth2.user.role;
		const isVpOrPres = role === "VP" || role === "PRESIDENT";

		// Status changes restricted to VP/PRESIDENT
		if (body.status) {
			const st = body.status;
			if ((st === "ACTIVE" || st === "RETIRED") && !isVpOrPres) {
				return err("Only VP or PRESIDENT can publish, retire, or reactivate projects", 403);
			}
		}

		const data: any = {};
		if (body.title) data.title = body.title;
		if (body.description !== undefined) data.description = body.description;
		if (body.rank) data.rank = body.rank;
		if (body.status) data.status = body.status;
		if (body.teamSizeMin) data.teamSizeMin = Number(body.teamSizeMin);
		if (body.teamSizeMax) data.teamSizeMax = Number(body.teamSizeMax);
		if (body.blackholeDays) data.blackholeDays = Number(body.blackholeDays);
		if (body.skillTags !== undefined) {
			data.skillTags = typeof body.skillTags === "string"
				? body.skillTags.split(",").map((s: string) => s.trim()).filter(Boolean)
				: body.skillTags;
		}
		if (body.isUnique !== undefined) data.isUnique = body.isUnique;
		if (body.subjectSheetUrl !== undefined) data.subjectSheetUrl = body.subjectSheetUrl;
		if (body.evaluationSheetUrl !== undefined) data.evaluationSheetUrl = body.evaluationSheetUrl;

		const updated = await prisma.project.update({ where: { id: params.id }, data });
		return ok(updated);
	} catch (e: any) {
		return err(e.message || "Internal Server Error", 500);
	}
}
