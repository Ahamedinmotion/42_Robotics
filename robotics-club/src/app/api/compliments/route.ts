import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST — send a compliment
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json();
	const { toUserId, message, evaluationId } = body;

	if (!toUserId || !message) {
		return NextResponse.json({ error: "toUserId and message required" }, { status: 400 });
	}

	if (toUserId === session.user.id) {
		return NextResponse.json({ error: "Cannot compliment yourself" }, { status: 400 });
	}

	try {
		const compliment = await prisma.compliment.create({
			data: {
				fromUserId: session.user.id,
				toUserId,
				message: message.slice(0, 500),
				evaluationId: evaluationId || null,
			},
		});
		return NextResponse.json(compliment, { status: 201 });
	} catch (e: any) {
		if (e?.code === "P2002") {
			return NextResponse.json({ error: "You already sent a compliment for this" }, { status: 409 });
		}
		return NextResponse.json({ error: "Failed to send compliment" }, { status: 500 });
	}
}

// GET — get compliments received by the current user
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const compliments = await prisma.compliment.findMany({
		where: { toUserId: session.user.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			message: true,
			createdAt: true,
			// Anonymous — don't expose sender
		},
	});

	return NextResponse.json(compliments);
}
