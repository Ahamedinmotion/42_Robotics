import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function WaitlistPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { status: true, joinedAt: true },
	});
	if (!user || user.status !== "WAITLIST") redirect("/home");

	const position = await prisma.user.count({
		where: { status: "WAITLIST", joinedAt: { lte: user.joinedAt } },
	});

	const activeCount = await prisma.user.count({ where: { status: "ACTIVE" } });

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md space-y-6 rounded-2xl bg-panel p-8 text-center">
				<p className="text-4xl font-bold text-accent">RC</p>

				<h1 className="text-xl font-bold text-text-primary">You&apos;re on the waitlist</h1>

				<p className="text-5xl font-extrabold text-accent">#{position}</p>
				<p className="text-sm text-text-muted">in queue</p>

				<p className="text-sm text-text-muted">
					There are currently <span className="font-semibold text-text-primary">{activeCount} / 30</span> active members.
					You&apos;ll be notified when a spot opens up.
				</p>

				<hr className="border-border-color" />

				<div className="space-y-2 text-left text-xs text-text-muted">
					<p>• Spots open when members complete the cursus, go inactive, or leave.</p>
					<p>• You&apos;ll receive a notification when you&apos;re promoted.</p>
					<p>• Your position is based on when you applied.</p>
				</div>

				<SignOutButton />
			</div>
		</div>
	);
}
