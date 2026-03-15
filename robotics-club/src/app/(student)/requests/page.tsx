import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RequestsDashboard } from "@/components/requests/RequestsDashboard";

export const metadata: Metadata = {
	title: "Requests Dashboard — Robotics Club",
	description: "Manage feature suggestions, material orders, and fabrication jobs",
};

export default async function RequestsPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const isAdmin = session.user.role !== "STUDENT";

	return <RequestsDashboard isAdmin={isAdmin} />;
}
