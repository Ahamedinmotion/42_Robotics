import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { QuoteBar } from "@/components/profile/QuoteBar";
import { AnnouncementBanners } from "@/components/home/AnnouncementBanners";
import { UserOverview } from "@/components/home/UserOverview";
import { ActiveProjectCard } from "@/components/home/ActiveProjectCard";
import { NotificationPanel } from "@/components/home/NotificationPanel";
import { WorkshopSidebar } from "@/components/home/WorkshopSidebar";
import { RecentAchievements } from "@/components/home/RecentAchievements";
import { MissionTicker } from "@/components/home/MissionTicker";
import { BirthdaySection } from "@/components/home/BirthdaySection";
import { UpcomingEvaluations } from "@/components/home/UpcomingEvaluations";

export default async function HomePage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const userId = session.user.id;

	return (
		<>
			<QuoteBar />
			<div className="space-y-6">
				<AnnouncementBanners />
				
				{/* Identity Strip */}
				<Suspense fallback={<div className="h-12 w-full animate-pulse rounded-lg bg-panel2" />}>
					<UserOverview userId={userId} />
				</Suspense>

				<Suspense fallback={null}>
					<UpcomingEvaluations />
				</Suspense>

				<Suspense fallback={<div className="h-4 w-1/2 animate-pulse rounded bg-panel2" />}>
					<MissionTicker userId={userId} />
				</Suspense>

				<Suspense fallback={null}>
					<BirthdaySection userId={userId} />
				</Suspense>

				{/* 3-Column Grid */}
				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{/* Left Column (2/3) */}
					<div className="space-y-6 md:col-span-2">
						<Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-panel" />}>
							<ActiveProjectCard userId={userId} />
						</Suspense>

						<Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-panel" />}>
							<NotificationPanel userId={userId} />
						</Suspense>
					</div>

					{/* Right Column (1/3) */}
					<div className="space-y-6">
						<Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-panel" />}>
							<RecentAchievements userId={userId} />
						</Suspense>

						<Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-panel" />}>
							<WorkshopSidebar userId={userId} />
						</Suspense>
					</div>
				</div>
			</div>
		</>
	);
}
