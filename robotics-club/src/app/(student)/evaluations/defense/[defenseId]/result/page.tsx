import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DefenseResultPage } from "@/components/evaluations/DefenseResultPage";

export default async function DefenseResultPageRoute({ params }: { params: { defenseId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	return <DefenseResultPage defenseId={params.defenseId} />;
}
