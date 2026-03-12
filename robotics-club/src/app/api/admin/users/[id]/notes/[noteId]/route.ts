import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

// DELETE /api/admin/users/[id]/notes/[noteId]
export async function DELETE(req: Request, { params }: { params: { id: string; noteId: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const { noteId } = params;
		
		await prisma.adminNote.delete({
			where: { id: noteId },
		});

		return ok({ deleted: true });
	} catch (error: any) {
		return err(error.message, 500);
	}
}
