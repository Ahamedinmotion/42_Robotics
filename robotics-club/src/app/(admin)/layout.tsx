import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);

	if (!session?.user) redirect("/login");
	if (!isAdminRole(session.user.role)) redirect("/home");

	return (
		<ToastProvider>
			<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-color bg-background/90 px-4 backdrop-blur-sm">
				<Link href="/admin" className="text-xl font-bold text-accent">
					RC Admin
				</Link>

				<AdminNav userRole={session.user.role} />

				<div className="flex items-center gap-4">
					<span className="text-sm text-text-muted">{session.user.login}</span>
					<Link href="/home" className="text-xs text-text-muted transition-colors hover:text-accent">
						← Student View
					</Link>
				</div>
			</header>

			<main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
		</ToastProvider>
	);
}
