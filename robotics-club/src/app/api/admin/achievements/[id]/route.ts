import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const auth = await requirePermission("CAN_EDIT_CONTENT");
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const { title, description, icon } = body;

		const updated = await prisma.achievement.update({
			where: { id: params.id },
			data: { title, description, icon },
		});

		return NextResponse.json(updated);
	} catch (error: any) {
		return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 });
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const auth = await requirePermission("CAN_EDIT_CONTENT");
	if (auth instanceof Response) return auth;

	try {
		await prisma.achievement.delete({
			where: { id: params.id },
		});
		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json({ error: "Failed to delete achievement" }, { status: 500 });
	}
}
