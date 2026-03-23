import { err } from "@/lib/api";

export async function GET() {
	return err("Method not allowed", 405);
}

export async function POST() {
	return err("Method moved to /api/evaluations/availability", 410);
}
