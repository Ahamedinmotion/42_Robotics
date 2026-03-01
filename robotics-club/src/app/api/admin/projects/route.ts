import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(req: Request) {
	const auth = await requireAdmin(["PROJECT_MANAGER", "VP", "PRESIDENT"]);
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const {
			title, description, rank, teamSizeMin, teamSizeMax,
			blackholeDays, skillTags, isUnique,
			subjectSheetUrl, evaluationSheetUrl, status,
		} = body;

		if (!title || !rank) return err("title and rank are required", 400);

		const auth2 = auth as { user: any };
		const role = auth2.user.role;

		// PROJECT_MANAGER can only save as DRAFT
		const finalStatus = (role === "VP" || role === "PRESIDENT") && status === "ACTIVE" ? "ACTIVE" : "DRAFT";

		const project = await prisma.project.create({
			data: {
				title,
				description: description || "",
				rank: rank as any,
				status: finalStatus as any,
				teamSizeMin: Number(teamSizeMin) || 2,
				teamSizeMax: Number(teamSizeMax) || 4,
				blackholeDays: Number(blackholeDays) || 28,
				skillTags: typeof skillTags === "string" ? skillTags.split(",").map((s: string) => s.trim()).filter(Boolean) : skillTags || [],
				isUnique: isUnique ?? false,
				subjectSheetUrl: subjectSheetUrl || null,
				evaluationSheetUrl: evaluationSheetUrl || null,
				createdById: auth2.user.id,
			},
		});
		return ok(project);
	} catch (e: any) {
		return err(e.message || "Internal Server Error", 500);
	}
}
