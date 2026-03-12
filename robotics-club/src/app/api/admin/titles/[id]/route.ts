import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const { id } = params;
		if (!id) return err("ID is required", 400);

		await (prisma as any).title.delete({ where: { id } });

		return ok({ success: true });
	} catch (error) {
		console.error("Title DELETE Error:", error);
		return err("Internal Server Error", 500);
	}
}
