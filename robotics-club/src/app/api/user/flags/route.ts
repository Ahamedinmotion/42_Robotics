import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const data = await req.json();
		const validFlags = ["visitedVoid", "discoveredCheats", "survivedSystemUpdate"];
		
		const updateData: any = {};
		for (const key of Object.keys(data)) {
			if (validFlags.includes(key)) {
				updateData[key] = data[key];
			}
		}

		if (Object.keys(updateData).length === 0) return err("No valid flags provided", 400);

		await prisma.user.update({
			where: { id: session.user.id },
			data: updateData
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
