// GET /api/admin/members/waitlist

import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_WAITLIST");
		if (auth instanceof Response) return auth;

		const waitlist = await prisma.user.findMany({
			where: {
				status: Status.WAITLIST,
			},
			orderBy: {
				joinedAt: "asc",
			},
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				joinedAt: true,
				currentRank: true,
			}
		});

		return ok(waitlist);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
