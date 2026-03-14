import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EvaluationForm } from "@/components/evaluations/EvaluationForm";

export default async function EvaluationPage({
	params,
}: {
	params: { id: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	// Verify slot ownership
	const slot = await prisma.evaluationSlot.findUnique({
		where: { id: params.id },
		include: { team: true },
	});

	if (!slot) redirect("/evaluations");
	if ((slot as any).claimedById !== session.user.id) redirect("/evaluations");
	if (slot.status === "COMPLETED" as any) redirect("/evaluations");

	return (
		<div className="min-h-screen bg-background text-text-primary">
			<EvaluationForm slotId={params.id} />
		</div>
	);
}
