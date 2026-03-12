import prisma from "@/lib/prisma";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export async function AdminQueueSection() {
	const [fabReqs, matReqs, proposals, conflictFlags, damageReports] = await Promise.all([
		prisma.fabricationRequest.findMany({
			where: { status: "PENDING" },
			include: { user: { select: { name: true, login: true } }, team: { select: { id: true } } },
		}),
		prisma.materialRequest.findMany({
			where: { status: "PENDING" },
			include: { team: { include: { project: { select: { title: true } } } }, requestedBy: { select: { name: true } } },
		}),
		prisma.projectProposal.findMany({
			where: { status: "PENDING" },
			include: { proposedBy: { select: { name: true, currentRank: true } } },
		}),
		prisma.conflictFlag.findMany({
			where: { status: "OPEN" },
			select: { id: true, teamId: true, description: true, status: true, createdAt: true, moderatorNote: true, team: { select: { project: { select: { title: true } } } } },
		}),
		prisma.damageReport.findMany({
			where: { status: { in: ["REPORTED", "UNDER_REVIEW"] } },
			include: { reportedBy: { select: { name: true } } },
		}),
	]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapFab = (f: any) => ({
		id: f.id, userName: f.user.name, userLogin: f.user.login, machineType: f.machineType,
		purpose: f.purpose, estimatedTime: f.estimatedMinutes, material: f.material,
		modelFileUrl: f.modelFileUrl, status: f.status,
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapMat = (m: any) => ({
		id: m.id, teamName: m.teamId, projectTitle: m.team.project.title,
		itemName: m.itemName, quantity: m.quantity, estimatedCost: m.estimatedCost,
		justification: m.justification, status: m.status,
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapProp = (p: any) => ({
		id: p.id, proposedByName: p.proposedBy.name, proposedByRank: p.proposedBy.currentRank,
		title: p.title, proposedRank: p.proposedRank, description: p.description,
		learningObjectives: p.learningObjectives, buildPlan: p.buildPlan, status: p.status,
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapConf = (c: any) => ({
		id: c.id, teamName: c.teamId, projectTitle: c.team.project.title,
		description: c.description, status: c.status,
		createdAt: c.createdAt.toISOString(), moderatorNote: c.moderatorNote,
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapDam = (d: any) => ({
		id: d.id, reporterName: d.reportedBy.name, itemDescription: d.itemName,
		estimatedValue: d.estimatedValue, description: d.description, status: d.status,
	});

	return (
		<ModerationQueue
			fabrication={fabReqs.map(mapFab)}
			materials={matReqs.map(mapMat)}
			proposals={proposals.map(mapProp)}
			conflicts={conflictFlags.map(mapConf)}
			damage={damageReports.map(mapDam)}
		/>
	);
}
