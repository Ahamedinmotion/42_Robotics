import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("Unauthorized", 401);

	const requests = await prisma.fabricationRequest.findMany({
		where: { userId: session.user.id },
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
		const { machineType, modelFileUrl, estimatedMinutes, estimatedMaterialGrams, purpose, teamId } = body;

		if (!machineType || !modelFileUrl) return err("machineType and modelFileUrl are required", 400);

		const request = await prisma.fabricationRequest.create({
			data: {
				teamId: teamId || null,
				userId: session.user.id,
				machineType,
				modelFileUrl,
				estimatedMinutes: Number(estimatedMinutes) || 0,
				estimatedMaterialGrams: Number(estimatedMaterialGrams) || 0,
				purpose: purpose || "",
				status: "PENDING",
			},
		});

		return ok(request);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
