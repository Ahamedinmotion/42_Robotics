import { getUserActiveTeam } from "@/lib/queries/users";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BlackholeTimer } from "@/components/ui/BlackholeTimer";
import Image from "next/image";
import { TeamStatus } from "@prisma/client";

function daysAgo(date: Date | string) {
	const dateObj = new Date(date);
	const diff = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
	if (diff === 0) return "today";
	if (diff === 1) return "1 day ago";
	return `${diff} days ago`;
}

export async function ActiveProjectCard({ userId }: { userId: string }) {
	const activeTeamMember = await getUserActiveTeam(userId);
	const activeTeam = activeTeamMember?.team ?? null;
	const lastReport = activeTeam?.weeklyReports[0] ?? null;

	if (!activeTeam) {
		return (
			<Card className="border-dashed">
				<div className="space-y-2 py-4 text-center">
					<p className="font-semibold text-text-primary">No active project</p>
					<p className="text-sm text-text-muted">
						Head to the Cursus to activate a project and start building.
					</p>
					<Button variant="primary" href="/cursus">
						Browse Projects
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<Card glowing className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h2 className="text-lg font-bold text-text-primary">
						{activeTeam.project.title}
					</h2>
					<Badge rank={activeTeam.project.rank as any} size="sm" />
				</div>
				<span
					className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
						activeTeam.status === TeamStatus.ACTIVE
							? "bg-green-900/40 text-green-400"
							: "bg-orange-900/40 text-orange-400"
					}`}
				>
					{activeTeam.status}
				</span>
			</div>

			{activeTeam.blackholeDeadline && activeTeam.activatedAt && (
				<BlackholeTimer
					deadline={activeTeam.blackholeDeadline}
					activatedAt={activeTeam.activatedAt}
				/>
			)}

			<div>
				<p className="mb-1 text-xs text-text-muted">Team</p>
				<div className="flex -space-x-2">
					{activeTeam.members.map((m) =>
						m.user.image ? (
							<Image
								key={m.user.id}
								src={m.user.image}
								alt={m.user.login}
								title={m.user.login}
								width={24}
								height={24}
								className="h-6 w-6 rounded-full border-2 border-background object-cover"
							/>
						) : (
							<div
								key={m.user.id}
								title={m.user.login}
								className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-panel2 text-[10px] font-bold text-text-muted"
							>
								{m.user.login.charAt(0).toUpperCase()}
							</div>
						)
					)}
				</div>
			</div>

			<div className="flex items-center justify-between border-t border-border-color pt-3">
				<p className="text-xs text-text-muted">
					{lastReport
						? `Last report: ${daysAgo(lastReport.createdAt)}`
						: "No report submitted yet"}
				</p>
				<div className="flex gap-2">
					<Button variant="secondary" size="sm" href="/cursus?tab=project">
						Submit Report
					</Button>
					<Button variant="primary" size="sm" href="/cursus?tab=project">
						View Project
					</Button>
				</div>
			</div>
		</Card>
	);
}
