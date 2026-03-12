import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

// DELETE — remove an announcement
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ANNOUNCEMENTS");
		if (auth instanceof Response) return auth;

		const { id } = params;
		if (!id) return err("ID is required", 400);

		await (prisma as any).announcement.delete({ where: { id } });

		return ok({ success: true });
	} catch (error: any) {
		console.error("Announcement DELETE Error:", error);
		if (error.code === 'P2025') {
			return err("Announcement not found", 404);
		}
		return err("Internal Server Error", 500);
	}
}
