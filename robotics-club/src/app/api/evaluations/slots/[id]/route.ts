import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const slot = await prisma.evaluationSlot.findUnique({
			where: { id: params.id },
			include: {
				team: {
					include: {
						project: true,
						members: {
							include: {
								user: {
									select: {
										id: true,
										login: true,
										name: true,
										image: true,
									},
								},
							},
						},
					},
				},
				claimedBy: {
					select: {
						id: true,
						login: true,
						name: true,
						image: true,
					},
				},
			},
		});

		if (!slot) return err("Slot not found", 404);

		return ok(slot);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
