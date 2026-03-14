import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { searchParams } = new URL(req.url);
		const sessionId = searchParams.get("id");

		if (sessionId) {
			const calibration = await (prisma as any).calibrationSession.findUnique({
				where: { id: sessionId },
				include: { responses: true }
			});
			return ok(calibration);
		}

		const sessions = await (prisma as any).calibrationSession.findMany({
			orderBy: { createdAt: "desc" }
		});
		return ok(sessions);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user || !(session.user as any).isAdmin) {
			return err("Unauthorized", 401);
		}

		const { projectId, sheetId, title, description, dummySubmission } = await req.json();

		const newCalibration = await (prisma as any).calibrationSession.create({
			data: {
				projectId,
				sheetId,
				title,
				description,
				dummySubmission,
				isActive: true,
			}
		});

		return ok(newCalibration);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
