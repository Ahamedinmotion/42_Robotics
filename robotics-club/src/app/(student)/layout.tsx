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
				image: (session.user as { image?: string | null }).image ?? null,
				activeTheme: session.user.activeTheme ?? "FORGE",
				role: session.user.role,
				isImpersonating: (session.user as any).isImpersonating,
			}}
		>
			{children}
		</StudentLayout>
	);
}
