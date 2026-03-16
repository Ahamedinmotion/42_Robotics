import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string; checkoutId: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { id: teamId, checkoutId } = params;

		// Verify membership
		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});
		
		const isAdmin = (session.user as any).isAdmin;
		if (!member && !isAdmin) return err("Unauthorized", 403);

		// Update checkout
		const checkout = await prisma.checkout.update({
			where: { id: checkoutId, teamId },
			data: {
				status: "RETURNED",
				returnedAt: new Date(),
			},
		});

		return ok(checkout);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
