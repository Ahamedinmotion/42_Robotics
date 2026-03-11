import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id || session.user.role !== "PRESIDENT") {
			return err("Unauthorized", 401);
		}

		const { id } = params;
		if (!id) return err("ID is required", 400);

		await (prisma as any).title.delete({ where: { id } });

		return ok({ success: true });
	} catch (error) {
		console.error("Title DELETE Error:", error);
		return err("Internal Server Error", 500);
	}
}
