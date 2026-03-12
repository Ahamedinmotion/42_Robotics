import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { WorkshopRsvpButton } from "@/components/home/WorkshopRsvpButton";

function formatEventDate(date: Date) {
	return new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export async function WorkshopSidebar({ userId }: { userId: string }) {
	const now = new Date();
	
	const workshops = await prisma.workshop.findMany({
		where: { scheduledAt: { gt: now } },
		orderBy: { scheduledAt: "asc" },
		take: 2,
		include: {
			host: { select: { name: true, login: true } },
			rsvps: { where: { status: "GOING" } },
		},
	});

	// Check user RSVP status for each workshop
	const userRsvps = await prisma.workshopRSVP.findMany({
		where: { userId, workshopId: { in: workshops.map((w) => w.id) } },
	});
	const rsvpMap = new Map(userRsvps.map((r) => [r.workshopId, r.status]));

	return (
		<div className="space-y-6">
			{/* Upcoming Events */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Upcoming
				</h3>
				{workshops.length === 0 ? (
					<p className="text-sm italic text-text-muted">Nothing scheduled</p>
				) : (
					<div className="space-y-3">
						{workshops.slice(0, 1).map((w) => (
							<div key={w.id} className="rounded-lg bg-panel2 p-3">
								<p className="text-sm font-semibold text-text-primary">{w.title}</p>
								<p className="text-xs text-text-muted">{formatEventDate(w.scheduledAt)}</p>
								<p className="text-xs text-text-muted">{w.host.name}</p>
							</div>
						))}
					</div>
				)}
			</Card>

			{/* Workshop Feed */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Workshops
				</h3>
				{workshops.length === 0 ? (
					<p className="text-sm italic text-text-muted">No workshops scheduled</p>
				) : (
					<ul className="space-y-4">
						{workshops.map((w) => (
							<li key={w.id} className="space-y-1">
								<p className="text-sm font-bold text-text-primary">{w.title}</p>
								<p className="text-xs text-text-muted">Host: {w.host.name}</p>
								<p className="text-xs text-text-muted">
									{formatEventDate(w.scheduledAt)}
								</p>
								<div className="flex items-center justify-between">
									<p className="text-xs text-text-muted">
										{w.rsvps.length} attending
									</p>
									<WorkshopRsvpButton
										workshopId={w.id}
										initialStatus={
											(rsvpMap.get(w.id) as "GOING" | "NOT_GOING") ?? null
										}
									/>
								</div>
							</li>
						))}
					</ul>
				)}
				<p className="text-xs text-text-muted">
					Workshops are separate from the cursus. No rank implications.
				</p>
			</Card>
		</div>
	);
}
