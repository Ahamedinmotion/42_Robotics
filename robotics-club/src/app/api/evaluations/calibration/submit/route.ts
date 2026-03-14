import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { sessionId, score, responses, feedback } = await req.json();

		const newResponse = await (prisma as any).calibrationResponse.create({
			data: {
				sessionId,
				evaluatorId: session.user.id,
				score,
				responses,
				feedback,
			}
		});

		return ok(newResponse);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
