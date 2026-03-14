import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// GET /api/teams/[id]/scratchpad
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const scratchpad = await prisma.teamScratchpad.findUnique({
			where: { teamId },
			include: {
				lastEditedBy: {
					select: { login: true }
				}
			}
		});

		return ok(scratchpad || { content: "", updatedAt: new Date() });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

// PATCH /api/teams/[id]/scratchpad
export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const { content } = await req.json();

		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});

		if (!member && !(session.user as any).isAdmin) {
			return err("Forbidden. Only team members can edit the scratchpad", 403);
		}

		const scratchpad = await prisma.teamScratchpad.upsert({
			where: { teamId },
			update: {
				content,
				lastEditedById: session.user.id,
			},
			create: {
				teamId,
				content,
				lastEditedById: session.user.id,
			},
		});

		return ok(scratchpad);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
