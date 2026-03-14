import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

// POST /api/teams/[id]/actions
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const userId = session.user.id;
		const { action, ...payload } = await req.json();

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: { members: true },
		});

		if (!team) return err("Team not found", 404);

		const member = team.members.find(m => m.userId === userId);
		const isAdmin = !!(session.user as any).isAdmin;

		if (!member && !isAdmin) {
			return err("Forbidden. You are not a member of this team", 403);
		}

		switch (action) {
			case "confirm-abandon":
				if (!member) return err("Only team members can confirm abandonment", 403);
				
				await prisma.teamMember.update({
					where: { teamId_userId: { teamId, userId } },
					data: { abandonConfirmed: true },
				});

				// Check if all members confirmed
				const updatedMembers = await prisma.teamMember.findMany({
					where: { teamId },
				});
				const allConfirmed = updatedMembers.every(m => m.abandonConfirmed);

				if (allConfirmed) {
					await prisma.team.update({
						where: { id: teamId },
						data: { status: "ABANDONED" as TeamStatus },
					});
					return ok({ message: "Team status updated to ABANDONED", allConfirmed: true });
				}
				return ok({ message: "Abandonment confirmed", allConfirmed: false });

			case "request-extension":
				if (team.isExtensionGranted) return err("Extension already granted", 400);
				if (!payload.reason) return err("Reason is required", 400);

				const extension = await prisma.extensionRequest.create({
					data: {
						teamId,
						reason: payload.reason,
					},
				});
				return ok(extension);

			case "raise-dispute":
				if (!payload.reason || !payload.evidence) return err("Reason and evidence are required", 400);

				const dispute = await prisma.evaluationDispute.create({
					data: {
						teamId,
						reason: payload.reason,
						evidence: payload.evidence,
					},
				});
				return ok(dispute);

			default:
				return err("Invalid action", 400);
		}
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
