import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getClubSettings } from "@/lib/club-settings";
import { requirePermission } from "@/lib/admin-auth";

export async function GET() {
	try {
		const settings = await getClubSettings();
		return ok(settings);
	} catch (error) {
		console.error("Settings GET Error:", error);
		return err("Internal Server Error", 500);
	}
}

export async function PUT(req: Request) {
	try {
		const auth = await requirePermission("CAN_MANAGE_CLUB_SETTINGS");
		if (auth instanceof Response) return auth;

		const body = await req.json();

		// Validate numeric fields
		const intFields: Record<string, number | undefined> = {
			maxActiveMembers: body.maxActiveMembers,
			defaultBlackholeDays: body.defaultBlackholeDays,
			minTeamSize: body.minTeamSize,
			maxTeamSize: body.maxTeamSize,
			evalCooldownHours: body.evalCooldownHours,
			antiSnipeMinutes: body.antiSnipeMinutes,
		};

		for (const [key, val] of Object.entries(intFields)) {
			if (val !== undefined && (typeof val !== "number" || val < 0)) {
				return err(`Invalid value for ${key}`, 400);
			}
		}

		if (body.minTeamSize !== undefined && body.maxTeamSize !== undefined) {
			if (body.minTeamSize > body.maxTeamSize) {
				return err("minTeamSize cannot exceed maxTeamSize", 400);
			}
		}

		// Build update data — only include fields that were sent
		const data: Record<string, unknown> = {};
		const allowedStringFields = [
			"clubName", "clubTagline", "labOpenTime", "labCloseTime", "maintenanceMessage",
		];
		const allowedIntFields = [
			"maxActiveMembers", "defaultBlackholeDays", "minTeamSize", "maxTeamSize",
			"evalCooldownHours", "antiSnipeMinutes",
		];
		const allowedBoolFields = ["allowAlumniEvals", "maintenanceMode"];

		for (const f of allowedStringFields) {
			if (body[f] !== undefined) data[f] = String(body[f]);
		}
		for (const f of allowedIntFields) {
			if (body[f] !== undefined) data[f] = Number(body[f]);
		}
		for (const f of allowedBoolFields) {
			if (body[f] !== undefined) data[f] = Boolean(body[f]);
		}

		data.updatedById = auth.user.id;

		const updated = await prisma.clubSettings.upsert({
			where: { id: "singleton" },
			update: data,
			create: { id: "singleton", ...data },
		});

		// Audit log
		await prisma.adminAuditLog.create({
			data: {
				actorId: auth.user.id,
				action: "UPDATE_SETTINGS",
				details: JSON.stringify(data),
			},
		});

		return ok(updated);
	} catch (error) {
		console.error("Settings PUT Error:", error);
		return err("Internal Server Error", 500);
	}
}
