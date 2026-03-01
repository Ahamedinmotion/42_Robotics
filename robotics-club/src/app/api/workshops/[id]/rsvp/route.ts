// POST and DELETE /api/workshops/[id]/rsvp
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const workshopId = params.id;
		const body = await req.json();
		const status = body.status || "GOING";

		const rsvp = await prisma.workshopRSVP.upsert({
			where: {
				workshopId_userId: { workshopId, userId: session.user.id },
			},
			update: { status },
			create: { workshopId, userId: session.user.id, status },
		});

		return ok(rsvp);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const workshopId = params.id;

		const rsvp = await prisma.workshopRSVP.upsert({
			where: {
				workshopId_userId: { workshopId, userId: session.user.id },
			},
			update: { status: "NOT_GOING" },
			create: { workshopId, userId: session.user.id, status: "NOT_GOING" },
		});

		return ok(rsvp);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}
