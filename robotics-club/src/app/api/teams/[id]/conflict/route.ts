// POST /api/teams/[id]/conflict
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const body = await req.json();
		const { description } = body;

		if (!description) return err("description is required", 400);

		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});
		if (!member) return err("You are not a member of this team", 403);

		await prisma.conflictFlag.create({
			data: {
				teamId,
				raisedById: session.user.id,
				description,
			},
		});

		// NEVER return raisedById
		return ok({ success: true });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
