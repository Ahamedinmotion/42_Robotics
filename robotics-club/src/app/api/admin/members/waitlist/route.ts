// GET /api/admin/members/waitlist
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status } from "@prisma/client";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const allowedRoles = ["SECRETARY", "VP", "PRESIDENT"];
		if (!allowedRoles.includes(session.user.role)) {
			return err("Forbidden", 403);
		}

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
				avatar: true,
				joinedAt: true,
				currentRank: true,
			}
		});

		return ok(waitlist);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
