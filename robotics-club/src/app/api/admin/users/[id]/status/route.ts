import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_MANAGE_MEMBERS");
	if (auth instanceof Response) return auth;

	try {
		const { status } = await req.json();
		const allowed = ["WAITLIST", "ACTIVE", "BLACKHOLED"];
		if (!status || !allowed.includes(status)) {
			return err("Invalid status. Cannot set ALUMNI via this route.", 400);
		}

		const updated = await prisma.user.update({
			where: { id: params.id },
			data: { status },
			select: { id: true, login: true, status: true },
		});
		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}
