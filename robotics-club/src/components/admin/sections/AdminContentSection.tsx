import prisma from "@/lib/prisma";
import { ContentManagement } from "@/components/admin/ContentManagement";

export async function AdminContentSection({ userRole }: { userRole: string }) {
	const projects = await prisma.project.findMany({
		orderBy: [{ rank: "asc" }, { title: "asc" }],
		include: { _count: { select: { teams: true } } },
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapProj = (p: any) => ({
		id: p.id, title: p.title, rank: p.rank, status: p.status,
		teamCount: p._count.teams, description: p.description,
		teamSizeMin: p.teamSizeMin, teamSizeMax: p.teamSizeMax,
		blackholeDays: p.blackholeDays,
		skillTags: (p.skillTags as string[]) || [],
		isUnique: p.isUnique,
		subjectSheetUrl: p.subjectSheetUrl, evaluationSheetUrl: p.evaluationSheetUrl,
	});

	return (
		<ContentManagement
			projects={projects.map(mapProj)}
			userRole={userRole}
		/>
	);
}
