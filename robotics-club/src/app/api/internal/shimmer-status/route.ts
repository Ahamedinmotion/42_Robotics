import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const settings = await prisma.clubSettings.findUnique({
			where: { id: "singleton" }
		});

		if (!settings?.goldenShimmerUntil) {
			return ok({ active: false });
		}

		const isActive = new Date(settings.goldenShimmerUntil) > new Date();
		return ok({ active: isActive });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
