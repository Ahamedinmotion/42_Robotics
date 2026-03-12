import prisma from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { NotificationList } from "@/components/home/NotificationList";

export async function NotificationPanel({ userId }: { userId: string }) {
	const now = new Date();
	
	const [unreadNotifications, unreadCount] = await Promise.all([
		prisma.notification.findMany({
			where: { userId, readAt: null, deliverAt: { lte: now } },
			orderBy: { createdAt: "desc" },
			take: 5,
		}),
		prisma.notification.count({
			where: { userId, readAt: null, deliverAt: { lte: now } },
		}),
	]);

	return (
		<Card className="space-y-3">
			<div className="flex items-center gap-2">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
					Notifications
				</h3>
				{unreadCount > 0 && (
					<span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-urgency px-1.5 text-[10px] font-bold text-white">
						{unreadCount}
					</span>
				)}
			</div>
			<NotificationList
				notifications={unreadNotifications.map((n) => ({
					id: n.id,
					type: n.type,
					title: n.title,
					body: n.body,
					createdAt: n.createdAt.toISOString(),
					readAt: n.readAt?.toISOString() ?? null,
				}))}
			/>
		</Card>
	);
}
