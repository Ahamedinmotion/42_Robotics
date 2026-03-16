import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// POST /api/admin/eval-sheets
// Creates a new evaluation sheet for a project
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userPermissions = (session.user as any).permissions || [];
		if (!userPermissions.includes("CAN_EDIT_CONTENT")) {
			return err("Insufficient permissions", 403);
		}

		const body = await req.json();
		const { projectId, passMark, sections, updateActiveEvaluations } = body;

		if (!projectId || !sections || !Array.isArray(sections)) {
			return err("Missing required fields", 400);
		}

		// Create sheet with nested sections and questions
		const sheet = await (prisma as any).evalSheet.create({
			data: {
				projectId,
				passMark: passMark || 60,
				version: 1,
				createdById: session.user.id,
				sections: {
					create: sections.map((section: any, sIdx: number) => ({
						title: section.title,
						order: sIdx,
						weight: section.weight,
						passMark: section.passMark,
						questions: {
							create: section.questions.map((q: any, qIdx: number) => ({
								order: qIdx,
								type: q.type,
								label: q.label,
								description: q.description,
								required: q.required ?? true,
								isHardRequirement: q.isHardRequirement ?? false,
								weight: q.weight ?? 1,
								options: q.options,
								scaleMin: q.scaleMin,
								scaleMax: q.scaleMax,
								scaleMinLabel: q.scaleMinLabel,
								scaleMaxLabel: q.scaleMaxLabel,
							})),
						},
					})),
				},
			},
			include: {
				sections: {
					include: {
						questions: true,
					},
				},
			},
		});

		return ok(sheet);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
