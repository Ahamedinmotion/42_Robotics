import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

// GET /api/admin/users/[id]/notes
export async function GET(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const targetUserId = params.id;
		const notes = await prisma.adminNote.findMany({
			where: { targetUserId },
			include: { author: { select: { login: true } } },
			orderBy: { createdAt: "desc" },
		});

		return ok(notes);
	} catch (error: any) {
		return err(error.message, 500);
	}
}

// POST /api/admin/users/[id]/notes
export async function POST(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const session = await getServerSession(authOptions);
		const authorId = session!.user.id;
		const targetUserId = params.id;
		
		const { body } = await req.json();
		if (!body) return err("Note body is required", 400);

		const note = await prisma.adminNote.create({
			data: {
				targetUserId,
				authorId,
				body,
			},
			include: { author: { select: { login: true } } },
		});

		return ok(note);
	} catch (error: any) {
		return err(error.message, 500);
	}
}
