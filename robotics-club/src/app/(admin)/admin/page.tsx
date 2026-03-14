import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { AdminMembersSection } from "@/components/admin/sections/AdminMembersSection";
import { AdminQueueSection } from "@/components/admin/sections/AdminQueueSection";
import { AdminAnalyticsSection } from "@/components/admin/sections/AdminAnalyticsSection";
import { AdminContentSection } from "@/components/admin/sections/AdminContentSection";
import { AdminAccessSection } from "@/components/admin/sections/AdminAccessSection";
import { MoodBoard } from "@/components/admin/MoodBoard";
import { AchievementEditor } from "@/components/admin/AchievementEditor";
import { AuditLogView } from "@/components/admin/AuditLogView";
import { ClubSettingsPanel } from "@/components/admin/ClubSettingsPanel";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import { RoleManagement } from "@/components/admin/RoleManagement";

import { AdminOversight } from "@/components/admin/evaluations/AdminOversight";

export default async function AdminPage({
	searchParams,
}: {
	searchParams: { section?: string };
}) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/login");

	const isAdmin = !!(session.user as any).isAdmin;
	if (!isAdmin) redirect("/home");

	const section = searchParams.section || "members";
	const userRole = session.user.role;
	const permissions = ((session.user as any).permissions as string[]) || [];

	return (
		<div className="space-y-6">
			{section === "members" && (
				<Suspense fallback={<AdminSectionSkeleton />}>
					<AdminMembersSection />
				</Suspense>
			)}
			{section === "queue" && (
				<Suspense fallback={<AdminSectionSkeleton />}>
					<AdminQueueSection />
				</Suspense>
			)}
			{section === "analytics" && (
				<Suspense fallback={<AdminSectionSkeleton />}>
					<AdminAnalyticsSection />
				</Suspense>
			)}
			{section === "content" && (
				<Suspense fallback={<AdminSectionSkeleton />}>
					<AdminContentSection userRole={userRole} />
				</Suspense>
			)}
			{section === "oversight" && (
				<Suspense fallback={<AdminSectionSkeleton />}>
					<AdminOversight userRole={userRole} permissions={permissions} />
				</Suspense>
			)}
			{section === "access" && (
				<Suspense fallback={<AdminSectionSkeleton />}>
					<AdminAccessSection userRole={userRole} permissions={permissions} />
				</Suspense>
			)}
			{section === "board" && <MoodBoard />}
			{section === "achievements" && <AchievementEditor />}
			{section === "announce" && (permissions.includes("CAN_SEND_ANNOUNCEMENTS") || permissions.includes("CAN_MANAGE_ANNOUNCEMENTS")) && (
				<AnnouncementManager />
			)}
			{section === "audit" && permissions.includes("CAN_MANAGE_ROLES") && <AuditLogView />}
			{section === "roles" && permissions.includes("CAN_MANAGE_ROLES") && (
				<RoleManagement currentUserId={session.user.id} />
			)}
			{section === "settings" && permissions.includes("CAN_MANAGE_CLUB_SETTINGS") && (
				<ClubSettingsPanel />
			)}
			
			{!["members", "queue", "analytics", "content", "oversight", "access", "board", "achievements", "announce", "audit", "roles", "settings"].includes(section) && (
				redirect("/admin?section=members")
			)}
		</div>
	);
}

function AdminSectionSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="h-64 w-full rounded-xl bg-panel" />
			<div className="h-96 w-full rounded-xl bg-panel" />
		</div>
	);
}
