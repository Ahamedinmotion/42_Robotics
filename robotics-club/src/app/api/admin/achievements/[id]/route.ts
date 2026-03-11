import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const session = await getServerSession(authOptions);
	const allowedRoles = [Role.PRESIDENT, Role.VP, Role.SECRETARY];
	if (!session?.user?.id || !allowedRoles.includes(session.user.role as any)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

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
	const session = await getServerSession(authOptions);
	const allowedRoles = [Role.PRESIDENT, Role.VP, Role.SECRETARY];
	if (!session?.user?.id || !allowedRoles.includes(session.user.role as any)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		await prisma.achievement.delete({
			where: { id: params.id },
		});
		return NextResponse.json({ success: true });
	} catch (error: any) {
		return NextResponse.json({ error: "Failed to delete achievement" }, { status: 500 });
	}
}
