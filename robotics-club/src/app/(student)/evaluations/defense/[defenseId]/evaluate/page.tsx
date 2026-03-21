import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DefenseEvaluationForm } from "@/components/evaluations/DefenseEvaluationForm";

export default async function DefenseEvaluatePage({ params }: { params: { defenseId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	return <DefenseEvaluationForm defenseId={params.defenseId} />;
}
