import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — list feature requests with vote counts
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const requests = await prisma.featureRequest.findMany({
		orderBy: { createdAt: "desc" },
		include: {
			user: { select: { login: true, name: true } },
			_count: { select: { votes: true } },
		},
	});

	// Check which ones the current user has voted for
	const votedIds = await prisma.featureRequestVote.findMany({
		where: { userId: session.user.id },
		select: { requestId: true },
	});
	const votedSet = new Set(votedIds.map((v: { requestId: string }) => v.requestId));

	return NextResponse.json(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		requests.map((r: any) => ({
			id: r.id,
			title: r.title,
			description: r.description,
			status: r.status,
			createdAt: r.createdAt.toISOString(),
			authorLogin: r.user.login,
			authorName: r.user.name,
			voteCount: r._count.votes,
			hasVoted: votedSet.has(r.id),
			isOwner: r.userId === session.user.id,
		}))
	);
}

// POST — create a feature request
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json();
	const { title, description } = body;

	if (!title || !description) {
		return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
	}

	const request = await prisma.featureRequest.create({
		data: {
			userId: session.user.id,
			title: title.slice(0, 200),
			description: description.slice(0, 2000),
		},
	});

	return NextResponse.json(request, { status: 201 });
}

// PATCH — vote/unvote, or update status (admin only)
export async function PATCH(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json();

	// Vote toggle
	if (body.action === "vote") {
		const { requestId } = body;
		if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

		const existing = await prisma.featureRequestVote.findUnique({
			where: { userId_requestId: { userId: session.user.id, requestId } },
		});

		if (existing) {
			await prisma.featureRequestVote.delete({ where: { id: existing.id } });
			return NextResponse.json({ voted: false });
		} else {
			await prisma.featureRequestVote.create({
				data: { userId: session.user.id, requestId },
			});
			return NextResponse.json({ voted: true });
		}
	}

	// Status update (admin only)
	if (body.action === "status") {
		if (session.user.role === "STUDENT") {
			return NextResponse.json({ error: "Admin only" }, { status: 403 });
		}

		const { requestId, status } = body;
		if (!requestId || !status) {
			return NextResponse.json({ error: "requestId and status required" }, { status: 400 });
		}

		const updated = await prisma.featureRequest.update({
			where: { id: requestId },
			data: { status },
		});

		return NextResponse.json(updated);
	}

	return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
