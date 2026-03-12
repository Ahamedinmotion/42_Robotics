import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";

function StatCard({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="text-center">
			<p className="text-xl font-bold text-accent">{value}</p>
			<p className="text-xs text-text-muted">{label}</p>
		</div>
	);
}

function formatMonthYear(date: Date) {
	return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

export async function UserOverview({ userId }: { userId: string }) {
	const [user, completedTeamsCount] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				currentRank: true,
				joinedAt: true,
				_count: {
					select: {
						evaluationsGiven: { where: { status: "COMPLETED" } },
					},
				},
			},
		}),
		prisma.teamMember.count({
			where: { userId, team: { status: "COMPLETED" } },
		}),
	]);

	if (!user) return null;

	return (
		<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
			<div className="flex items-center gap-4">
				{user.image ? (
					<Image
						src={user.image}
						alt={user.login}
						width={48}
						height={48}
						className="h-12 w-12 rounded-full border border-border-color object-cover"
					/>
				) : (
					<div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-color bg-panel2 text-lg font-bold text-text-muted">
						{user.login.charAt(0).toUpperCase()}
					</div>
				)}
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
						<Badge rank={user.currentRank as "E" | "D" | "C" | "B" | "A" | "S"} size="lg" />
					</div>
					<p className="text-sm text-text-muted">@{user.login}</p>
				</div>
			</div>

			<div className="flex gap-6">
				<StatCard label="Projects" value={completedTeamsCount} />
				<StatCard label="Evals Given" value={user._count.evaluationsGiven} />
				<StatCard label="Rank" value={user.currentRank} />
				<StatCard label="Member Since" value={formatMonthYear(user.joinedAt)} />
			</div>
		</div>
	);
}
