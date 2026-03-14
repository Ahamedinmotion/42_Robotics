import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

// GET /api/teams/[id]/post-mortem
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const userId = session.user.id;

		const postMortem = await (prisma as any).projectPostMortem.findUnique({
			where: { teamId_userId: { teamId, userId } },
		});

		return ok(postMortem);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

// POST /api/teams/[id]/post-mortem
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const userId = session.user.id;
		const body = await req.json();
		const { whatWorked, whatDidnt, wouldDoBetter } = body;

		if (!whatWorked || !whatDidnt || !wouldDoBetter) {
			return err("All fields are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			select: { projectId: true, status: true, members: { where: { userId } } }
		});

		if (!team || team.members.length === 0) {
			return err("You are not a member of this team", 403);
		}

		if (team.status !== "COMPLETED") {
			return err("Post-mortem can only be submitted for completed projects", 400);
		}

		const postMortem = await (prisma as any).projectPostMortem.create({
			data: {
				teamId,
				userId,
				projectId: team.projectId,
				whatWorked,
				whatDidnt,
				wouldDoBetter,
			},
		});

		return ok(postMortem);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
