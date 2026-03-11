import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET /api/admin/achievements — list all
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || session.user.role === Role.STUDENT) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const achievements = await prisma.achievement.findMany({
		orderBy: { title: "asc" },
	});

	return NextResponse.json(achievements);
}

// POST /api/admin/achievements — create
export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	const allowedRoles = [Role.PRESIDENT, Role.VP, Role.SECRETARY];
	if (!session?.user?.id || !allowedRoles.includes(session.user.role as any)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await req.json();
		const { key, title, description, icon, unlockedTitleId } = body;

		if (!key || !title || !description || !icon) {
			return NextResponse.json({ error: "All fields required" }, { status: 400 });
		}

		const achievement = await (prisma as any).achievement.create({
			data: { 
				key, title, description, icon,
				unlockedTitleId: unlockedTitleId || null
			},
		});

		return NextResponse.json(achievement, { status: 201 });
	} catch (error: any) {
		if (error.code === "P2002") {
			return NextResponse.json({ error: "Achievement key already exists" }, { status: 409 });
		}
		return NextResponse.json({ error: "Failed to create achievement" }, { status: 500 });
	}
}
