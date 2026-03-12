import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

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
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

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
