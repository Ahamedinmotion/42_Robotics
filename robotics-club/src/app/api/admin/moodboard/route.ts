import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

// GET — list all mood board notes
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const permissions = (session.user as any).permissions as string[] || [];
	if (permissions.length === 0) return NextResponse.json({ error: "Admin only" }, { status: 403 });

	const notes = await prisma.moodBoardNote.findMany({
		orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
		include: { author: { select: { login: true, name: true } } },
	});

	return NextResponse.json(notes);
}

// POST — create a new note
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const permissions = (session.user as any).permissions as string[] || [];
	if (permissions.length === 0) return NextResponse.json({ error: "Admin only" }, { status: 403 });

	const body = await req.json();
	const { content, color } = body;

	if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

	const note = await prisma.moodBoardNote.create({
		data: {
			authorId: session.user.id,
			content: content.slice(0, 500),
			color: color || "#FFD700",
		},
	});

	return NextResponse.json(note, { status: 201 });
}

// DELETE — delete a note
export async function DELETE(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await req.json();
	if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

	const note = await prisma.moodBoardNote.findUnique({ where: { id } });
	if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

	// Only the author or someone with CAN_MANAGE_ROLES can delete
	const permissions = (session.user as any).permissions as string[] || [];
	if (note.authorId !== session.user.id && !hasPermission(permissions, "CAN_MANAGE_ROLES")) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	await prisma.moodBoardNote.delete({ where: { id } });
	return NextResponse.json({ ok: true });
}

// PATCH — toggle pin
export async function PATCH(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const permissions = (session.user as any).permissions as string[] || [];
	if (permissions.length === 0) return NextResponse.json({ error: "Admin only" }, { status: 403 });

	const { id, pinned } = await req.json();
	if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

	const note = await prisma.moodBoardNote.update({
		where: { id },
		data: { pinned: !!pinned },
	});

	return NextResponse.json(note);
}
