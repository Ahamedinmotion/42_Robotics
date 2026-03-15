import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { lastSeenUpdateScreen: true }
		});

		if (!user) return err("User not found", 404);

		// Show if never seen or > 30 days ago
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		
		const shouldShow = !user.lastSeenUpdateScreen || user.lastSeenUpdateScreen < thirtyDaysAgo;

		return ok({ shouldShow });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

export async function POST() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		await prisma.user.update({
			where: { id: session.user.id },
			data: { 
				lastSeenUpdateScreen: new Date(),
				survivedSystemUpdate: true
			}
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
