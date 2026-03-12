import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Neon DB Keepalive / Ping
 * Hit this route periodically (e.g. every 4 minutes) to keep the DB connection warm.
 */
export async function GET() {
	try {
		// A simple query to touch the database
		const count = await prisma.user.count();
		
		return NextResponse.json({ 
			success: true, 
			timestamp: new Date().toISOString(),
			ping: "pong",
			dbCount: count
		});
	} catch (error: any) {
		console.error("Keepalive Error:", error);
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
