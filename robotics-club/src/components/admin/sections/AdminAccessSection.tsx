import prisma from "@/lib/prisma";
import { AccessSecurity } from "@/components/admin/AccessSecurity";

export async function AdminAccessSection({ userRole, permissions }: { userRole: string, permissions: string[] }) {
	const [logs, flaggedCount, membersWithAccess] = await Promise.all([
		prisma.labAccessLog.findMany({
			take: 50, orderBy: { createdAt: "desc" },
			include: { user: { select: { name: true, login: true, image: true } } },
		}),
		prisma.labAccessLog.count({ where: { flagged: true } }),
		prisma.user.findMany({
			where: { labAccessEnabled: true },
			select: { id: true, login: true, name: true, image: true },
			orderBy: { login: "asc" }
		})
	]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapLog = (l: any) => ({
		id: l.id, userName: l.user.name, userLogin: l.user.login,
		userImage: l.user.image, method: l.method, success: l.success,
		flagged: l.flagged, note: l.note, timestamp: l.createdAt.toISOString(),
	});

	return (
		<AccessSecurity
			logs={logs.map(mapLog)}
			flaggedCount={flaggedCount}
			membersWithAccess={membersWithAccess}
			labAccessCount={membersWithAccess.length}
			userRole={userRole}
			permissions={permissions}
		/>
	);
}
