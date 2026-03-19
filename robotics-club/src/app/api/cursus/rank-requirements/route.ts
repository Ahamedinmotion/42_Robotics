import { NextResponse } from "next/server";
import { getRankRequirements } from "@/lib/rank-requirements";
import { Rank } from "@prisma/client";

export async function GET() {
	try {
        const RANKS: Rank[] = ["E", "D", "C", "B", "A", "S"];
        const data = await Promise.all(RANKS.map(async (r) => {
            const req = await getRankRequirements(r);
            return {
                rank: r,
                projectsRequired: req.requirement.projectsRequired,
                requiredProjectCount: req.requiredProjectCount
            };
        }));
		return NextResponse.json({ ok: true, data });
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}
