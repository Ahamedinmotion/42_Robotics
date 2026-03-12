import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_MANAGE_LAB_ACCESS");
	if (auth instanceof Response) return auth;

	try {
		const { flagged } = await req.json();
		if (typeof flagged !== "boolean") return err("flagged must be boolean", 400);

		const updated = await prisma.labAccessLog.update({
			where: { id: params.id },
			data: { flagged },
			select: { id: true, flagged: true },
		});
		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
