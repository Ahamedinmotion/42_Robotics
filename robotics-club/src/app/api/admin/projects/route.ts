import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getClubSettings } from "@/lib/club-settings";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
	const auth = await requirePermission("CAN_MANAGE_PROJECTS");
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const {
			title, description, rank, teamSizeMin, teamSizeMax,
			blackholeDays, skillTags, isUnique,
			subjectSheetUrl, evaluationSheetUrl, status,
		} = body;

		if (!title || !rank) return err("title and rank are required", 400);

		const auth2 = auth as { user: any; permissions: string[] };
		const settings = await getClubSettings();

		// Users with CAN_MANAGE_PROJECTS can publish directly
		const canPublish = hasPermission(auth2.permissions, "CAN_MANAGE_PROJECTS");
		const finalStatus = canPublish && status === "ACTIVE" ? "ACTIVE" : "DRAFT";

		const project = await prisma.project.create({
			data: {
				title,
				description: description || "",
				rank: rank as "E" | "D" | "C" | "B" | "A" | "S",
				status: finalStatus as "ACTIVE" | "DRAFT",
				teamSizeMin: Number(teamSizeMin) || settings.minTeamSize,
				teamSizeMax: Number(teamSizeMax) || settings.maxTeamSize,
				blackholeDays: Number(blackholeDays) || settings.defaultBlackholeDays,
				skillTags: typeof skillTags === "string" ? skillTags.split(",").map((s: string) => s.trim()).filter(Boolean) : skillTags || [],
				isUnique: isUnique ?? false,
				subjectSheetUrl: subjectSheetUrl || null,
				evaluationSheetUrl: evaluationSheetUrl || null,
				createdById: auth2.user.id,
			},
		});

		revalidatePath("/cursus");
		revalidatePath("/admin");
		revalidateTag("projects");

		return ok(project);
	} catch (e) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
