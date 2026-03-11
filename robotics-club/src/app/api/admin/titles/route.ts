import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id || session.user.role !== "PRESIDENT") {
			return err("Unauthorized", 401);
		}

		const titles = await (prisma as any).title.findMany({
			orderBy: { name: "asc" }
		});

		return ok(titles);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id || session.user.role !== "PRESIDENT") {
			return err("Unauthorized", 401);
		}

		const { name, description } = await req.json();
		if (!name) return err("Name is required", 400);

		const title = await (prisma as any).title.create({
			data: { name, description, isCustom: true }
		});

		return ok(title);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}
