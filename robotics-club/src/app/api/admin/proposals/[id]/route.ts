import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requireAdmin(["PROJECT_MANAGER", "VP", "PRESIDENT"]);
	if (auth instanceof Response) return auth;

	try {
		const { status, moderatorNote } = await req.json();
		if (!status) return err("status is required", 400);

		const proposal = await prisma.projectProposal.findUnique({ where: { id: params.id } });
		if (!proposal) return err("Proposal not found", 404);

		if (status === "APPROVED") {
			const auth2 = auth as { user: any };
			const rankVal = proposal.proposedRank || "E";
			const isHighRank = ["B", "A", "S"].includes(rankVal);
			const newProject = await prisma.project.create({
				data: {
					title: proposal.title,
					description: proposal.description || "",
					rank: rankVal as any,
					status: "DRAFT",
					teamSizeMin: 2,
					teamSizeMax: 4,
					blackholeDays: 28,
					skillTags: [],
					isUnique: isHighRank,
					createdById: auth2.user.id,
				},
			});

			const updated = await prisma.projectProposal.update({
				where: { id: params.id },
				data: { status, moderatorNote: moderatorNote || undefined, convertedProjectId: newProject.id },
			});
			return ok({ proposal: updated, project: newProject });
		}

		const updated = await prisma.projectProposal.update({
			where: { id: params.id },
			data: { status, moderatorNote: moderatorNote || undefined },
		});
		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
