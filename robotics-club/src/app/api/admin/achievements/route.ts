import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

// GET /api/admin/achievements — list all
export async function GET() {
	const auth = await requirePermission("CAN_EDIT_CONTENT");
	if (auth instanceof Response) return auth;

	const achievements = await prisma.achievement.findMany({
		orderBy: { title: "asc" },
	});

	return NextResponse.json(achievements);
}

// POST /api/admin/achievements — create
export async function POST(req: Request) {
	const auth = await requirePermission("CAN_EDIT_CONTENT");
	if (auth instanceof Response) return auth;

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
