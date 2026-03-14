import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user || !(session.user as any).isAdmin) {
			return err("Unauthorized", 401);
		}

		// 1. Live evaluations feed
		const liveEvaluations = await (prisma as any).evaluation.findMany({
			include: {
				evaluator: { select: { id: true, name: true, login: true, image: true } },
				team: { select: { id: true, name: true, project: { select: { title: true } } } },
				slot: true,
			},
			orderBy: { updatedAt: "desc" },
			take: 20,
		});

		// 2. Anomalies
		const anomalies = await (prisma as any).evaluation.findMany({
			where: { isAnomaly: true },
			include: {
				evaluator: { select: { id: true, name: true, login: true } },
				team: { select: { id: true, name: true, project: { select: { title: true } } } },
			},
			orderBy: { updatedAt: "desc" },
			take: 20,
		});

		// 3. Evaluator Health (simplistic aggregator)
		const evaluators = await (prisma as any).user.findMany({
			where: { evaluationsGiven: { some: {} } },
			select: {
				id: true,
				name: true,
				login: true,
				image: true,
				evaluationsGiven: {
					select: {
						status: true,
						isAnomaly: true,
						durationSeconds: true,
					}
				}
			}
		});

		const healthScores = evaluators.map((ev: any) => {
			const evaluationsGiven = (ev as any).evaluationsGiven || [];
			const total = evaluationsGiven.length;
			const completed = evaluationsGiven.filter((e: any) => e.status === "COMPLETED").length;
			const anomaliesCount = evaluationsGiven.filter((e: any) => e.isAnomaly).length;
			const avgDuration = evaluationsGiven.reduce((acc: number, e: any) => acc + (e.durationSeconds || 0), 0) / (total || 1);

			return {
				id: ev.id,
				name: ev.name,
				login: ev.login,
				image: ev.image,
				total,
				completed,
				anomaliesCount,
				avgDuration: Math.round(avgDuration),
				health: total > 0 ? Math.max(0, 100 - (anomaliesCount / total * 100)) : 100
			};
		}).sort((a: any, b: any) => a.health - b.health);

		return ok({
			liveEvaluations,
			anomalies,
			healthScores: healthScores.slice(0, 10), // Worst 10 for dashboard attention
		});
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const permissions = (session?.user as any).permissions || [];
		if (!permissions.includes("CAN_OVERRIDE_EVALUATIONS") && session?.user?.role !== "PRESIDENT") {
			return err("Missing CAN_OVERRIDE_EVALUATIONS permission", 403);
		}

		const { evaluationId, teamId, action, data } = await req.json();

		if (action === "OVERRIDE_SCORE" && evaluationId) {
			const updated = await (prisma as any).evaluation.update({
				where: { id: evaluationId },
				data: {
					totalScore: data.score,
					passed: data.passed,
					anomalyNote: `${data.note} (Overridden by ${session?.user?.name})`,
					isAnomaly: false, // Clear flag after review
				}
			});
			return ok(updated);
		}

		if (action === "APPROVE_ATTEMPT" && teamId) {
			const updated = await prisma.team.update({
				where: { id: teamId },
				data: { nextAttemptApproved: true } as any
			});
			return ok(updated);
		}

		return err("Invalid action", 400);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}
