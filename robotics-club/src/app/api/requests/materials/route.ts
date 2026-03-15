import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("Unauthorized", 401);

	const requests = await prisma.materialRequest.findMany({
		where: { requestedById: session.user.id },
		orderBy: { createdAt: "desc" },
		include: {
			team: { select: { name: true, project: { select: { title: true } } } }
		}
	});

	return ok(requests);
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const body = await req.json();
		const { itemName, quantity, estimatedCost, justification, category, teamId } = body;

		if (!itemName || !quantity) return err("itemName and quantity are required", 400);

		const request = await prisma.materialRequest.create({
			data: {
				teamId: teamId || null,
				requestedById: session.user.id,
				category: category || "OTHER",
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
