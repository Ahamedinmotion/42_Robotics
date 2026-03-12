import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_MANAGE_LAB_ACCESS");
	if (auth instanceof Response) return auth;

	try {
		const { enabled } = await req.json();
		if (typeof enabled !== "boolean") return err("enabled must be boolean", 400);

		const updated = await prisma.user.update({
			where: { id: params.id },
			data: { labAccessEnabled: enabled },
			select: { id: true, login: true, labAccessEnabled: true },
		});
		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
