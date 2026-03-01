import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("Unauthorized", 401);

	try {
		const notification = await prisma.notification.findUnique({
			where: { id: params.id },
			select: { userId: true },
		});

		if (!notification) return err("Not found", 404);
		if (notification.userId !== session.user.id) return err("Forbidden", 403);

		await prisma.notification.update({
			where: { id: params.id },
			data: { readAt: new Date() },
		});

		return ok({ success: true });
	} catch (e: any) {
		return err(e.message || "Internal Server Error", 500);
	}
}
