import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EvaluationsPage from "@/components/evaluations/EvaluationsPage";

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		redirect("/login");
	}

	return <EvaluationsPage />;
}
