import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requireAdmin(["SECRETARY", "VP", "PRESIDENT"]);
	if (auth instanceof Response) return auth;

	try {
		const { status, moderatorNote } = await req.json();
		if (!status) return err("status is required", 400);

		await prisma.conflictFlag.update({
			where: { id: params.id },
			data: { status, moderatorNote: moderatorNote || undefined },
		});

		// NEVER return raisedById
		return ok({ success: true });
	} catch (e: any) {
		return err(e.message || "Internal Server Error", 500);
	}
}
