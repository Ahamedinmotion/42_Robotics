import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StudentLayout } from "@/components/layout/StudentLayout";

export default async function StudentGroupLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<StudentLayout
			user={{
				login: session.user.login,
				avatar: (session.user as any).image ?? null,
				activeTheme: session.user.activeTheme ?? "FORGE",
			}}
		>
			{children}
		</StudentLayout>
	);
}
