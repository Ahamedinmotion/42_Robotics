// POST /api/teams/[id]/materials
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
		const { itemName, quantity, estimatedCost, justification } = body;

		if (!itemName || !quantity) return err("itemName and quantity are required", 400);

		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});
		if (!member) return err("You are not a member of this team", 403);

		const request = await prisma.materialRequest.create({
			data: {
				teamId,
				requestedById: session.user.id,
				itemName,
				quantity: Number(quantity),
				estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
				justification: justification || "",
				status: "PENDING",
			},
		});

		return ok(request);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
