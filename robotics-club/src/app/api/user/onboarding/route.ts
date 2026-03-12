import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const { hasSeenIntro, hasSeenWaitlistModal } = body;

		const updateData: any = {};
		if (typeof hasSeenIntro === "boolean") updateData.hasSeenIntro = hasSeenIntro;
		if (typeof hasSeenWaitlistModal === "boolean") updateData.hasSeenWaitlistModal = hasSeenWaitlistModal;

		if (Object.keys(updateData).length === 0) {
			return new NextResponse("Bad Request", { status: 400 });
		}

		await prisma.user.update({
			where: { id: session.user.id },
			data: updateData,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[ONBOARDING_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
