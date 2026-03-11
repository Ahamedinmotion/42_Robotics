import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FeatureRequestList } from "@/components/feature-requests/FeatureRequestList";

export const metadata: Metadata = {
	title: "Feature Requests — Robotics Club",
	description: "Suggest and vote on new features for the club platform",
};

export default async function FeatureRequestsPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const isAdmin = session.user.role !== "STUDENT";

	return <FeatureRequestList isAdmin={isAdmin} />;
}
