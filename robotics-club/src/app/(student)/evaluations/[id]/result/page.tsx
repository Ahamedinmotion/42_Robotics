import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EvaluationResult } from "@/components/evaluations/EvaluationResult";

export default async function ResultPage({
	params,
}: {
	params: { id: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	// Basic authorization check on server
	const evaluation = await prisma.evaluation.findUnique({
		where: { id: params.id },
		include: { team: { include: { members: true } } },
	});

	if (!evaluation) redirect("/cursus");

	const isMember = (evaluation as any).team.members.some((m: any) => m.userId === session.user.id);
	const isEvaluator = evaluation.evaluatorId === session.user.id;
	const isAdmin = (session.user as any).isAdmin;

	if (!isMember && !isEvaluator && !isAdmin) redirect("/cursus");

	return (
		<div className="min-h-screen bg-background">
			<span className="hidden">Debug: ID is {params.id}</span>
			<EvaluationResult evaluationId={params.id} />
		</div>
	);
}
