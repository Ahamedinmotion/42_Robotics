import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unlockAchievement } from "@/lib/achievements";
import { ok, err } from "@/lib/api";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { key } = await req.json();
		if (!key) return err("Achievement key is required", 400);

		const result = await unlockAchievement(session.user.id, key);
		return ok(result);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
