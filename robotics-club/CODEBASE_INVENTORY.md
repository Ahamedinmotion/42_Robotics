# Codebase Exhaustive Inventory\n\n─────────────────────────────────────────\n## 1. PAGES & ROUTES\n- **/src/app/(admin)/admin/page.tsx**
  - Renders: admin Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(admin)/layout.tsx**
  - Renders: Layout
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(auth)/blackholed/page.tsx**
  - Renders: blackholed Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(auth)/login/page.tsx**
  - Renders: LoginPage
  - Auth Required: No explicitly seen
  - Component Type: Client

- **/src/app/(auth)/waitlist/page.tsx**
  - Renders: waitlist Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/cursus/page.tsx**
  - Renders: cursus Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/cursus/projects/[id]/cockpit/page.tsx**
  - Renders: cockpit Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/cursus/projects/[id]/page.tsx**
  - Renders: [id] Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/evaluations/[id]/evaluate/page.tsx**
  - Renders: evaluate Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/evaluations/[id]/result/page.tsx**
  - Renders: result Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/evaluations/defense/[defenseId]/evaluate/page.tsx**
  - Renders: evaluate Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/evaluations/defense/[defenseId]/result/page.tsx**
  - Renders: result Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/evaluations/page.tsx**
  - Renders: evaluations Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/home/page.tsx**
  - Renders: home Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/layout.tsx**
  - Renders: Layout
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/profile/[id]/page.tsx**
  - Renders: [id] Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/profile/page.tsx**
  - Renders: profile Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/requests/page.tsx**
  - Renders: requests Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/(student)/settings/page.tsx**
  - Renders: SettingsPage
  - Auth Required: No explicitly seen
  - Component Type: Client

- **/src/app/hall/page.tsx**
  - Renders: hall Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/layout.tsx**
  - Renders: Layout
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/maintenance/page.tsx**
  - Renders: maintenance Route
  - Auth Required: No explicitly seen
  - Component Type: Server

- **/src/app/mirror/page.tsx**
  - Renders: mirror Route
  - Auth Required: Yes (getServerSession)
  - Component Type: Server

- **/src/app/page.tsx**
  - Renders: RootPage
  - Auth Required: No explicitly seen
  - Component Type: Server

- **/src/app/secrets/page.tsx**
  - Renders: SecretsPage
  - Auth Required: No explicitly seen
  - Component Type: Client

- **/src/app/showcase/page.tsx**
  - Renders: showcase Route
  - Auth Required: No explicitly seen
  - Component Type: Server

- **/src/app/void/page.tsx**
  - Renders: VoidPage
  - Auth Required: No explicitly seen
  - Component Type: Client

─────────────────────────────────────────\n## 2. API ROUTES\n- **/src/app/api/admin/achievements/[id]/route.ts**
  - Methods: PATCH, DELETE
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [id]

- **/src/app/api/admin/achievements/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Admin/Permission Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

 GET /api/admin/achievements — list all
export async function GET() {
	const auth = await requirePermission("CAN_EDIT_CONTENT");
	if (auth instanceof Response) return auth;

	const achievements = await prisma.achievement.findMany({
		orderBy: { title: "asc" },
	});

	return NextResponse.json(achievements);
}

// POST /api/admin/achievements — create
export async function POST(req: Request) {
	const auth = await requirePermission("CAN_EDIT_CONTENT");
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const { key, title, description, icon, unlockedTitleId } = body;

		if (!key || !title || !description || !icon) {
			return NextResponse.json({ error: "All fields required" }, { status: 400 });
		}

		const achievement = await (prisma as any).achievement.create({
			data: { 
				key, title, description, icon,
				unlockedTitleId: unlockedTitleId || null
			},
		});

		return NextResponse.json(achievement, { status: 201 });
	} catch (error: any) {
		if (error.code === "P2002") {
			return NextResponse.json({ error: "Achievement key already exists" }, { status: 409 });
		}
		return NextResponse.json({ error: "Failed to create achievement" }, { status: 500 });
	}
}

- **/src/app/api/admin/announcements/[id]/route.ts**
  - Methods: DELETE
  - Auth/Permission: Public / Standard
  - Description: import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

 DELETE — remove an announcement
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ANNOUNCEMENTS");
		if (auth instanceof Response) return auth;

		const { id } = params;
		if (!id) return err("ID is required", 400);

		await (prisma as any).announcement.delete({ where: { id } });

		return ok({ success: true });
	} catch (error: any) {
		console.error("Announcement DELETE Error:", error);
		if (error.code === 'P2025') {
			return err("Announcement not found", 404);
		}
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/admin/announcements/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Public / Standard
  - Description: import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission, requireAnyPermission } from "@/lib/admin-auth";

 GET — list all announcements (for admin management)
export async function GET() {
	try {
		const auth = await requireAnyPermission(["CAN_SEND_ANNOUNCEMENTS", "CAN_MANAGE_ANNOUNCEMENTS"]);
		if (auth instanceof Response) return auth;

		const announcements = await (prisma as any).announcement.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				createdBy: { select: { login: true, name: true } },
				_count: { select: { dismissals: true } },
			},
		});

		return ok(announcements);
	} catch (error) {
		console.error("Announcements GET Error:", error);
		return err("Internal Server Error", 500);
	}
}

// POST — create a new announcement
export async function POST(req: Request) {
	try {
		const auth = await requirePermission("CAN_SEND_ANNOUNCEMENTS");
		if (auth instanceof Response) return auth;

		const { title, body, expiresAt } = await req.json();

		if (!title || !body || !expiresAt) {
			return err("title, body, and expiresAt are required", 400);
		}

		const expiry = new Date(expiresAt);
		if (isNaN(expiry.getTime()) || expiry <= new Date()) {
			return err("expiresAt must be a valid future date", 400);
		}

		const announcement = await (prisma as any).announcement.create({
			data: {
				title,
				body,
				expiresAt: expiry,
				createdById: auth.user.id,
			},
		});

		return ok(announcement, 201);
	} catch (error) {
		console.error("Announcement POST Error:", error);
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/admin/audit-logs/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for audit-logs

- **/src/app/api/admin/conflicts/[id]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_RESOLVE_CONFLICTS");
	if (auth instanceof Response) return auth;

	try {
		const { status, moderatorNote } = await req.json();
		if (!status) return err("status is required", 400);

		await prisma.conflictFlag.update({
			where: { id: params.id },
			data: { status, moderatorNote: moderatorNote || undefined },
		});

		 NEVER return raisedById
		return ok({ success: true });
	} catch (e: unknown) {
		const errorMessage = e instanceof Error ? (e as Error).message : "Internal Server Error";
		return err(errorMessage, 500);
	}
}

- **/src/app/api/admin/damage/[id]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [id]

- **/src/app/api/admin/defenses/criteria/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request) {
  const auth = await requirePermission("CAN_EDIT_CONTENT");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const { criteria, settings } = await req.json();

     1. Validation
    if (!settings || !criteria) return err("Missing required data");

    const activeCriteriaCount = criteria.filter((c: any) => c.isActive).length;
    if (activeCriteriaCount < 5) return err("Minimum 5 active criteria required");
    if (activeCriteriaCount > 15) return err("Maximum 15 active criteria allowed");

    if (settings.ratingScale < 3 || settings.ratingScale > 10) return err("Rating scale must be between 3 and 10");
    if (settings.passThreshold < 1 || settings.passThreshold > 100) return err("Pass threshold must be between 1 and 100");

    // 2. Database Update
    return await prisma.$transaction(async (tx) => {
      // Update Settings
      const updatedSettings = await (tx as any).defenseCriteriaSettings.update({
        where: { id: "singleton" },
        data: {
          ratingScale: settings.ratingScale,
          overallMinChars: settings.overallMinChars,
          passThreshold: settings.passThreshold,
          updatedById: user.id,
        },
      });

      // Upsert Criteria
      const criteriaResults = [];
      for (const c of criteria) {
        const result = await (tx as any).defenseCriteria.upsert({
          where: { id: c.id || 'new-id' },
          update: {
            name: c.name,
            description: c.description,
            order: c.order,
            minChars: c.minChars,
            isActive: c.isActive,
          },
          create: {
            name: c.name,
            description: c.description,
            order: c.order,
            minChars: c.minChars,
            isActive: c.isActive,
          },
        });
        criteriaResults.push(result);
      }

      return ok({ criteria: criteriaResults, settings: updatedSettings });
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/admin/dynamic-roles/[id]/route.ts**
  - Methods: PATCH, DELETE
  - Auth/Permission: Public / Standard
  - Description: import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";
import { ALL_PERMISSIONS } from "@/lib/permissions";

 PATCH — update a custom role's name, permissions, or admin flag
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const role = await (prisma as any).dynamicRole.findUnique({ where: { name: params.id } });
		if (!role) return err("Role not found", 404);

		// Safety first: Nobody (not even President) can modify the President role itself via API
		if (role.name === "PRESIDENT") return err("The President role is immutable for system safety", 403);

		// System roles are normally protected, but the President can override them
		if (role.isSystem && auth.user.role !== "PRESIDENT") {
			return err("System roles can only be modified by the President", 403);
		}

		const body = await req.json();
		const data: any = {};

		if (body.displayName) data.displayName = body.displayName;
		if (body.isAdmin !== undefined) data.isAdmin = Boolean(body.isAdmin);
		if (body.permissions) {
			data.permissions = body.permissions.filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));
		}

		const updated = await (prisma as any).dynamicRole.update({
			where: { name: params.id },
			data,
		});

		return ok(updated);
	} catch (error) {
		console.error("Dynamic Role PATCH Error:", error);
		return err("Internal Server Error", 500);
	}
}

// DELETE — delete a custom role (reassign users to STUDENT)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const role = await (prisma as any).dynamicRole.findUnique({ where: { name: params.id } });
		if (!role) return err("Role not found", 404);

		// Safety first: Cannot delete critical roles
		if (role.name === "PRESIDENT" || role.name === "STUDENT") {
			return err(`The ${role.name} role is required for system operation and cannot be deleted`, 403);
		}

		// System roles can only be deleted by the President
		if (role.isSystem && auth.user.role !== "PRESIDENT") {
			return err("System roles can only be deleted by the President", 403);
		}

		// Reassign all users with this role to STUDENT
		await prisma.user.updateMany({
			where: { role: params.id },
			data: { role: "STUDENT" },
		});

		await (prisma as any).dynamicRole.delete({ where: { name: params.id } });

		return ok({ success: true });
	} catch (error) {
		console.error("Dynamic Role DELETE Error:", error);
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/admin/dynamic-roles/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Public / Standard
  - Description: import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";
import { ALL_PERMISSIONS } from "@/lib/permissions";

 GET — list all roles
export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const roles = await (prisma as any).dynamicRole.findMany({
			orderBy: { createdAt: "asc" },
			include: {
				_count: { select: { users: true } },
			},
		});

		return ok(roles);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

// POST — create a new custom role
export async function POST(req: Request) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const { name, displayName, isAdmin, permissions } = await req.json();

		if (!name || !displayName) return err("name and displayName are required", 400);

		// Validate name format (uppercase, underscores only)
		if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
			return err("Role name must be uppercase letters, digits, and underscores", 400);
		}

		// Check for existing role
		const existing = await (prisma as any).dynamicRole.findUnique({ where: { name } });
		if (existing) return err("A role with this name already exists", 400);

		// Validate permissions
		const validPerms = (permissions || []).filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));

		const role = await (prisma as any).dynamicRole.create({
			data: {
				name,
				displayName,
				isSystem: false,
				isAdmin: isAdmin ?? true,
				permissions: validPerms,
			},
		});

		return ok(role);
	} catch (error) {
		console.error("Dynamic Role POST Error:", error);
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/admin/eval-sheets/[id]/route.ts**
  - Methods: GET, PATCH
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

 GET /api/admin/eval-sheets/[id]
// If id is a project ID, returns the latest sheet for that project
// If id is a sheet ID, returns that specific sheet
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { id } = params;

		// First try finding by projectId
		let sheet = await (prisma as any).evalSheet.findUnique({
			where: { projectId: id },
			include: {
				sections: {
					orderBy: { order: "asc" },
					include: {
						questions: {
							orderBy: { order: "asc" },
						},
					},
				},
			},
		});

		// If not found, try finding by sheet id
		if (!sheet) {
			sheet = await prisma.evalSheet.findUnique({
				where: { id },
				include: {
					sections: {
						orderBy: { order: "asc" },
						include: {
							questions: {
								orderBy: { order: "asc" },
							},
						},
					},
				},
			});
		}

		if (!sheet) return err("Sheet not found", 404);

		return ok(sheet);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

// PATCH /api/admin/eval-sheets/[id]
// Updates the sheet, increments version, archives old version (implicitly by versioning)
// Actually, given the prompt: "Creates a new version — old version archived"
// I will implement this by updating the existing sheet and incrementing the version,
// OR by creating a new one if specified. 
// However, the schema has projectId as @unique, so there can only be one ACTIVE sheet per project.
// To archive, I might need an "isArchived" flag or just rely on the version.
// But since projectId is unique, I either update the same record or change the unique constraint.
// The prompt says "PATCH /api/admin/eval-sheets/[id]". 
// If projectId is unique, I should probably just update the content and increment version.

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userPermissions = (session.user as any).permissions || [];
		if (!userPermissions.includes("CAN_EDIT_CONTENT")) {
			return err("Insufficient permissions", 403);
		}

		const body = await req.json();
		const { passMark, sections, updateActiveEvaluations } = body;

		// We increment version and replace sections/questions
		// Since we want to "archive" old ones, we delete existing and recreate.
		// In a real prod env, we'd probably keep them with different IDs.
		// But for simplicity/strict schema adherence:
		
		const updatedSheet = await prisma.$transaction(async (tx) => {
			// Get current version
			const current = await (tx as any).evalSheet.findUnique({
				where: { id: params.id },
				select: { version: true }
			});
			if (!current) throw new Error("Sheet not found");

			// Delete all existing sections and questions
			await (tx as any).evalSection.deleteMany({ where: { sheetId: params.id } });

			// Update sheet and create new sections/questions
			const updated = await (tx as any).evalSheet.update({
				where: { id: params.id },
				data: {
					passMark: passMark || 60,
					version: current.version + 1,
					sections: {
						create: sections.map((section: any, sIdx: number) => ({
							title: section.title,
							order: sIdx,
							weight: section.weight,
							passMark: section.passMark,
							questions: {
								create: section.questions.map((q: any, qIdx: number) => ({
									order: qIdx,
									type: q.type,
									label: q.label,
									description: q.description,
									required: q.required ?? true,
									isHardRequirement: q.isHardRequirement ?? false,
									weight: q.weight ?? 1,
									options: q.options,
									scaleMin: q.scaleMin,
									scaleMax: q.scaleMax,
									scaleMinLabel: q.scaleMinLabel,
									scaleMaxLabel: q.scaleMaxLabel,
									passThreshold: q.passThreshold,
								})),
							},
						})),
					},
				},
				include: {
					sections: {
						include: {
							questions: true,
						},
					},
				},
			});

			// NEW: Cascade update if requested
			if (updateActiveEvaluations) {
				await (tx as any).evaluation.updateMany({
					where: { 
						status: "PENDING",
						projectId: updated.projectId 
					},
					data: {
						sheetVersion: updated.version
					}
				});
			}

			return updated;
		});

		return ok(updatedSheet);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/admin/eval-sheets/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

 POST /api/admin/eval-sheets
// Creates a new evaluation sheet for a project
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userPermissions = (session.user as any).permissions || [];
		if (!userPermissions.includes("CAN_EDIT_CONTENT")) {
			return err("Insufficient permissions", 403);
		}

		const body = await req.json();
		const { projectId, passMark, sections, updateActiveEvaluations } = body;

		if (!projectId || !sections || !Array.isArray(sections)) {
			return err("Missing required fields", 400);
		}

		// Create sheet with nested sections and questions
		const sheet = await (prisma as any).evalSheet.create({
			data: {
				projectId,
				passMark: passMark || 60,
				version: 1,
				createdById: session.user.id,
				sections: {
					create: sections.map((section: any, sIdx: number) => ({
						title: section.title,
						order: sIdx,
						weight: section.weight,
						passMark: section.passMark,
						questions: {
							create: section.questions.map((q: any, qIdx: number) => ({
								order: qIdx,
								type: q.type,
								label: q.label,
								description: q.description,
								required: q.required ?? true,
								isHardRequirement: q.isHardRequirement ?? false,
								weight: q.weight ?? 1,
								options: q.options,
								scaleMin: q.scaleMin,
								scaleMax: q.scaleMax,
								scaleMinLabel: q.scaleMinLabel,
								scaleMaxLabel: q.scaleMaxLabel,
								passThreshold: q.passThreshold,
							})),
						},
					})),
				},
			},
			include: {
				sections: {
					include: {
						questions: true,
					},
				},
			},
		});

		return ok(sheet);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/admin/evaluations/calibration/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for calibration

- **/src/app/api/admin/evaluations/oversight/route.ts**
  - Methods: GET, PATCH
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user || !(session.user as any).isAdmin) {
			return err("Unauthorized", 401);
		}

		 1. Live evaluations feed
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

- **/src/app/api/admin/fabrication/[id]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [id]

- **/src/app/api/admin/impersonate/route.ts**
  - Methods: POST, DELETE
  - Auth/Permission: Admin/Permission Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

export async function POST(req: Request) {
	try {
		const auth = await requirePermission("CAN_IMPERSONATE");
		if (auth instanceof Response) return auth;

		const { targetUserId } = await req.json();
		if (!targetUserId) return err("Target user ID is required", 400);

		const target = await prisma.user.findUnique({ where: { id: targetUserId } });
		if (!target) return err("Target user not found", 404);

		const realAdminId = (auth.user as any).realAdminId || auth.user.id;
		
		await (prisma.user as any).update({
			where: { id: realAdminId },
			data: { impersonatorId: targetUserId }
		});

		 Create audit log
		await (prisma as any).adminAuditLog.create({
			data: {
				actorId: auth.user.id,
				targetId: targetUserId,
				action: "IMPERSONATE_START",
				details: `Started impersonating @${target.login}`
			}
		});

		return ok({ success: true });
	} catch (error) {
		console.error("Impersonation Error:", error);
		return err("Internal Server Error", 500);
	}
}

export async function DELETE() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const realAdminId = (session.user as any).realAdminId || session.user.id;

		await (prisma.user as any).update({
			where: { id: realAdminId },
			data: { impersonatorId: null }
		});

		return ok({ success: true });
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/admin/lab-access/[id]/flag/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for flag

- **/src/app/api/admin/materials/[id]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [id]

- **/src/app/api/admin/members/route.ts**
  - Methods: GET
  - Auth/Permission: Admin/Permission Required
  - Description: GET /api/admin/members

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status, TeamStatus } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const members = await prisma.user.findMany({
			where: {
				status: Status.ACTIVE,
			},
			orderBy: {
				joinedAt: "asc",
			},
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				role: true,
				currentRank: true,
				joinedAt: true,
				status: true,
				teams: {
					where: {
						team: {
							status: {
								in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
							},
						},
					},
					include: {
						team: {
							select: {
								project: {
									select: { title: true },
								},
								blackholeDeadline: true,
							},
						},
					},
				},
				notifications: {
					where: { readAt: { not: null } },
					orderBy: { readAt: "desc" },
					take: 1,
					select: { readAt: true },
				},
				_count: {
					select: {
						teams: {
							where: {
								team: { status: TeamStatus.COMPLETED },
							},
						},
					},
				},
			},
		});

		const now = new Date();

		const formattedMembers = members.map((u) => {
			const activeTeamData = u.teams[0]?.team || null;
			let daysSinceInteraction = -1;

			if (u.notifications.length > 0 && u.notifications[0].readAt) {
				const diffMs = now.getTime() - u.notifications[0].readAt.getTime();
				daysSinceInteraction = Math.floor(diffMs / (1000 * 60 * 60 * 24));
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { teams, notifications, ...rest } = u;

			return {
				...rest,
				activeTeam: activeTeamData,
				daysSinceLastInteraction: daysSinceInteraction,
				completedTeamsCount: u._count.teams,
			};
		});

		return ok(formattedMembers);
	} catch (error: unknown) {
		const msg = error instanceof Error ? (error as Error).message : "Internal Server Error";
		return err(msg, 500);
	}
}

- **/src/app/api/admin/members/waitlist/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: GET /api/admin/members/waitlist

import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status } from "@prisma/client";
import { requirePermission } from "@/lib/admin-auth";

export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_WAITLIST");
		if (auth instanceof Response) return auth;

		const waitlist = await prisma.user.findMany({
			where: {
				status: Status.WAITLIST,
			},
			orderBy: {
				joinedAt: "asc",
			},
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				joinedAt: true,
				currentRank: true,
			}
		});

		return ok(waitlist);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/admin/moodboard/route.ts**
  - Methods: GET, POST, PATCH, DELETE
  - Auth/Permission: Session Required
  - Description: import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

 GET — list all mood board notes
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const permissions = (session.user as any).permissions as string[] || [];
	if (permissions.length === 0) return NextResponse.json({ error: "Admin only" }, { status: 403 });

	const notes = await prisma.moodBoardNote.findMany({
		orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
		include: { author: { select: { login: true, name: true } } },
	});

	return NextResponse.json(notes);
}

// POST — create a new note
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const permissions = (session.user as any).permissions as string[] || [];
	if (permissions.length === 0) return NextResponse.json({ error: "Admin only" }, { status: 403 });

	const body = await req.json();
	const { content, color } = body;

	if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

	const note = await prisma.moodBoardNote.create({
		data: {
			authorId: session.user.id,
			content: content.slice(0, 500),
			color: color || "#FFD700",
		},
	});

	return NextResponse.json(note, { status: 201 });
}

// DELETE — delete a note
export async function DELETE(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await req.json();
	if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

	const note = await prisma.moodBoardNote.findUnique({ where: { id } });
	if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

	// Only the author or someone with CAN_MANAGE_ROLES can delete
	const permissions = (session.user as any).permissions as string[] || [];
	if (note.authorId !== session.user.id && !hasPermission(permissions, "CAN_MANAGE_ROLES")) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	await prisma.moodBoardNote.delete({ where: { id } });
	return NextResponse.json({ ok: true });
}

// PATCH — toggle pin
export async function PATCH(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const permissions = (session.user as any).permissions as string[] || [];
	if (permissions.length === 0) return NextResponse.json({ error: "Admin only" }, { status: 403 });

	const { id, pinned } = await req.json();
	if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

	const note = await prisma.moodBoardNote.update({
		where: { id },
		data: { pinned: !!pinned },
	});

	return NextResponse.json(note);
}

- **/src/app/api/admin/projects/[id]/required/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequirements } from "@/lib/rank-requirements";
import { requirePermission } from "@/lib/admin-auth";

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const auth = await requirePermission("CAN_MANAGE_PROJECTS");
		if (auth instanceof Response) return auth;

		const body = await req.json();
		const isRequired = Boolean(body.isRequired);

		const project = await prisma.project.findUnique({
			where: { id: params.id },
			select: { rank: true, isRequired: true }
		});

		if (!project) {
			return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
		}

		 Only validate if we are setting it to true AND it was false
		if (isRequired && !project.isRequired) {
			const currentCount = await prisma.project.count({
				where: { rank: project.rank, isRequired: true, status: "ACTIVE" }
			});

			const validation = await validateRequirements(project.rank, currentCount + 1, undefined);
			if (!validation.isValid) {
				return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
			}
		}

		const updated = await prisma.project.update({
			where: { id: params.id },
			data: { isRequired },
		});

		return NextResponse.json({ ok: true, data: updated });
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}

- **/src/app/api/admin/projects/[id]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath, revalidateTag } from "next/cache";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const auth = await requirePermission("CAN_MANAGE_PROJECTS");
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const { permissions } = auth;

		 Status changes restricted to users with CAN_MANAGE_PROJECTS
		if (body.status) {
			const st = body.status;
			if ((st === "ACTIVE" || st === "RETIRED") && !hasPermission(permissions, "CAN_MANAGE_PROJECTS")) {
				return err("Insufficient permissions to publish, retire, or reactivate projects", 403);
			}
		}

		const data: any = {};
		if (body.title) data.title = body.title;
		if (body.description !== undefined) data.description = body.description;
		if (body.rank) data.rank = body.rank;
		if (body.status) data.status = body.status;
		if (body.teamSizeMin !== undefined) data.teamSizeMin = Number(body.teamSizeMin);
		if (body.teamSizeMax !== undefined) data.teamSizeMax = Number(body.teamSizeMax);
		if (body.blackholeDays !== undefined) data.blackholeDays = Number(body.blackholeDays);
		if (body.skillTags !== undefined) {
			data.skillTags = typeof body.skillTags === "string"
				? body.skillTags.split(",").map((s: string) => s.trim()).filter(Boolean)
				: body.skillTags;
		}
		if (body.isUnique !== undefined) data.isUnique = body.isUnique;
		if (body.subjectSheetUrl !== undefined) data.subjectSheetUrl = body.subjectSheetUrl;
		if (body.evaluationSheetUrl !== undefined) data.evaluationSheetUrl = body.evaluationSheetUrl;
		if (body.objectives !== undefined) data.objectives = body.objectives;
		if (body.deliverables !== undefined) data.deliverables = body.deliverables;

		const updated = await prisma.project.update({ where: { id: params.id }, data });

		// Cascade updates to active teams if requested
		if (body.updateActiveTeams && body.blackholeDays !== undefined) {
			const teams = await prisma.team.findMany({
				where: { 
					projectId: params.id,
					status: "ACTIVE",
					activatedAt: { not: null }
				}
			});

			// Update each team's deadline based on its own activatedAt + new blackholeDays
			for (const team of teams) {
				if (team.activatedAt) {
					const newDeadline = new Date(team.activatedAt);
					newDeadline.setDate(newDeadline.getDate() + Number(body.blackholeDays));
					
					await prisma.team.update({
						where: { id: team.id },
						data: { blackholeDeadline: newDeadline }
					});
				}
			}
		}
		
		revalidatePath("/cursus");
		revalidatePath("/admin");
		revalidateTag("projects");

		return ok(updated);
	} catch (e: unknown) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/admin/projects/route.ts**
  - Methods: POST
  - Auth/Permission: Public / Standard
  - Description: import { requirePermission } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getClubSettings } from "@/lib/club-settings";
import { hasPermission } from "@/lib/permissions";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: Request) {
	const auth = await requirePermission("CAN_MANAGE_PROJECTS");
	if (auth instanceof Response) return auth;

	try {
		const body = await req.json();
		const {
			title, description, rank, teamSizeMin, teamSizeMax,
			blackholeDays, skillTags, isUnique,
			subjectSheetUrl, evaluationSheetUrl, status,
			objectives, deliverables,
		} = body;

		if (!title || !rank) return err("title and rank are required", 400);

		const auth2 = auth as { user: any; permissions: string[] };
		const settings = await getClubSettings();

		 Users with CAN_MANAGE_PROJECTS can publish directly
		const canPublish = hasPermission(auth2.permissions, "CAN_MANAGE_PROJECTS");
		const finalStatus = canPublish && status === "ACTIVE" ? "ACTIVE" : "DRAFT";

		const project = await prisma.project.create({
			data: {
				title,
				description: description || "",
				rank: rank as "E" | "D" | "C" | "B" | "A" | "S",
				status: finalStatus as "ACTIVE" | "DRAFT",
				teamSizeMin: Number(teamSizeMin) || settings.minTeamSize,
				teamSizeMax: Number(teamSizeMax) || settings.maxTeamSize,
				blackholeDays: Number(blackholeDays) || settings.defaultBlackholeDays,
				skillTags: typeof skillTags === "string" ? skillTags.split(",").map((s: string) => s.trim()).filter(Boolean) : skillTags || [],
				isUnique: isUnique ?? false,
				subjectSheetUrl: subjectSheetUrl || null,
				evaluationSheetUrl: evaluationSheetUrl || null,
				objectives: objectives || [],
				deliverables: deliverables || [],
				createdById: auth2.user.id,
			},
		});

		revalidatePath("/cursus");
		revalidatePath("/admin");
		revalidateTag("projects");

		return ok(project);
	} catch (e) {
		return err((e as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/admin/proposals/[id]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [id]

- **/src/app/api/admin/rank-requirements/[rank]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import prisma from "@/lib/prisma";
import { validateRequirements } from "@/lib/rank-requirements";
import { Rank } from "@prisma/client";
import { requireAnyPermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";

export async function PATCH(
	req: Request,
	{ params }: { params: { rank: string } }
) {
	try {
		const auth = await requireAnyPermission(["CAN_MANAGE_CLUB_SETTINGS", "CAN_EDIT_CONTENT"]);
		if (auth instanceof Response) return auth;

		const rank = params.rank as Rank;
		const body = await req.json();
		const projectsRequired = Number(body.projectsRequired);

		if (isNaN(projectsRequired) || projectsRequired < 1) {
			return err("Invalid projects required count", 400);
		}

		 Validation
		const validation = await validateRequirements(rank, undefined, projectsRequired);
		if (!validation.isValid) {
			return err(validation.error || "Invalid requirements", 400);
		}

		const updated = await prisma.rankRequirement.upsert({
			where: { rank },
			update: { projectsRequired, updatedById: (auth.user as any).id },
			create: { rank, projectsRequired, updatedById: (auth.user as any).id },
		});

		return ok(updated);
	} catch (error: any) {
		return err(error.message || "Internal Server Error", 500);
	}
}

- **/src/app/api/admin/roles/route.ts**
  - Methods: GET, PATCH
  - Auth/Permission: Public / Standard
  - Description: import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

 GET — list all users with roles (for role assignment)
export async function GET() {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const users = await prisma.user.findMany({
			where: {
				status: { not: "WAITLIST" },
			},
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				role: true,
			},
			orderBy: { login: "asc" },
		});

		return ok(users);
	} catch (error) {
		return err("Internal Server Error", 500);
	}
}

// PATCH — assign a role to a user
export async function PATCH(req: Request) {
	try {
		const auth = await requirePermission("CAN_MANAGE_ROLES");
		if (auth instanceof Response) return auth;

		const body = await req.json();
		const { targetUserId, newRole } = body;

		if (!targetUserId) {
			return err("Target user ID is required", 400);
		}

		const target = await prisma.user.findUnique({
			where: { id: targetUserId },
		});

		if (!target) return err("User not found", 404);

		// Prevent demoting another PRESIDENT for safety
		if (target.role === "PRESIDENT" && auth.user.id !== targetUserId) {
			return err("Cannot modify another President's role.", 403);
		}

		if (newRole) {
			// Validate the role exists in DynamicRole
			const roleExists = await (prisma as any).dynamicRole.findUnique({
				where: { name: newRole },
			});
			if (!roleExists) return err("Invalid role — role does not exist", 400);
		}

		const updatedUser = await prisma.user.update({
			where: { id: targetUserId },
			data: { role: newRole },
			select: { id: true, login: true, name: true, role: true },
		});

		return ok(updatedUser);

	} catch (error) {
		console.error("Role PATCH Error:", error);
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/admin/settings/route.ts**
  - Methods: GET, PUT
  - Auth/Permission: Admin/Permission Required
  - Description: import { getServerSession } from "next-auth";
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

		 Validate numeric fields
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

- **/src/app/api/admin/teams/[id]/extend/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for extend

- **/src/app/api/admin/titles/[id]/route.ts**
  - Methods: DELETE
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [id]

- **/src/app/api/admin/titles/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for titles

- **/src/app/api/admin/users/[id]/demote-rank/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for demote-rank

- **/src/app/api/admin/users/[id]/lab-access/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for lab-access

- **/src/app/api/admin/users/[id]/notes/[noteId]/route.ts**
  - Methods: DELETE
  - Auth/Permission: Admin/Permission Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

 DELETE /api/admin/users/[id]/notes/[noteId]
export async function DELETE(req: Request, { params }: { params: { id: string; noteId: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const { noteId } = params;
		
		await prisma.adminNote.delete({
			where: { id: noteId },
		});

		return ok({ deleted: true });
	} catch (error: any) {
		return err(error.message, 500);
	}
}

- **/src/app/api/admin/users/[id]/notes/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Admin/Permission Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { requirePermission } from "@/lib/admin-auth";

 GET /api/admin/users/[id]/notes
export async function GET(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const targetUserId = params.id;
		const notes = await prisma.adminNote.findMany({
			where: { targetUserId },
			include: { author: { select: { login: true } } },
			orderBy: { createdAt: "desc" },
		});

		return ok(notes);
	} catch (error: any) {
		return err(error.message, 500);
	}
}

// POST /api/admin/users/[id]/notes
export async function POST(req: Request, { params }: { params: { id: string } }) {
	try {
		const auth = await requirePermission("CAN_MANAGE_MEMBERS");
		if (auth instanceof Response) return auth;

		const session = await getServerSession(authOptions);
		const authorId = session!.user.id;
		const targetUserId = params.id;
		
		const { body } = await req.json();
		if (!body) return err("Note body is required", 400);

		const note = await prisma.adminNote.create({
			data: {
				targetUserId,
				authorId,
				body,
			},
			include: { author: { select: { login: true } } },
		});

		return ok(note);
	} catch (error: any) {
		return err(error.message, 500);
	}
}

- **/src/app/api/admin/users/[id]/promote-rank/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for promote-rank

- **/src/app/api/admin/users/[id]/status/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for status

- **/src/app/api/announcements/active/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

 GET — active announcements (not expired, not dismissed by current user)
export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const now = new Date();
		const userId = session.user.id;

		const announcements = await (prisma as any).announcement.findMany({
			where: {
				expiresAt: { gt: now },
				dismissals: {
					none: { userId },
				},
			},
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				title: true,
				body: true,
				createdAt: true,
				expiresAt: true,
			},
		});

		return ok(announcements);
	} catch (error) {
		console.error("Active Announcements Error:", error);
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/announcements/dismiss/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

 POST — dismiss an announcement for the current user
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { announcementId } = await req.json();
		if (!announcementId) return err("announcementId is required", 400);

		// Check announcement exists
		const announcement = await (prisma as any).announcement.findUnique({
			where: { id: announcementId },
		});
		if (!announcement) return err("Announcement not found", 404);

		// Upsert dismissal (idempotent)
		await (prisma as any).announcementDismissal.upsert({
			where: {
				announcementId_userId: {
					announcementId,
					userId: session.user.id,
				},
			},
			update: {},
			create: {
				announcementId,
				userId: session.user.id,
			},
		});

		return ok({ success: true });
	} catch (error) {
		console.error("Dismiss Announcement Error:", error);
		return err("Internal Server Error", 500);
	}
}

- **/src/app/api/auth/[...nextauth]/route.ts**
  - Methods: Unknown
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for [...nextauth]

- **/src/app/api/compliments/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

 POST — send a compliment
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json();
	const { toUserId, message, evaluationId } = body;

	if (!toUserId || !message) {
		return NextResponse.json({ error: "toUserId and message required" }, { status: 400 });
	}

	if (toUserId === session.user.id) {
		return NextResponse.json({ error: "Cannot compliment yourself" }, { status: 400 });
	}

	try {
		const compliment = await prisma.compliment.create({
			data: {
				fromUserId: session.user.id,
				toUserId,
				message: message.slice(0, 500),
				evaluationId: evaluationId || null,
			},
		});
		return NextResponse.json(compliment, { status: 201 });
	} catch (e: any) {
		if (e?.code === "P2002") {
			return NextResponse.json({ error: "You already sent a compliment for this" }, { status: 409 });
		}
		return NextResponse.json({ error: "Failed to send compliment" }, { status: 500 });
	}
}

// GET — get compliments received by the current user
export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const compliments = await prisma.compliment.findMany({
		where: { toUserId: session.user.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			message: true,
			createdAt: true,
			// Anonymous — don't expose sender
		},
	});

	return NextResponse.json(compliments);
}

- **/src/app/api/cron/defenses/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DefenseStatus, NotificationType } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Public Defense Scheduled Check
 * Runs every 5 minutes to notify admins of starting defenses.
 */
export async function GET() {
  try {
    const now = new Date();

     1. Find defenses that should be starting now but aren't open yet
    const startingDefenses = await (prisma as any).publicDefense.findMany({
      where: {
        status: DefenseStatus.SCHEDULED,
        scheduledAt: { lte: now },
        evaluationOpen: false,
      },
      include: {
        team: { include: { project: true } },
      },
    });

    if (startingDefenses.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // 2. Find all users with CAN_MANAGE_DEFENSES permission
    // We fetch all dynamic roles with the permission first to optimize
    const rolesWithPermission = await (prisma as any).dynamicRole.findMany({
      where: {
        permissions: { has: "CAN_MANAGE_DEFENSES" },
      },
      select: { name: true },
    });

    const roleNames = rolesWithPermission.map((r: any) => r.name);

    if (roleNames.length === 0) {
      return NextResponse.json({ success: true, count: 0, warning: "No roles found with CAN_MANAGE_DEFENSES" });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: roleNames },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({ success: true, count: 0, warning: "No active admins found for notification" });
    }

    // 3. Send urgent notifications to these admins for each starting defense
    const notifications = [];
    for (const defense of startingDefenses) {
      const projectTitle = defense.team.project.title;
      const teamName = defense.team.name || "Unnamed Team";

      for (const admin of admins) {
        notifications.push({
          userId: admin.id,
          type: "PUBLIC_DEFENSE" as any,
          title: "🚨 Defense Starting Now",
          body: `${projectTitle} by ${teamName} is scheduled to start now. Open evaluation at /admin or /evaluations`,
          actionUrl: "/evaluations",
        });
      }
    }

    await prisma.notification.createMany({
      data: notifications,
    });

    return NextResponse.json({
      success: true,
      defensesProcessed: startingDefenses.length,
      notificationsSent: notifications.length,
    });
  } catch (error: any) {
    console.error("Defense Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

- **/src/app/api/cron/keepalive/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Neon DB Keepalive / Ping
 * Hit this route periodically (e.g. every 4 minutes) to keep the DB connection warm.
 */
export async function GET() {
	try {
		 A simple query to touch the database
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

- **/src/app/api/cursus/projects/[id]/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: GET /api/cursus/projects/[id]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const projectId = params.id;

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				createdBy: {
					select: {
						name: true,
						login: true,
					},
				},
				teams: {
					where: {
						status: {
							in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
						},
					},
					include: {
						members: {
							include: {
								user: {
									select: {
										id: true,
										login: true,
										name: true,
										image: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!project) {
			return err("Project not found", 404);
		}

		return ok(project);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/cursus/projects/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: GET /api/cursus/projects
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { ProjectStatus, Rank, TeamStatus } from "@prisma/client";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const projects = await prisma.project.findMany({
			where: { status: ProjectStatus.ACTIVE },
			include: {
				_count: {
					select: {
						teams: {
							where: {
								status: {
									in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
								},
							},
						},
					},
				},
				teams: {
					where: {
						status: {
							in: [TeamStatus.ACTIVE, TeamStatus.COMPLETED, TeamStatus.EVALUATING],
						},
					},
					select: {
						id: true, // We will map this, usually teams might have names, but currently we just fetch them. The prompt asked for active/completed team names
						status: true,
						leader: {
							select: { login: true }
						}
					},
				},
			},
		});

		const grouped: Record<Rank, any[]> = {
			E: [],
			D: [],
			C: [],
			B: [],
			A: [],
			S: [],
		};

		for (const project of projects) {
			let enhancedProject: any = { ...project };

			// Filter teams for B rank and above
			const isHighRank = ["B", "A", "S"].includes(project.rank);
			if (isHighRank) {
				// Re-formatting teams to just return names - the team model doesn't explicitly have a name string, so we will use leader.login + ' team'
				enhancedProject.teamNames = project.teams.map(t => `${t.leader.login}'s Team`);
			} else {
				enhancedProject.teamNames = [];
			}
			delete enhancedProject.teams;

			if (grouped[project.rank]) {
				grouped[project.rank].push(enhancedProject);
			}
		}

		return ok(grouped);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/cursus/rank-requirements/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for rank-requirements

- **/src/app/api/defenses/[id]/close/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType, Rank, Status } from "@prisma/client";
import { calculateDefenseResult, DefenseEvaluationWithScores } from "@/lib/defense-scoring";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;
    const body = await req.json();
    const { confirm } = body;

     1. Fetch defense and registration progress
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true, members: { select: { userId: true } } } },
        registrations: { select: { id: true, userId: true, userRank: true, isAdmin: true } },
        evaluations: { select: { id: true, evaluatorId: true } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status !== DefenseStatus.OPEN) return err(`Cannot close defense in ${defense.status} status`);

    // 2. Count unsubmitted evaluators
    const submittedIds = new Set(defense.evaluations.map((e: any) => e.evaluatorId));
    const unsubmitted = defense.registrations.filter((r: any) => !submittedIds.has(r.userId));

    if (unsubmitted.length > 0 && !confirm) {
      const tiers = {
        admin: unsubmitted.filter((r: any) => r.isAdmin).length,
        expert: unsubmitted.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length,
        gallery: unsubmitted.filter((r: any) => !r.isAdmin && r.userRank !== Rank.A && r.userRank !== Rank.S).length,
      };

      return ok({
        warning: true,
        unsubmittedCount: unsubmitted.length,
        unsubmittedTiers: tiers,
      });
    }

    // 3. Finalize and Calculate
    return await prisma.$transaction(async (tx) => {
      // 3a. Update metadata
      await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: {
          status: DefenseStatus.CLOSED,
          evaluationClosed: true,
          evaluationClosedAt: new Date(),
          evaluationClosedById: user.id,
        },
      });

      // 3b. Fetch all evaluations with scores
      const allEvaluations = await (tx as any).defenseEvaluation.findMany({
        where: { defenseId },
        include: { criteriaScores: true },
      }) as DefenseEvaluationWithScores[];

      const settings = await (tx as any).defenseCriteriaSettings.findUnique({
        where: { id: "singleton" },
      });

      if (!settings) throw new Error("Defense settings not found");

      // 3c. Calculate Result
      const resultData = calculateDefenseResult(
        defense,
        allEvaluations,
        settings.passThreshold,
        settings.ratingScale
      );

      // 3d. Upsert Result Record
      await (tx as any).defenseResult.upsert({
        where: { defenseId },
        update: {
          adminAverage: resultData.adminAverage,
          adminPassed: resultData.adminPassed,
          adminCount: resultData.adminCount,
          expertAverage: resultData.expertAverage,
          expertPassed: resultData.expertPassed,
          expertCount: resultData.expertCount,
          galleryWeighted: resultData.galleryWeighted,
          galleryCount: resultData.galleryCount,
          galleryExcluded: resultData.galleryExcluded,
          finalScore: resultData.finalScore,
          passed: resultData.passed,
          provisional: resultData.provisional,
          provisionalReason: resultData.provisionalReason,
          calculatedAt: new Date(),
        },
        create: {
          defenseId,
          adminAverage: resultData.adminAverage,
          adminPassed: resultData.adminPassed,
          adminCount: resultData.adminCount,
          expertAverage: resultData.expertAverage,
          expertPassed: resultData.expertPassed,
          expertCount: resultData.expertCount,
          galleryWeighted: resultData.galleryWeighted,
          galleryCount: resultData.galleryCount,
          galleryExcluded: resultData.galleryExcluded,
          finalScore: resultData.finalScore,
          passed: resultData.passed,
          provisional: resultData.provisional,
          provisionalReason: resultData.provisionalReason,
        },
      });

      // 3e. Update Final status
      const finalStatus = resultData.provisional 
        ? DefenseStatus.PROVISIONAL 
        : (resultData.passed ? DefenseStatus.PASSED : DefenseStatus.FAILED);

      await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: { status: finalStatus },
      });

      // 4. Notifications
      const projectTitle = defense.team.project.title;
      
      if (resultData.provisional) {
        // Notify President
        const president = await tx.user.findFirst({ where: { role: "PRESIDENT", status: Status.ACTIVE } });
        if (president) {
          await tx.notification.create({
            data: {
              userId: president.id,
              type: "PUBLIC_DEFENSE" as any,
              title: "Provisional Defense Result",
              body: `The defense for ${projectTitle} is PROVISIONAL (${resultData.provisionalReason}). Your confirmation is required.`,
              actionUrl: "/admin/defenses",
            },
          });
        }
      } else {
        // Notify Team
        const teamMembers = defense.team.members;
        await tx.notification.createMany({
          data: teamMembers.map((m: any) => ({
            userId: m.userId,
            type: "PUBLIC_DEFENSE" as any,
            title: `Defense ${resultData.passed ? 'PASSED' : 'FAILED'}`,
            body: `Your defense for ${projectTitle} has been processed. Result: ${resultData.passed ? 'PASSED' : 'FAILED'}.`,
            actionUrl: "/evaluations",
          })),
        });
      }

      return ok({ status: finalStatus, result: resultData });
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/confirm-provisional/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

   Allow President OR users with CAN_OVERRIDE_EVALUATIONS
  const permissions = (session.user as any).permissions || [];
  const canOverride = session.user.role === "PRESIDENT" || permissions.includes("CAN_OVERRIDE_EVALUATIONS");
  if (!canOverride) {
    return err("Missing override permissions", 403);
  }

  try {
    const defenseId = params.id;
    const { action, note, confirmed } = await req.json();

    // 1. Fetch Defense and Result
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true, members: { select: { userId: true } } } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

    // Accept any finalized state: PROVISIONAL, PASSED, FAILED, CLOSED
    const allowedStates = ["PROVISIONAL", "PASSED", "FAILED", "CLOSED"];
    if (!allowedStates.includes(defense.status)) {
      return err(`Cannot override a defense in ${defense.status} state`);
    }

    if (!defense.result) {
      return err("Defense result not found");
    }

    // 2. Determine the target status
    let finalStatus: string;

    // Support both legacy `confirmed` field and new `action` field
    if (action === "force_pass") {
      finalStatus = "PASSED";
    } else if (action === "override_fail") {
      finalStatus = "FAILED";
    } else if (action === "confirm") {
      finalStatus = defense.result.passed ? "PASSED" : "FAILED";
    } else if (typeof confirmed === "boolean") {
      // Legacy support
      finalStatus = confirmed
        ? (defense.result.passed ? "PASSED" : "FAILED")
        : "FAILED";
    } else {
      return err("Invalid action. Use 'force_pass', 'override_fail', or 'confirm'.", 400);
    }

    // 3. Process
    return await prisma.$transaction(async (tx) => {
      await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: { status: finalStatus },
      });

      await (tx as any).defenseResult.update({
        where: { defenseId },
        data: {
          passed: finalStatus === "PASSED",
          provisional: false,
          presidentConfirmed: true,
          presidentConfirmedById: session.user.id,
          presidentConfirmedAt: new Date(),
          provisionalReason: note ? `Override by ${session.user.name}: ${note}` : null,
        },
      });

      // 4. Notify Team
      const projectTitle = defense.team.project.title;
      const teamMembers = defense.team.members;

      await tx.notification.createMany({
        data: teamMembers.map((m: any) => ({
          userId: m.userId,
          type: "PUBLIC_DEFENSE" as any,
          title: `Defense ${finalStatus}`,
          body: `An admin has updated your defense for ${projectTitle}. Result: ${finalStatus}.${note ? ` Note: ${note}` : ""}`,
          actionUrl: "/evaluations",
        })),
      });

      return ok({ status: finalStatus });
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/dispel-gallery/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus } from "@prisma/client";
import { DefenseEvaluationWithScores, calculateDefenseResult } from "@/lib/defense-scoring";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;
    const { note } = await req.json();

    if (!note || note.trim().length < 10) {
      return err("A descriptive note (min 10 chars) is required to dispel the gallery");
    }

     1. Fetch Defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

    // 2. Update Flag
    return await prisma.$transaction(async (tx) => {
      const updatedDefense = await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: {
          lowerRankDispelled: true,
          lowerRankDispelledById: user.id,
          lowerRankDispelledAt: new Date(),
          lowerRankDispelledNote: note,
        },
      });

      // 3. Recalculate Result if exists
      if (defense.result) {
        const allEvaluations = await (tx as any).defenseEvaluation.findMany({
          where: { defenseId },
          include: { criteriaScores: true },
        }) as DefenseEvaluationWithScores[];

        const settings = await (tx as any).defenseCriteriaSettings.findUnique({
          where: { id: "singleton" },
        });

        if (!settings) throw new Error("Defense settings not found");

        const resultData = calculateDefenseResult(
          updatedDefense,
          allEvaluations,
          settings.passThreshold,
          settings.ratingScale
        );

        await (tx as any).defenseResult.update({
          where: { defenseId },
          data: {
            adminAverage: resultData.adminAverage,
            adminPassed: resultData.adminPassed,
            adminCount: resultData.adminCount,
            expertAverage: resultData.expertAverage,
            expertPassed: resultData.expertPassed,
            expertCount: resultData.expertCount,
            galleryWeighted: resultData.galleryWeighted,
            galleryCount: resultData.galleryCount,
            galleryExcluded: resultData.galleryExcluded,
            finalScore: resultData.finalScore,
            passed: resultData.passed,
            provisional: resultData.provisional,
            provisionalReason: resultData.provisionalReason,
            calculatedAt: new Date(),
          },
        });

        // Update status if finalized
        const finalizedStatuses = ["PASSED", "FAILED", "PROVISIONAL"];
        if (finalizedStatuses.includes(updatedDefense.status)) {
            const finalStatus = resultData.provisional 
                 ? "PROVISIONAL" 
                 : (resultData.passed ? "PASSED" : "FAILED");
                 
            await (tx as any).publicDefense.update({
                where: { id: defenseId },
                data: { status: finalStatus },
            });
        }
      }

      // Log to AdminAuditLog
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "DISPEL_GALLERY",
          details: `Gallery dispelled for defense ${defenseId}. Reason: ${note}`,
        },
      });

      return ok(updatedDefense);
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/evaluate/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus } from "@prisma/client";
import { getEvaluatorWeight, calculateEvaluationScore } from "@/lib/defense-scoring";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const userId = session.user.id;
    const defenseId = params.id;
    const { scores, overallReview } = await req.json();  scores: { criteriaId: string, score: number, note: string }[]

    // 1. Fetch Defense, Registration, and Settings
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        registrations: { where: { userId } },
        evaluations: { where: { evaluatorId: userId } },
      },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status !== DefenseStatus.OPEN) return err("Evaluations are not open for this defense");

    const registration = defense.registrations[0];
    if (!registration) return err("You are not registered to evaluate this defense", 403);
    if (defense.evaluations.length > 0) return err("You have already submitted an evaluation for this defense");

    const settings = await (prisma as any).defenseCriteriaSettings.findUnique({
      where: { id: "singleton" },
    });
    const criteria = await (prisma as any).defenseCriteria.findMany({
      where: { isActive: true },
    });

    if (!settings || !criteria) return err("Evaluation configuration missing");

    // 2. Validation
    if (overallReview.length < settings.overallMinChars) {
      return err(`Overall review must be at least ${settings.overallMinChars} characters`);
    }

    const criteriaMap = new Map(criteria.map((c: any) => [c.id, c]));
    const submittedScores: { criteriaId: string; score: number; note: string }[] = [];

    for (const c of criteria) {
      const scoreData = scores.find((s: any) => s.criteriaId === c.id);
      if (!scoreData) return err(`Missing score for criteria: ${c.name}`);
      
      if (scoreData.score < 1 || scoreData.score > settings.ratingScale) {
        return err(`Score for ${c.name} must be between 1 and ${settings.ratingScale}`);
      }
      
      if (scoreData.note.length < c.minChars) {
        return err(`Note for ${c.name} must be at least ${c.minChars} characters`);
      }
      
      submittedScores.push({
        criteriaId: c.id,
        score: scoreData.score,
        note: scoreData.note,
      });
    }

    // 3. Calculation
    const totalScore = calculateEvaluationScore(submittedScores as any, settings.ratingScale);

    // 4. Persistence
    return await prisma.$transaction(async (tx) => {
      const evaluation = await (tx as any).defenseEvaluation.create({
        data: {
          defenseId,
          evaluatorId: userId,
          evaluatorRank: registration.userRank,
          evaluatorWeight: getEvaluatorWeight(registration.userRank),
          isAdmin: registration.isAdmin,
          overallReview,
          totalScore,
          criteriaScores: {
            createMany: {
              data: submittedScores,
            },
          },
        },
      });

      return ok(evaluation);
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/expert-jury-only/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus } from "@prisma/client";
import { DefenseEvaluationWithScores, calculateDefenseResult } from "@/lib/defense-scoring";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;

     1. Fetch Defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

    // 2. Toggle Flag
    return await prisma.$transaction(async (tx) => {
      const updatedDefense = await (tx as any).publicDefense.update({
        where: { id: defenseId },
        data: {
          expertJuryOnly: !defense.expertJuryOnly,
          expertJuryOnlySetById: user.id,
          expertJuryOnlySetAt: new Date(),
        },
      });

      // 3. Recalculate Result if exists
      if (defense.result) {
        const allEvaluations = await (tx as any).defenseEvaluation.findMany({
          where: { defenseId },
          include: { criteriaScores: true },
        }) as DefenseEvaluationWithScores[];

        const settings = await (tx as any).defenseCriteriaSettings.findUnique({
          where: { id: "singleton" },
        });

        if (!settings) throw new Error("Defense settings not found");

        const resultData = calculateDefenseResult(
          updatedDefense,
          allEvaluations,
          settings.passThreshold,
          settings.ratingScale
        );

        await (tx as any).defenseResult.update({
          where: { defenseId },
          data: {
            adminAverage: resultData.adminAverage,
            adminPassed: resultData.adminPassed,
            adminCount: resultData.adminCount,
            expertAverage: resultData.expertAverage,
            expertPassed: resultData.expertPassed,
            expertCount: resultData.expertCount,
            galleryWeighted: resultData.galleryWeighted,
            galleryCount: resultData.galleryCount,
            galleryExcluded: resultData.galleryExcluded,
            finalScore: resultData.finalScore,
            passed: resultData.passed,
            provisional: resultData.provisional,
            provisionalReason: resultData.provisionalReason,
            calculatedAt: new Date(),
          },
        });

        // Update defense status if it's already finalized
        const finalizedStatuses = ["PASSED", "FAILED", "PROVISIONAL"];
        if (finalizedStatuses.includes(updatedDefense.status)) {
            const finalStatus = resultData.provisional 
                 ? "PROVISIONAL" 
                 : (resultData.passed ? "PASSED" : "FAILED");
                 
            await (tx as any).publicDefense.update({
                where: { id: defenseId },
                data: { status: finalStatus },
            });
        }
      }

      // Log to AdminAuditLog
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "TOGGLE_EXPERT_JURY_ONLY",
          details: `Expert Jury Only set to ${!defense.expertJuryOnly} for defense ${defenseId}`,
        },
      });

      return ok(updatedDefense);
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/open/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;

     1. Fetch and validate defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        registrations: { select: { userId: true } },
      },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status !== DefenseStatus.SCHEDULED && defense.status !== DefenseStatus.MINIMUM_NOT_MET) {
        return err(`Cannot open defense in ${defense.status} status`);
    }

    // 2. Update status and log opener
    const updatedDefense = await (prisma as any).publicDefense.update({
      where: { id: defenseId },
      data: {
        status: DefenseStatus.OPEN,
        evaluationOpen: true,
        evaluationOpenedAt: new Date(),
        evaluationOpenedById: user.id,
      },
    });

    // 3. Notify all registered evaluators
    const registrations = defense.registrations;
    const projectTitle = defense.team.project.title;

    if (registrations.length > 0) {
      await prisma.notification.createMany({
        data: registrations.map((r: any) => ({
          userId: r.userId,
          type: "PUBLIC_DEFENSE" as any,
          title: "Evaluation Open",
          body: `Evaluation is now open for ${projectTitle}. Submit your scores at /evaluations`,
          actionUrl: "/evaluations",
        })),
      });
    }

    return ok(updatedDefense);
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/register/route.ts**
  - Methods: POST, DELETE
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { Rank, DefenseStatus } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

/**
 * Register to evaluate a defense
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const userId = session.user.id;
    const defenseId = params.id;

     1. Fetch defense and user details
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { members: { select: { userId: true } } } },
        registrations: { select: { userRank: true, isAdmin: true } },
      },
    });

    if (!defense) return err("Defense not found", 404);

    if (defense.status !== DefenseStatus.SCHEDULED && defense.status !== DefenseStatus.OPEN) {
      return err("Registration is only allowed for scheduled or open defenses");
    }

    // 2. Validate user is not a team member
    const isTeamMember = defense.team.members.some((m: any) => m.userId === userId);
    if (isTeamMember) return err("You cannot register to evaluate your own team's project", 403);

    // 3. Check if already registered
    const existing = await (prisma as any).defenseRegistration.findUnique({
      where: { defenseId_userId: { defenseId, userId } },
    });
    if (existing) return err("You are already registered for this defense");

    // 4. Determine admin and expert status
    const userRank = session.user.currentRank;
    const permissions = session.user.permissions as string[] | [];
    const isAdmin = hasPermission(permissions, "CAN_MANAGE_DEFENSES");

    // 5. Create registration and update minimumMet
    return await prisma.$transaction(async (tx) => {
      const registration = await (tx as any).defenseRegistration.create({
        data: {
          defenseId,
          userId,
          userRank,
          isAdmin,
        },
      });

      // Recalculate minimumMet
      const currentRegistrations = [...defense.registrations, { userRank, isAdmin }];
      const adminCount = currentRegistrations.filter(r => r.isAdmin).length;
      const expertCount = currentRegistrations.filter(r => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length;
      
      const minimumMet = adminCount >= 1 && expertCount >= 2;

      if (minimumMet !== defense.minimumMet) {
        await (tx as any).publicDefense.update({
          where: { id: defenseId },
          data: { minimumMet, status: minimumMet ? DefenseStatus.SCHEDULED : DefenseStatus.MINIMUM_NOT_MET },
        });
      }

      return ok(registration);
    });
  } catch (error: any) {
    return err(error.message);
  }
}

/**
 * Cancel registration
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const userId = session.user.id;
    const defenseId = params.id;

    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: { registrations: true },
    });

    if (!defense) return err("Defense not found", 404);
    if (defense.status === DefenseStatus.OPEN) {
      return err("Cannot cancel registration once the defense has started");
    }

    return await prisma.$transaction(async (tx) => {
      await (tx as any).defenseRegistration.delete({
        where: { defenseId_userId: { defenseId, userId } },
      });

      // Recalculate minimumMet
      const updatedRegistrations = defense.registrations.filter((r: any) => r.userId !== userId);
      const adminCount = updatedRegistrations.filter((r: any) => r.isAdmin).length;
      const expertCount = updatedRegistrations.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length;
      
      const minimumMet = adminCount >= 1 && expertCount >= 2;

      if (minimumMet !== defense.minimumMet) {
        await (tx as any).publicDefense.update({
          where: { id: defenseId },
          data: { minimumMet, status: minimumMet ? DefenseStatus.SCHEDULED : DefenseStatus.MINIMUM_NOT_MET },
        });
      }

      return ok({ cancelled: true });
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/reopen/route.ts**
  - Methods: PATCH
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";
import { ok, err } from "@/lib/api";
import { DefenseStatus, NotificationType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("CAN_MANAGE_DEFENSES");
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const defenseId = params.id;
    const { note } = await req.json();

    if (!note || note.trim().length < 10) {
      return err("A descriptive note (min 10 chars) is required to reopen a defense");
    }

     1. Fetch Defense
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: defenseId },
      include: {
        team: { include: { project: true } },
        registrations: { select: { userId: true } },
        evaluations: { select: { evaluatorId: true } },
      },
    });

    if (!defense) return err("Defense not found", 404);
    
    if (defense.reopened) return err("This defense has already been reopened once");
    
    const validStatuses = [DefenseStatus.CLOSED, DefenseStatus.PROVISIONAL];
    if (!validStatuses.includes(defense.status)) {
        return err(`Cannot reopen defense in ${defense.status} status`);
    }

    // 2. Update Defense
    const updatedDefense = await (prisma as any).publicDefense.update({
      where: { id: defenseId },
      data: {
        status: DefenseStatus.OPEN,
        evaluationClosed: false,
        reopened: true,
        reopenedAt: new Date(),
        reopenedById: user.id,
        reopenNote: note,
      },
    });

    // 3. Notify evaluators who haven't submitted
    const submittedIds = new Set(defense.evaluations.map((e: any) => e.evaluatorId));
    const unsubmitted = defense.registrations.filter((r: any) => !submittedIds.has(r.userId));
    const projectTitle = defense.team.project.title;

    if (unsubmitted.length > 0) {
      await prisma.notification.createMany({
        data: unsubmitted.map((r: any) => ({
          userId: r.userId,
          type: "PUBLIC_DEFENSE" as any,
          title: "Evaluation Reopened",
          body: `Evaluation reopened for ${projectTitle}. You can now submit your scores.`,
          actionUrl: "/evaluations",
        })),
      });
    }

    // Log to AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        actorId: user.id,
        action: "REOPEN_DEFENSE",
        details: `Defense ${defenseId} reopened. Reason: ${note}`,
      },
    });

    return ok(updatedDefense);
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/result/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: params.id },
      include: {
        team: { include: { project: true, members: { include: { user: { select: { id: true } } } } } },
        result: true,
        evaluations: {
          include: {
            criteriaScores: {
              include: { criteria: true },
            },
          },
        },
      },
    });

    if (!defense) return err("Defense not found", 404);

    const result = defense.result;
    if (!result) return err("Results not yet available", 400);

     Check if user is a team member
    const isTeamMember = defense.team.members.some((m: any) => m.user.id === session.user.id);

    // Build anonymous evaluator feedback
    const evaluatorFeedback = defense.evaluations.map((ev: any) => {
      let label = "Club Member";
      if (ev.isAdmin) label = "Admin";
      else if (ev.evaluatorRank === "S") label = "S Rank Evaluator";
      else if (ev.evaluatorRank === "A") label = "A Rank Evaluator";
      else if (ev.evaluatorRank === "B") label = "B Rank Member";
      else if (ev.evaluatorRank === "C") label = "C Rank Member";
      else if (ev.evaluatorRank === "D") label = "D Rank Member";
      else label = "Gallery Member";

      const tier = ev.isAdmin ? "admin" : (ev.evaluatorRank === "A" || ev.evaluatorRank === "S") ? "expert" : "gallery";

      return {
        label,
        tier,
        overallReview: ev.overallReview,
        totalScore: ev.totalScore,
        criteriaScores: ev.criteriaScores.map((cs: any) => ({
          criteriaName: cs.criteria?.name || "Unknown",
          score: cs.score,
          note: cs.note,
        })),
      };
    });

    // Build criteria averages for radar chart
    const criteriaMap: Record<string, { name: string; scores: number[] }> = {};
    defense.evaluations.forEach((ev: any) => {
      ev.criteriaScores.forEach((cs: any) => {
        const name = cs.criteria?.name || cs.criteriaId;
        if (!criteriaMap[name]) criteriaMap[name] = { name, scores: [] };
        criteriaMap[name].scores.push(cs.score);
      });
    });

    const criteriaAverages = Object.values(criteriaMap).map(c => ({
      name: c.name,
      average: c.scores.reduce((a, b) => a + b, 0) / c.scores.length,
    })).sort((a, b) => b.average - a.average);

    return ok({
      id: defense.id,
      status: defense.status,
      project: {
        title: defense.team.project.title,
        rank: defense.team.project.rank,
      },
      teamName: defense.team.name,
      isTeamMember,
      result: {
        adminAverage: result.adminAverage,
        adminPassed: result.adminPassed,
        adminCount: result.adminCount,
        expertAverage: result.expertAverage,
        expertPassed: result.expertPassed,
        expertCount: result.expertCount,
        galleryWeighted: result.galleryWeighted,
        galleryCount: result.galleryCount,
        galleryExcluded: result.galleryExcluded,
        finalScore: result.finalScore,
        passed: result.passed,
        provisional: result.provisional,
        provisionalReason: result.provisionalReason,
        dispelledNote: defense.dispelledNote,
      },
      evaluatorFeedback,
      criteriaAverages,
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/[id]/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { Rank } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return err("Unauthorized", 401);

  try {
    const defense = await (prisma as any).publicDefense.findUnique({
      where: { id: params.id },
      include: {
        team: { 
          include: { 
            project: true,
            evaluations: {
              where: { teamResponse: { not: null } },
              take: 1
            }
          } 
        },
        registrations: {
          select: { userRank: true, isAdmin: true },
        },
        evaluations: {
          select: { id: true },
        },
        result: true,
      },
    });

    if (!defense) return err("Defense not found", 404);

     Format registration counts by tier
    const registrations = defense.registrations;
    const registrationTiers = {
      admin: registrations.filter((r: any) => r.isAdmin).length,
      expert: registrations.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length,
      gallery: registrations.filter((r: any) => !r.isAdmin && r.userRank !== Rank.A && r.userRank !== Rank.S).length,
    };

    // Evaluation count
    const evaluationCount = defense.evaluations.length;

    // Check if team has submitted feedback (to reveal result)
    const teamHasSubmittedFeedback = defense.team.evaluations.length > 0;
    
    const result = (defense.result && teamHasSubmittedFeedback) ? defense.result : null;

    const { registrations: _, evaluations: __, team: ___, ...rest } = defense;

    return ok({
      ...rest,
      team: {
        id: defense.team.id,
        name: defense.team.name,
        project: defense.team.project
      },
      registrationTiers,
      evaluationCount,
      result,
    });
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/defenses/criteria/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: Handles API requests for criteria

- **/src/app/api/defenses/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ok, err } from "@/lib/api";
import { Rank, TeamStatus, Status, DefenseStatus, NotificationType } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return err("Unauthorized", 401);

  try {
    const defenses = await (prisma as any).publicDefense.findMany({
      where: {
        status: { in: [DefenseStatus.SCHEDULED, DefenseStatus.OPEN] },
      },
      include: {
        team: { include: { project: true } },
        _count: {
          select: { registrations: true },
        },
        registrations: {
          select: { userRank: true, isAdmin: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

     Format registration counts by tier
    const formattedDefenses = defenses.map((d: any) => {
      const registrations = d.registrations;
      const tiers = {
        admin: registrations.filter((r: any) => r.isAdmin).length,
        expert: registrations.filter((r: any) => !r.isAdmin && (r.userRank === Rank.A || r.userRank === Rank.S)).length,
        gallery: registrations.filter((r: any) => !r.isAdmin && r.userRank !== Rank.A && r.userRank !== Rank.S).length,
      };

      const { registrations: _, ...rest } = d;
      return { ...rest, registrationTiers: tiers };
    });

    return ok(formattedDefenses);
  } catch (error: any) {
    return err(error.message);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return err("Unauthorized", 401);

  try {
    const { scheduledAt } = await req.json();
    const userId = session.user.id;

    // 1. Find the user's active team at A or S rank
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          status: TeamStatus.ACTIVE,
          rank: { in: [Rank.A, Rank.S] },
        },
      },
      include: {
        team: {
          include: {
            project: true,
            publicDefense: true,
          },
        },
      },
    });

    if (!teamMember) {
      return err("You must be in an active A or S rank team to schedule a defense", 403);
    }

    const team = teamMember.team;

    // 2. Check if the team already has a defense that isn't FAILED or RESCHEDULED
    if (team.publicDefense && team.publicDefense.status !== DefenseStatus.FAILED && team.publicDefense.status !== DefenseStatus.RESCHEDULED) {
      return err("Your team already has a scheduled or active defense");
    }

    // 3. Validate scheduledAt
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return err("Scheduled time must be in the future");
    }

    // 4. Create PublicDefense
    const defense = await (prisma as any).publicDefense.create({
      data: {
        teamId: team.id,
        projectId: team.projectId,
        scheduledAt: scheduledDate,
        status: DefenseStatus.SCHEDULED,
      },
      include: {
        team: { include: { project: true } },
      },
    });

    // 5. Send notifications to ALL active members
    const activeUsers = await prisma.user.findMany({
      where: { status: Status.ACTIVE },
      select: { id: true },
    });

    const projectTitle = team.project.title;
    const teamName = team.name || "Unnamed Team";
    const formattedDate = scheduledDate.toLocaleString();

    await prisma.notification.createMany({
      data: activeUsers.map((u) => ({
        userId: u.id,
        type: "PUBLIC_DEFENSE" as any,
        title: "Public Defense Scheduled",
        body: `${projectTitle} by ${teamName} — ${formattedDate}. Register to evaluate at /evaluations`,
        actionUrl: "/evaluations",
      })),
    });

    return ok(defense);
  } catch (error: any) {
    return err(error.message);
  }
}

- **/src/app/api/evaluations/[id]/feedback/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { rating, comment, fromRole } = await req.json();

		if (!rating || !fromRole) {
			return err("Rating and role are required", 400);
		}

		const evaluation = await prisma.evaluation.findUnique({
			where: { id: params.id },
			include: {
				team: {
					include: {
						members: true,
					},
				},
			},
		});

		if (!evaluation) return err("Evaluation not found", 404);

		 Authorization
		const isTeamMember = evaluation.team.members.some(m => m.userId === session.user.id);
		const isEvaluator = evaluation.evaluatorId === session.user.id;

		if (fromRole === "TEAM" && !isTeamMember) return err("Forbidden", 403);
		if (fromRole === "EVALUATOR" && !isEvaluator) return err("Forbidden", 403);

		// Determine recipient
		const data: any = {
			evaluationId: params.id,
			rating,
			comment,
			fromRole,
		};

		if (fromRole === "TEAM") {
			data.toEvaluatorId = evaluation.evaluatorId;
		} else {
			data.toTeamId = evaluation.teamId;
		}

		// Create feedback
		const feedback = await (prisma as any).evaluationFeedback.create({ data });

		return ok(feedback);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/[id]/final-verdict/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkAdvancementEligibility } from "@/lib/rank-advancement";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

		const evaluation = await prisma.evaluation.findUnique({
			where: { id: params.id },
			include: { team: { include: { project: true } } }
		});

		if (!evaluation) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

		const teamId = evaluation.teamId;

		const allEvals = await prisma.evaluation.findMany({
			where: { teamId, status: "COMPLETED" as any }
		});

		 Require all completed evaluations to have passed
		const passed = allEvals.length > 0 && allEvals.every(e => e.passed);
		let newRank = null;

		if (passed) {
			// Mark team as COMPLETED explicitly
			await prisma.team.update({
				where: { id: teamId },
				data: { status: "COMPLETED" }
			});

			// Check rank advancement using the team leader ID assuming they are the main user
			// Or better yet, the session user since we are doing this for them
			const eligibility = await checkAdvancementEligibility(session.user.id, evaluation.team.project.rank);
			
			if (eligibility.isEligible) {
				const ranks = ["E", "D", "C", "B", "A", "S"];
				const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }});
				const userRankIdx = ranks.indexOf(currentUser?.currentRank || "E");
				
				// Only advance if the project's rank is the user's current rank to prevent advancing multiple ranks at once
				if (evaluation.team.project.rank === currentUser?.currentRank && userRankIdx < ranks.length - 1) {
					newRank = ranks[userRankIdx + 1];
					
					// Update user's rank
					await prisma.user.update({
						where: { id: session.user.id },
						data: { currentRank: newRank as any }
					});
				}
			}
		}

		return NextResponse.json({ ok: true, passed, newRank });
	} catch (error) {
		return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
	}
}

- **/src/app/api/evaluations/[id]/result/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const evaluation = await prisma.evaluation.findUnique({
			where: { id: params.id },
			include: {
				evaluator: {
					select: {
						id: true,
						login: true,
						name: true,
						image: true,
						currentRank: true,
					},
				},
				team: {
					include: {
						members: true,
					},
				},
				feedback: {
					where: { fromRole: "TEAM" as any },
				},
			},
		});

		if (!evaluation) return err("Evaluation not found", 404);

		 Authorization: Only team members or the evaluator or admin can see results
		const isTeamMember = (evaluation as any).team.members.some((m: any) => m.userId === session.user.id);
		const isEvaluator = evaluation.evaluatorId === session.user.id;
		const isAdmin = (session.user as any).isAdmin;

		if (!isTeamMember && !isEvaluator && !isAdmin) {
			return err("Forbidden", 403);
		}

		// Disclosure Policy: If team member, must have submitted feedback OR 24h passed
		// EXCEPT: The evaluator can always see the results they submitted.
		if (isTeamMember && !isEvaluator && !isAdmin) {
			const hasSubmittedFeedback = (evaluation as any).feedback.length > 0;
			const timeSinceCompletion = Date.now() - new Date(evaluation.completedAt || evaluation.updatedAt).getTime();
			const twentyFourHours = 24 * 60 * 60 * 1000;

			if (!hasSubmittedFeedback && timeSinceCompletion < twentyFourHours) {
				return err("Feedback required before viewing results", 403);
			}
		}

		// Count COMPLETED evaluations for this team/project to determine if it's the final one
		const completedCount = await prisma.evaluation.count({
			where: {
				teamId: evaluation.teamId,
				projectId: (evaluation as any).projectId,
				status: "COMPLETED" as any,
			},
		});

		// isFinal is true if there are at least 1 completed evaluation before this one (so this is 2nd+)
		// Or we can base it on a specific count if known. Using >= 2 as per user "second or third".
		const isFinal = completedCount >= 2;

		return ok({ 
			...evaluation, 
			attemptCount: completedCount,
			isFinal,
			isEvaluatee: isTeamMember
		});
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/availability/[id]/route.ts**
  - Methods: DELETE
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { NotificationType, SlotStatus } from "@prisma/client";

 DELETE /api/evaluations/availability/[id]
// Closes an availability window
export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const windowId = params.id;
		const window = await (prisma as any).availabilityWindow.findUnique({
			where: { id: windowId },
			include: {
				team: {
					include: { members: true }
				},
				slots: {
					where: { status: "CLAIMED" },
				}
			}
		});

		if (!window) return err("Availability window not found", 404);

		// Check permissions (leader or admin)
		const isLeader = window.team.leaderId === session.user.id;
		const isAdmin = session.user.role === "ADMIN" || session.user.role === "STAFF";
		if (!isLeader && !isAdmin) return err("Forbidden", 403);

		const now = new Date();
		const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);

		// 15-minute cancellation rule
		const hasTightSlots = window.slots.some((s: any) => s.slotStart <= fifteenMinsFromNow);
		
		if (hasTightSlots) {
			await prisma.conflictFlag.create({
				data: {
					teamId: window.teamId,
					raisedById: session.user.id,
					description: `Late cancellation of evaluation availability (within 15 mins of a claimed slot).`,
				}
			});
		}

		// Notify affected evaluators
		for (const slot of window.slots) {
			if (slot.claimedById) {
				await prisma.notification.create({
					data: {
						userId: slot.claimedById,
						type: (NotificationType as any).EVAL_CANCELLED || "GENERAL",
						title: "Evaluation Cancelled",
						body: `The squad has closed their availability for your claimed slot at ${new Date(slot.slotStart).toLocaleTimeString()}.`,
						actionUrl: `/cursus`,
					}
				});
			}
		}

		// Close window
		await (prisma as any).availabilityWindow.update({
			where: { id: windowId },
			data: { isOpen: false }
		});

		// Also cancel all individual slots that were open/claimed in this window
		await (prisma as any).evaluationSlot.updateMany({
			where: { availabilityWindowId: windowId, status: { in: ["OPEN", "CLAIMED"] } },
			data: { status: "OPEN" } 
		});

		return ok({ success: true, strikeLogged: hasTightSlots });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/availability/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { NotificationType, Status, TeamStatus } from "@prisma/client";
import { getClubSettings } from "@/lib/club-settings";

 POST /api/evaluations/availability
// Creates AvailabilityWindow(s) and triggers notifications
export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { teamId, windows } = await req.json();
		if (!teamId || !windows || !Array.isArray(windows)) {
			return err("teamId and windows array are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: true,
				evaluations: true,
			}
		});

		if (!team) return err("Team not found", 404);
		if (team.leaderId !== session.user.id) return err("Only leader can set availability", 403);

		// --- Cooldown Escalation Logic ---
		const previousEvals = await prisma.evaluation.findMany({
			where: {
				teamId: team.id,
				OR: [
					{ status: "FAILED" },
					{ status: "COMPLETED", passed: false }
				] as any,
			},
			orderBy: { completedAt: "desc" },
		});

		const attemptCount = previousEvals.length + 1;
		const lastEval = previousEvals[0];
		const isAdmin = session.user.role === "ADMIN";
		const isImpersonating = !!(session.user as any).impersonatorId;

		if (attemptCount > 2 && lastEval && !isAdmin && !isImpersonating) {
			const lastDate = new Date(lastEval.completedAt || lastEval.updatedAt);
			const now = new Date();
			const hoursSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
			
			if (attemptCount <= 4 && hoursSinceLast < 24) {
				return err("Cooldown active: 1 day wait required after 2 failed attempts", 403);
			}
			if (attemptCount <= 6 && hoursSinceLast < 72) {
				return err("Cooldown active: 3 day wait required after 4 failed attempts", 403);
			}
			if (attemptCount > 6 && !(team as any).nextAttemptApproved) {
				return err("Maximum failed attempts exceeded. Requires manual approval from VP or President.", 403);
			}
		}

		// 1. Create Windows
		const createdWindows = [];
		for (const w of windows) {
			const start = new Date(w.startTime);
			const end = new Date(w.endTime);

			// Validate 1h minimum
			if (end.getTime() - start.getTime() < 1 * 60 * 60 * 1000) {
				return err("Availability window must be at least 1 hour", 400);
			}

			// Validate no overlap
			const overlap = await (prisma as any).availabilityWindow.findFirst({
				where: {
					teamId,
					isOpen: true,
					OR: [
						{ startTime: { lt: end }, endTime: { gt: start } }
					]
				}
			});
			if (overlap) return err(`Overlap detected for window starting at ${start.toISOString()}`, 400);

			const newWindow = await (prisma as any).availabilityWindow.create({
				data: {
					teamId,
					startTime: start,
					endTime: end,
				}
			});
			createdWindows.push(newWindow);
		}

		// Update team status to EVALUATING if it wasn't already
		if (team.status !== TeamStatus.EVALUATING) {
			await prisma.team.update({
				where: { id: teamId },
				data: { status: TeamStatus.EVALUATING }
			});
		}

		// 2. Trigger Anti-Snipe Notifications (similar to old logic but adapted)
		const settings = await getClubSettings();
		const allUsers = await prisma.user.findMany({ where: { status: Status.ACTIVE } });
		
		const teamInfo = {
			id: team.id,
			members: team.members.map(m => ({ userId: m.userId })),
			evaluations: team.evaluations,
		};
		const projectInfo = {
			id: team.project.id,
			rank: team.project.rank,
		};

		const antiSnipeBaseSeconds = settings.antiSnipeMinutes * 60;
		const antiSnipeMaxSeconds = antiSnipeBaseSeconds * 3;

		for (const user of allUsers) {
			const isEligible = isEligibleEvaluator(user as any, teamInfo, projectInfo);
			if (isEligible) {
				const randomDelay = Math.floor(Math.random() * (antiSnipeMaxSeconds - antiSnipeBaseSeconds + 1) + antiSnipeBaseSeconds);
				const deliverAt = new Date(Date.now() + randomDelay * 1000);

				await prisma.notification.create({
					data: {
						userId: user.id,
						type: NotificationType.EVAL_SLOT_AVAILABLE,
						title: "New Availability Opened",
						body: `Squad ${(team as any).name || 'Unnamed'} is available for ${team.project.title} evaluations.`,
						actionUrl: `/cursus/projects/${team.project.id}`,
						deliverAt,
					}
				});
			}
		}

		return ok({ windows: createdWindows });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

// GET /api/evaluations/availability?teamId=...
// Returns all windows for a team with anonymized claimer info
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const teamId = searchParams.get("teamId");
		if (!teamId) return err("teamId is required", 400);

		const windows = await (prisma as any).availabilityWindow.findMany({
			where: { teamId, isOpen: true },
			include: {
				slots: {
					include: {
						claimedBy: {
							select: {
								id: true,
								login: true,
								name: true,
								image: true,
							}
						}
					}
				}
			},
			orderBy: { startTime: "asc" }
		});

		// Anonymization Logic
		const now = new Date();
		const anonymizedWindows = windows.map((w: any) => ({
			...w,
			slots: w.slots.map((s: any) => {
				const revealingIn = s.slotStart.getTime() - now.getTime() - (15 * 60 * 1000);
				const shouldReveal = revealingIn <= 0;

				return {
					...s,
					claimedBy: s.claimedBy ? (shouldReveal ? s.claimedBy : { login: "████████", revealingIn }) : null
				};
			})
		}));

		return ok(anonymizedWindows);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/available/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { getTacticalMask } from "@/lib/utils/evaluation-utils";

 GET /api/evaluations/available
// Returns all availability windows where current user is eligible to evaluate
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return err("User not found", 404);

		// Fetch all open availability windows starting in the future
		const allWindows = await (prisma as any).availabilityWindow.findMany({
			where: {
				isOpen: true,
				endTime: { gt: new Date() },
				team: {
					members: { none: { userId } } // User cannot evaluate their own team
				}
			},
			include: {
				team: {
					include: {
						project: true,
						members: true,
						evaluations: true,
						evaluationSlots: {
							select: { claimedById: true }
						}
					}
				},
				slots: true,
			},
			orderBy: { startTime: "asc" }
		});

		// Filter by eligibility
		const availableMissions = allWindows.filter((window: any) => {
			const teamInfo = {
				id: window.team.id,
				members: window.team.members.map((m: any) => ({ userId: m.userId })),
				evaluations: window.team.evaluations,
				claims: window.team.evaluationSlots
			};
			const projectInfo = {
				id: window.team.project.id,
				rank: window.team.project.rank,
			};

			return isEligibleEvaluator(user as any, teamInfo, projectInfo);
		});

		// Tactical Anonymization (mask squad name)
		const anonymousMissions = availableMissions.map((window: any) => {
			const adjective = getTacticalMask(window.teamId);
			return {
				id: window.id,
				startTime: window.startTime,
				endTime: window.endTime,
				project: {
					title: window.team.project.title,
					rank: window.team.project.rank,
				},
				maskedSquad: `a ${adjective} squad`,
				slots: window.slots,
			};
		});

		return ok(anonymousMissions);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/calibration/submit/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for submit

- **/src/app/api/evaluations/history/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

 GET /api/evaluations/history
// Returns completed evaluations given by the current user
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;

		const history = await (prisma as any).evaluationSlot.findMany({
			where: {
				claimedById: userId,
				status: { in: ["COMPLETED", "NO_SHOW"] }
			},
			include: {
				team: {
					include: {
						project: { select: { title: true } },
						leader: { select: { login: true } }
					}
				},
				evaluations: {
					include: { feedback: true }
				}
			},
			orderBy: { slotStart: "desc" }
		});

		return ok(history);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/slots/[id]/claim/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: POST /api/evaluations/slots/[id]/claim
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { EvaluationStatus, NotificationType, Rank, SlotStatus } from "@prisma/client";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const slotId = params.id;
		const userId = session.user.id;

		// Run atomically with transaction to avoid double booking
		const evaluation = await prisma.$transaction(async (tx) => {
			const slot = await tx.evaluationSlot.findUnique({
				where: { id: slotId },
				include: {
					team: {
						include: {
							project: true,
							members: true,
							evaluations: { select: { evaluatorId: true } },
							evaluationSlots: { select: { claimedById: true } },
						},
					},
					evaluations: {
						include: {
							evaluator: {
								select: { id: true, role: true, currentRank: true },
							},
						},
					},
				},
			});

			if (!slot) {
				throw new Error("Evaluation slot not found");
			}

			if (slot.status !== "OPEN") {
				throw new Error("This evaluation slot is no longer open");
			}

			const user = await tx.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				throw new Error("User not found");
			}

			// Check anti-snipe: find a notification tied to this specific slot
			const notification = await tx.notification.findFirst({
				where: {
					userId: userId,
					type: NotificationType.EVAL_SLOT_AVAILABLE,
					actionUrl: `/cursus?slotId=${slotId}`,
					deliverAt: { lte: new Date() },
				},
			});

			if (!notification) {
				throw new Error("Evaluation slot not yet available");
			}

			// Check generic eligibility
			const teamInfo = {
				id: slot.team.id,
				members: slot.team.members.map((m) => ({ userId: m.userId })),
				evaluations: slot.team.evaluations,
				claims: slot.team.evaluationSlots,
			};

			const projectInfo = {
				id: slot.team.project.id,
				rank: slot.team.project.rank,
			};

			const evaluatorInfo = {
				id: user.id,
				currentRank: user.currentRank,
				role: user.role,
			};

			const isEligible = isEligibleEvaluator(evaluatorInfo, teamInfo, projectInfo);
			if (!isEligible) {
				throw new Error("You are not eligible to claim this evaluation");
			}

			// --- Cooldown Escalation Logic ---
			const previousEvals = await tx.evaluation.findMany({
				where: {
					teamId: slot.teamId,
					status: { in: ["COMPLETED", "FAILED"] as any },
				},
				orderBy: { completedAt: "desc" },
			});

			const attemptCount = previousEvals.length + 1;
			const lastEval = previousEvals[0];

			if (attemptCount > 2 && lastEval) {
				const lastDate = new Date(lastEval.completedAt || lastEval.updatedAt);
				const now = new Date();
				const hoursSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
				
				if (attemptCount <= 4 && hoursSinceLast < 24) {
					throw new Error("Cooldown active: 1 day wait required after 2 attempts");
				}
				if (attemptCount <= 6 && hoursSinceLast < 72) {
					throw new Error("Cooldown active: 3 day wait required after 4 attempts");
				}
				if (attemptCount > 6 && !(slot.team as any).nextAttemptApproved) {
					throw new Error("Maximum attempts exceeded. Requires manual approval from VP or President.");
				}
			}

			// --- Staff / peer eval enforcement ---
			const isHighRank = slot.team.project.rank === Rank.A || slot.team.project.rank === Rank.S;

			// Count existing peer and staff evals on this slot
			let peerEvalCount = 0;
			let staffEvalCount = 0;
			for (const existingEval of slot.evaluations) {
				if (existingEval.evaluator.role === "STUDENT") {
					peerEvalCount++;
				} else {
					staffEvalCount++;
				}
			}

			const isCurrentUserStaff = user.role !== "STUDENT";

			if (isHighRank) {
				// A/S rank: max 2 peer + 1 staff = 3 total
				if (isCurrentUserStaff) {
					if (staffEvalCount >= 1) {
						throw new Error("Staff evaluation slot is already filled");
					}
				} else {
					if (peerEvalCount >= 2) {
						throw new Error("Peer evaluation slots are already filled");
					}
				}
				if (slot.evaluations.length >= 3) {
					throw new Error("Maximum evaluations for this slot have already been claimed");
				}
			} else {
				// All other ranks: max 2 peer evals, no staff eval
				if (peerEvalCount >= 2) {
					throw new Error("Peer evaluation slots are already filled");
				}
				if (slot.evaluations.length >= 2) {
					throw new Error("Maximum evaluations for this slot have already been claimed");
				}
			}

			// Create the evaluation
			const newEval = await tx.evaluation.create({
				data: {
					teamId: slot.teamId,
					projectId: slot.team.project.id,
					evaluatorId: userId,
					slotId: slot.id,
					status: EvaluationStatus.PENDING,
					claimedAt: new Date(),
				},
			});

			// Determine if slot should be marked FILLED
			const totalAfterClaim = slot.evaluations.length + 1;
			const maxClaimed = isHighRank ? 3 : 2;
			if (totalAfterClaim >= maxClaimed) {
				await tx.evaluationSlot.update({
					where: { id: slot.id },
					data: { status: SlotStatus.CLAIMED },
				});
			}

			return newEval;
		});

		return ok(evaluation);
	} catch (error: unknown) {
		const statusMap: Record<string, number> = {
			"Evaluation slot not yet available": 403,
			"Forbidden": 403,
			"You are not eligible to claim this evaluation": 403,
			"Evaluation slot not found": 404,
		};
		const errorMessage = (error as Error).message.replace(/^Error: /, "");
		const status = statusMap[errorMessage] || 400;

		return err(errorMessage, status);
	}
}

- **/src/app/api/evaluations/slots/[id]/no-show/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { SlotStatus } from "@prisma/client";

 PATCH /api/evaluations/slots/[id]/no-show
// Records an evaluator no-show and logs a strike
export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const slotId = params.id;
		const slot = await prisma.evaluationSlot.findUnique({
			where: { id: slotId },
			include: { team: true }
		});

		if (!slot) return err("Slot not found", 404);

		// Logic check: Can only be called if slotStart + 30m has passed and status is CLAIMED
		const now = new Date();
		const thirtyMinsAfterStart = new Date(slot.slotStart.getTime() + 30 * 60 * 1000);

		if (now < thirtyMinsAfterStart) {
			return err("Cannot mark as no-show until 30 minutes after slot start", 400);
		}
		if (slot.status !== SlotStatus.CLAIMED) {
			return err("Slot is not in CLAIMED status", 400);
		}

		// Update slot
		await prisma.evaluationSlot.update({
			where: { id: slotId },
			data: { status: SlotStatus.NO_SHOW }
		});

		// Log a strike against the evaluator
		await prisma.conflictFlag.create({
			data: {
				teamId: slot.teamId,
				raisedById: slot.team.leaderId, // Team leader "raises" the flag automatically
				description: `Evaluator no-show for slot starting at ${slot.slotStart.toLocaleTimeString()}.`,
				// Note: Real strike logic (3 strikes = suspension) would be handled by a separate background worker or admin check
			}
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/slots/[id]/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: Handles API requests for [id]

- **/src/app/api/evaluations/slots/[id]/submit/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { calculateScore } from "@/lib/eval-scoring";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { responses, writtenFeedback, durationSeconds, sheetVersion } = await req.json();

		const slot = await (prisma as any).evaluationSlot.findUnique({
			where: { id: params.id },
			include: {
				team: {
					include: {
						project: {
							include: {
								evalSheet: {
									include: {
										sections: {
											include: {
												questions: true,
											},
										},
									},
								} as any,
							},
						},
					},
				},
			},
		});

		if (!slot) return err("Slot not found", 404);
		if ((slot as any).claimedById !== session.user.id) return err("Not your slot to evaluate", 403);
		if (slot.status === "COMPLETED" as any) return err("Already submitted", 400);

		const sheet = (slot as any).team.project.evalSheet;
		if (!sheet) return err("Evaluation rubric not found for this project", 400);

		 Calculate score
		const scoring = calculateScore(sheet, responses);

		// Atomic update
		const result = await prisma.$transaction(async (tx) => {
			// 1. Create evaluation record if it doesn't exist, or update it
			// Usually an Evaluation record is created when a slot is claimed.
			// Let's check for an existing evaluation for this slot.
			let evaluation = await tx.evaluation.findFirst({
				where: { slotId: slot.id }
			});

			if (!evaluation) {
				// This shouldn't happen based on previous flows, but fallback
				evaluation = await tx.evaluation.create({
					data: {
						slotId: slot.id,
						evaluatorId: session.user.id,
						teamId: slot.teamId,
						projectId: slot.team.projectId,
						status: "COMPLETED",
					}
				});
			}

			// 2. Anomaly Detection & Consistency Check
			const previousEval = await (tx as any).evaluation.findFirst({
				where: {
					teamId: slot.teamId,
					sheetVersion: sheetVersion,
					status: "COMPLETED" as any,
				},
				orderBy: { completedAt: "desc" },
			});

			let isAnomaly = false;
			let anomalyNote = null;
			if (previousEval && previousEval.totalScore !== null) {
				const gap = Math.abs(previousEval.totalScore - scoring.totalScore);
				if (gap > 40) {
					isAnomaly = true;
					anomalyNote = `High discrepancy: Previous ${previousEval.totalScore} vs Current ${scoring.totalScore}`;
				}
			}

			// Midnight check
			const now = new Date();
			const isMidnightEval = now.getHours() === 0;

			// 3. Update evaluation with scores and feedback
			const updatedEval = await (tx as any).evaluation.update({
				where: { id: evaluation.id },
				data: {
					status: "COMPLETED",
					totalScore: scoring.totalScore,
					passed: scoring.passed,
					writtenFeedback,
					durationSeconds,
					sheetVersion,
					submittedAt: now,
					completedAt: now,
					isAnomaly,
					anomalyNote,
					isMidnightEval,
				}
			});

			// 3. Save responses
			const responseData = Object.entries(responses).map(([qId, val]) => ({
				evaluationId: evaluation.id,
				questionId: qId,
				value: val as any,
			}));

			await (tx as any).evalResponse.createMany({
				data: responseData
			});

			// 4. Update slot status
			await tx.evaluationSlot.update({
				where: { id: slot.id },
				data: { status: "COMPLETED" as any }
			});

			return updatedEval;
		});

		return ok(result);
	} catch (error) {
		console.error("Submission error:", error);
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/slots/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: POST /api/evaluations/slots
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { NotificationType, Status, TeamStatus } from "@prisma/client";
import { getClubSettings } from "@/lib/club-settings";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { teamId, availableWindows } = body;

		if (!teamId || !availableWindows || !Array.isArray(availableWindows)) {
			return err("teamId and valid availableWindows array are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: true,
				evaluationSlots: {
					where: { status: "OPEN" },
				},
				evaluations: {
					select: { evaluatorId: true }, // get past evaluators
				},
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		if (team.leaderId !== session.user.id) {
			return err("Forbidden. Only the team leader can create evaluation slots", 403);
		}

		if (team.status !== TeamStatus.EVALUATING) {
			return err("Team must be in EVALUATING status to open slots", 400);
		}

		if (team.evaluationSlots.length > 0) {
			return err("An OPEN evaluation slot already exists for this team", 400);
		}

		const window = await prisma.availabilityWindow.create({
			data: {
				teamId,
				startTime: new Date(),
				endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week valid window
				isOpen: true,
			}
		});

		// Create the OPEN evaluation slot
		const slot = await prisma.evaluationSlot.create({
			data: {
				teamId,
				availabilityWindowId: window.id,
				slotStart: new Date(),
				slotEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				status: "OPEN",
			},
		});

		// Notify eligible evaluators
		// 1. Fetch all ACTIVE users
		const allUsers = await prisma.user.findMany({
			where: { status: Status.ACTIVE },
		});

		// Map the team object structurally for the eligibility helper
		const teamInfo = {
			id: team.id,
			members: team.members.map(m => ({ userId: m.userId })),
			evaluations: team.evaluations,
		};

		const projectInfo = {
			id: team.project.id,
			rank: team.project.rank,
		};

		const settings = await getClubSettings();
		const antiSnipeBaseSeconds = settings.antiSnipeMinutes * 60;
		const antiSnipeMaxSeconds = antiSnipeBaseSeconds * 3;

		let eligibleCount = 0;

		for (const user of allUsers) {
			const evaluatorInfo = {
				id: user.id,
				currentRank: user.currentRank,
				role: user.role,
			};

			const isEligible = isEligibleEvaluator(evaluatorInfo, teamInfo, projectInfo);

			if (isEligible) {
				// Anti-snipe delay based on configured minutes
				const randomSecondsDelay = Math.floor(Math.random() * (antiSnipeMaxSeconds - antiSnipeBaseSeconds + 1) + antiSnipeBaseSeconds);
				const deliverAt = new Date(Date.now() + randomSecondsDelay * 1000);

				await prisma.notification.create({
					data: {
						userId: user.id,
						type: NotificationType.EVAL_SLOT_AVAILABLE,
						title: "New Evaluation Available",
						body: `A new evaluation slot is available for ${team.project.title}.`,
						actionUrl: `/cursus?slotId=${slot.id}`,
						isPush: true,
						deliverAt,
					},
				});
				eligibleCount++;
			}
		}

		return ok({ slot, eligibleCount });
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/evaluations/upcoming/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { getTacticalMask, getIdentityRevealStatus } from "@/lib/utils/evaluation-utils";
import { SlotStatus } from "@prisma/client";

 GET /api/evaluations/upcoming
// Returns evaluator's claimed slots and team's incoming evaluators
export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;

		// 1. Fetch slots this user is evaluating
		const giving = await (prisma as any).evaluationSlot.findMany({
			where: {
				claimedById: userId,
				status: (SlotStatus as any).CLAIMED || "CLAIMED",
				slotEnd: { gt: new Date() } // hasn't ended yet
			},
			include: {
				team: {
					include: {
						project: { select: { title: true, rank: true } },
						leader: { select: { login: true, name: true, image: true } }
					}
				}
			},
			orderBy: { slotStart: "asc" }
		});

		// 2. Fetch slots where this user's team is being evaluated
		const teamMember = await prisma.teamMember.findFirst({
			where: { userId, team: { status: { notIn: ["COMPLETED"] } } }, // Removed ABANDONED as it doesn't exist
			select: { teamId: true }
		});

		let receiving = [];
		if (teamMember) {
			receiving = await (prisma as any).evaluationSlot.findMany({
				where: {
					teamId: teamMember.teamId,
					status: (SlotStatus as any).CLAIMED || "CLAIMED",
					slotEnd: { gt: new Date() }
				},
				include: {
					claimedBy: { select: { login: true, name: true, image: true } },
					team: {
						include: {
							project: { select: { title: true, rank: true } }
						}
					}
				},
				orderBy: { slotStart: "asc" }
			});
		}

		// Apply Identity Reveal Logic
		const processSlot = (slot: any, targetUser: any) => {
			const { shouldReveal, isImminent, isInProgress, remainingMins } = getIdentityRevealStatus(new Date(slot.slotStart));
			
			let label = "";
			if (!shouldReveal) {
				const adjective = getTacticalMask(targetUser?.login || slot.id);
				label = `a ${adjective} colleague`;
			} else {
				label = targetUser?.login || "Unknown";
			}

			return {
				...slot,
				revealStatus: { shouldReveal, isImminent, isInProgress, remainingMins },
				maskedIdentity: label,
				revealAt: new Date(new Date(slot.slotStart).getTime() - 15 * 60 * 1000)
			};
		};

		return ok({
			giving: giving.map((s: any) => processSlot(s, s.team.leader)),
			receiving: receiving.map((s: any) => processSlot(s, (s as any).claimedBy))
		});
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/evaluations/windows/[id]/claim/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { isEligibleEvaluator } from "@/lib/evaluation-eligibility";
import { EvaluationStatus, NotificationType, SlotStatus } from "@prisma/client";

 POST /api/evaluations/slots/[windowId]/claim
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const windowId = params.id;
		const { slotStart, slotEnd } = await req.json();

		if (!slotStart || !slotEnd) {
			return err("slotStart and slotEnd are required", 400);
		}

		// 1. Fetch Window and Team
		const window = await (prisma as any).availabilityWindow.findUnique({
			where: { id: windowId, isOpen: true },
			include: {
				team: {
					include: {
						project: true,
						members: true,
						evaluations: true,
						evaluationSlots: {
							select: { claimedById: true }
						}
					}
				}
			}
		});

		if (!window) return err("Availability window not found or closed", 404);

		// 2. Validate Evaluator Eligibility
		const user = await prisma.user.findUnique({
			where: { id: session.user.id }
		});
		if (!user) return err("User not found", 404);

		const teamInfo = {
			id: window.team.id,
			members: window.team.members.map((m: any) => ({ userId: m.userId })),
			evaluations: window.team.evaluations,
			claims: window.team.evaluationSlots
		};
		const projectInfo = {
			id: window.team.project.id,
			rank: window.team.project.rank,
		};

		const isEligible = isEligibleEvaluator(user as any, teamInfo, projectInfo);
		if (!isEligible) return err("You are not eligible to evaluate this mission", 403);

		// 3. Validate Time Window
		const start = new Date(slotStart);
		const end = new Date(slotEnd);

		if (start < window.startTime || end > window.endTime) {
			return err("Requested slot is outside the availability window", 400);
		}

		// Validate 1h duration
		if (end.getTime() - start.getTime() !== 1 * 60 * 60 * 1000) {
			return err("Evaluation slots must be exactly 1 hour", 400);
		}

		// 5. Run in Transaction
		const result = await prisma.$transaction(async (tx) => {
			// Check for Overlaps again inside transaction
			const overlappingClaim = await (tx as any).evaluationSlot.findFirst({
				where: {
					claimedById: user.id,
					status: (SlotStatus as any).CLAIMED || "CLAIMED",
					OR: [
						{ slotStart: { lt: end }, slotEnd: { gt: start } }
					]
				}
			});
			if (overlappingClaim) throw new Error("You already have a claimed evaluation overlapping this time");

			// 6. Create the EvaluationSlot
			const slot = await (tx as any).evaluationSlot.create({
				data: {
					availabilityWindowId: windowId,
					teamId: window.teamId,
					slotStart: start,
					slotEnd: end,
					claimedById: user.id,
					claimedAt: new Date(),
					status: (SlotStatus as any).CLAIMED || "CLAIMED",
				}
			});

			// 7. Create the Evaluation
			await (tx as any).evaluation.create({
				data: {
					teamId: window.teamId,
					projectId: window.team.projectId,
					evaluatorId: user.id,
					slotId: slot.id,
					status: EvaluationStatus.PENDING,
					claimedAt: new Date(),
				}
			});

			// 8. Notify Team Leader
			await (tx as any).notification.create({
				data: {
					userId: window.team.leaderId,
					type: (NotificationType as any).EVAL_SLOT_CLAIMED || "GENERAL",
					title: "Evaluation Claimed",
					body: `Someone has claimed a 1-hour window for your mission evaluation starting at ${start.toLocaleTimeString()}.`,
					actionUrl: `/cursus/projects/${window.team.projectId}/cockpit`,
				}
			});

			return slot;
		});

		return ok(result);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/feature-requests/route.ts**
  - Methods: GET, POST, PATCH
  - Auth/Permission: Session Required
  - Description: import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

 GET — list feature requests with vote counts
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
			category: r.category,
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
	const { title, description, category } = body;

	if (!title || !description) {
		return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
	}

	const request = await prisma.featureRequest.create({
		data: {
			userId: session.user.id,
			category: category || "PLATFORM",
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

- **/src/app/api/internal/shimmer-status/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: Handles API requests for shimmer-status

- **/src/app/api/notifications/[id]/read/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: Handles API requests for read

- **/src/app/api/notifications/platform/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const userId = session.user.id;
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				notifications: {
					where: { type: "PLATFORM_OBSERVATION" },
					orderBy: { createdAt: "desc" },
					take: 1
				},
				_count: {
					select: {
						evaluationsGiven: true,
						teams: { where: { team: { status: "COMPLETED" } } }
					}
				}
			}
		});

		if (!user) return err("User not found", 404);

		 1-hour rate limit check
		if (user.notifications.length > 0) {
			const lastTime = new Date(user.notifications[0].createdAt).getTime();
			if (Date.now() - lastTime < 3600000) {
				return ok({ skipped: true, reason: "Rate limited" });
			}
		}

		// Generate random observation
		const observations = [
			"The Platform notes your persistence.",
			"Data flow is nominal. Continue your efforts.",
			"You are searching for things that do not wish to be found.",
			`Evaluations: ${user._count.evaluationsGiven}. The registry is pleased.`,
			`Projects: ${user._count.teams}. Level recursion detected.`,
			"The abyss looks back. It is unimpressed.",
			"42.0.0. Connection stable.",
			"Your digital footprint is expanding. Efficiency is advised."
		];
		const text = observations[Math.floor(Math.random() * observations.length)];

		// Create notification
		const notification = await prisma.notification.create({
			data: {
				userId,
				type: "PLATFORM_OBSERVATION",
				title: "THE PLATFORM",
				body: text,
			}
		});

		return ok({ notification });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/notifications/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: GET /api/notifications
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const userId = session.user.id;
		const now = new Date();

		const notifications = await prisma.notification.findMany({
			where: {
				userId,
				deliverAt: {
					lte: now,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const unreadCount = notifications.filter((n) => !n.readAt).length;

		return ok({ notifications, unreadCount });
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/quote/route.ts**
  - Methods: GET
  - Auth/Permission: Public / Standard
  - Description: import { NextResponse } from "next/server";

const FALLBACK = {
	quote: "The best way to predict the future is to invent it.",
	author: "Alan Kay",
};

export async function GET() {
	try {
		const res = await fetch("https:zenquotes.io/api/random", {
			cache: "no-store",
		});
		if (!res.ok) throw new Error("ZenQuotes fetch failed");

		const data = await res.json();
		const entry = data?.[0];
		if (!entry?.q || !entry?.a) throw new Error("Invalid response");

		return NextResponse.json({ quote: entry.q, author: entry.a });
	} catch {
		return NextResponse.json(FALLBACK);
	}
}

- **/src/app/api/requests/fabrication/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for fabrication

- **/src/app/api/requests/materials/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for materials

- **/src/app/api/teams/[id]/actions/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

 POST /api/teams/[id]/actions
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const userId = session.user.id;
		const { action, ...payload } = await req.json();

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: { members: true },
		});

		if (!team) return err("Team not found", 404);

		const member = team.members.find(m => m.userId === userId);
		const isAdmin = !!(session.user as any).isAdmin;

		if (!member && !isAdmin) {
			return err("Forbidden. You are not a member of this team", 403);
		}

		switch (action) {
			case "confirm-abandon":
				if (!member) return err("Only team members can confirm abandonment", 403);
				
				await prisma.teamMember.update({
					where: { teamId_userId: { teamId, userId } },
					data: { abandonConfirmed: true },
				});

				// Check if all members confirmed
				const updatedMembers = await prisma.teamMember.findMany({
					where: { teamId },
				});
				const allConfirmed = updatedMembers.every(m => m.abandonConfirmed);

				if (allConfirmed) {
					await prisma.team.update({
						where: { id: teamId },
						data: { status: "ABANDONED" as TeamStatus },
					});
					return ok({ message: "Team status updated to ABANDONED", allConfirmed: true });
				}
				return ok({ message: "Abandonment confirmed", allConfirmed: false });

			case "request-extension":
				if (team.isExtensionGranted) return err("Extension already granted", 400);
				if (!payload.reason) return err("Reason is required", 400);

				const extension = await prisma.extensionRequest.create({
					data: {
						teamId,
						reason: payload.reason,
					},
				});
				return ok(extension);

			case "raise-dispute":
				if (!payload.reason || !payload.evidence) return err("Reason and evidence are required", 400);

				const dispute = await prisma.evaluationDispute.create({
					data: {
						teamId,
						reason: payload.reason,
						evidence: payload.evidence,
					},
				});
				return ok(dispute);

			default:
				return err("Invalid action", 400);
		}
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/cancel/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: { members: true }
		});

		if (!team) return err("Team not found", 404);

		 Only leader can cancel
		if (team.leaderId !== session.user.id) {
			return err("Only the team leader can cancel formation", 403);
		}

		// Can only cancel FORMING teams
		if (team.status !== TeamStatus.FORMING) {
			return err("Only teams in formation can be cancelled", 400);
		}

		// Delete the team (and cascading members)
		await prisma.team.delete({
			where: { id: teamId }
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/teams/[id]/checkout/[checkoutId]/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string; checkoutId: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const { id: teamId, checkoutId } = params;

		 Verify membership
		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});
		
		const isAdmin = (session.user as any).isAdmin;
		if (!member && !isAdmin) return err("Unauthorized", 403);

		// Update checkout
		const checkout = await prisma.checkout.update({
			where: { id: checkoutId, teamId },
			data: {
				status: "RETURNED",
				returnedAt: new Date(),
			},
		});

		return ok(checkout);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/checkout/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for checkout

- **/src/app/api/teams/[id]/conflict/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: POST /api/teams/[id]/conflict
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const body = await req.json();
		const { description } = body;

		if (!description) return err("description is required", 400);

		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});
		if (!member) return err("You are not a member of this team", 403);

		await prisma.conflictFlag.create({
			data: {
				teamId,
				raisedById: session.user.id,
				description,
			},
		});

		// NEVER return raisedById
		return ok({ success: true });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/evaluation/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		 Find all completed evaluations for this team
		const evaluations = await prisma.evaluation.findMany({
			where: { teamId: params.id },
			orderBy: { completedAt: "desc" },
			include: {
				evaluator: {
					select: {
						login: true,
						name: true,
					},
				},
				feedback: {
					where: { fromRole: "TEAM" as any },
				},
			},
		});

		if (!evaluations || evaluations.length === 0) return ok([]);

		// Map through and process feedback requirements for each
		const processed = evaluations.map((ev: any) => {
			const hasSubmittedFeedback = ev.feedback.length > 0;
			const timeSinceCompletion = ev.completedAt 
				? Date.now() - new Date(ev.completedAt).getTime()
				: 0;
			const twentyFourHours = 24 * 60 * 60 * 1000;
			const canViewResult = hasSubmittedFeedback || timeSinceCompletion >= twentyFourHours;

			return {
				...ev,
				canViewResult,
				hasSubmittedFeedback,
				timeToAutoReveal: Math.max(0, twentyFourHours - timeSinceCompletion),
			};
		});

		return ok(processed);
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/teams/[id]/fabrication/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for fabrication

- **/src/app/api/teams/[id]/materials/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: POST /api/teams/[id]/materials
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const body = await req.json();
		const { itemName, quantity, estimatedCost, justification } = body;

		if (!itemName || !quantity) return err("itemName and quantity are required", 400);

		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});
		if (!member) return err("You are not a member of this team", 403);

		const request = await prisma.materialRequest.create({
			data: {
				teamId,
				requestedById: session.user.id,
				itemName,
				quantity: Number(quantity),
				estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
				justification: justification || "",
				status: "PENDING",
			},
		});

		return ok(request);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/members/[userId]/route.ts**
  - Methods: DELETE
  - Auth/Permission: Session Required
  - Description: DELETE /api/teams/[id]/members/[userId]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function DELETE(
	req: Request,
	{ params }: { params: { id: string; userId: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const { id: teamId, userId } = params;

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		if (team.status !== TeamStatus.FORMING) {
			return err("Team must be in FORMING status to remove members", 400);
		}

		const isAdmin = !!(session.user as any).isAdmin;
		if (team.leaderId !== session.user.id && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can remove members", 403);
		}

		if (team.leaderId === userId) {
			return err("Cannot remove the team leader", 400);
		}

		const member = await prisma.teamMember.findUnique({
			where: {
				teamId_userId: {
					teamId,
					userId,
				},
			},
		});

		if (!member) {
			return err("User is not a member of this team", 404);
		}

		await prisma.teamMember.delete({
			where: {
				teamId_userId: {
					teamId,
					userId,
				},
			},
		});

		return ok({ success: true });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/members/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: POST and DELETE /api/teams/[id]/members
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Status, TeamStatus } from "@prisma/client";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;
		const body = await req.json();
		const { userId } = body;

		if (!userId) {
			return err("userId is required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: { include: { user: true } },
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		if (team.status !== TeamStatus.FORMING) {
			return err("Team must be in FORMING status to add members", 400);
		}

		const isAdmin = !!(session.user as any).isAdmin;
		if (team.leaderId !== session.user.id && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can add members", 403);
		}

		if (team.members.some((m) => m.userId === userId)) {
			return err("User is already a member of this team", 400);
		}

		if (team.members.length >= team.project.teamSizeMax) {
			return err("Team is already at maximum capacity", 400);
		}

		const targetUser = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				teams: {
					where: {
						team: {
							status: { in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING] },
						},
					},
				},
			},
		});

		if (!targetUser) {
			return err("Target user not found", 404);
		}

		if (targetUser.status !== Status.ACTIVE) {
			return err("Target user must be ACTIVE", 400);
		}

		if (targetUser.teams.length > 0) {
			return err("Target user is already in an active team", 400);
		}

		// Check team history to see if they worked together before
		const hasWorkedTogether = await prisma.teamMember.findFirst({
			where: {
				userId: userId,
				team: {
					members: {
						some: { userId: session.user.id },
					},
				},
			},
		});

		await prisma.teamMember.create({
			data: {
				teamId: team.id,
				userId: userId,
				isLeader: false,
			},
		});

		const updatedMembers = await prisma.teamMember.findMany({
			where: { teamId: team.id },
			include: {
				user: {
					select: { id: true, name: true, login: true, image: true, currentRank: true },
				},
			},
		});

		return ok({ members: updatedMembers, hasWorkedTogether: !!hasWorkedTogether });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/post-mortem/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

 GET /api/teams/[id]/post-mortem
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const userId = session.user.id;

		const postMortem = await (prisma as any).projectPostMortem.findUnique({
			where: { teamId_userId: { teamId, userId } },
		});

		return ok(postMortem);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

// POST /api/teams/[id]/post-mortem
export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const userId = session.user.id;
		const body = await req.json();
		const { whatWorked, whatDidnt, wouldDoBetter } = body;

		if (!whatWorked || !whatDidnt || !wouldDoBetter) {
			return err("All fields are required", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			select: { projectId: true, status: true, members: { where: { userId } } }
		});

		if (!team || team.members.length === 0) {
			return err("You are not a member of this team", 403);
		}

		if (team.status !== "COMPLETED") {
			return err("Post-mortem can only be submitted for completed projects", 400);
		}

		const postMortem = await (prisma as any).projectPostMortem.create({
			data: {
				teamId,
				userId,
				projectId: team.projectId,
				whatWorked,
				whatDidnt,
				wouldDoBetter,
			},
		});

		return ok(postMortem);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/reports/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: GET and POST /api/teams/[id]/reports
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;

		const reports = await prisma.weeklyReport.findMany({
			where: { teamId },
			orderBy: { weekNumber: "asc" },
			include: {
				submittedBy: {
					select: { id: true, name: true, login: true, image: true },
				},
			},
		});

		return ok(reports);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;
		const body = await req.json();
		const { 
			weekNumber, 
			summary, 
			contributionNotes, 
			photoUrls, 
			readmeUpdated, 
			blockersNotes,
			isMilestone,
			milestoneTitle,
			hoursLogged,
			mood,
			nextWeekPlan
		} = body;

		if (!weekNumber || !summary) {
			return err("weekNumber and summary are required", 400);
		}

		if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length < 5) {
			return err("At least 5 build photos are required per report", 400);
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isMember = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});

		if (!isMember) {
			return err("Forbidden. Only team members can submit weekly reports", 403);
		}

		if (![TeamStatus.ACTIVE, TeamStatus.EVALUATING].includes(team.status as any)) {
			return err("Team must be ACTIVE or EVALUATING to submit reports", 400);
		}

		const existingReport = await prisma.weeklyReport.findUnique({
			where: {
				teamId_weekNumber: {
					teamId,
					weekNumber: Number(weekNumber),
				},
			},
		});

		if (existingReport) {
			return err(`A report already exists for week ${weekNumber}`, 400);
		}

		const report = await prisma.weeklyReport.create({
			data: {
				teamId,
				submittedById: session.user.id,
				weekNumber: Number(weekNumber),
				summary,
				contributionNotes: contributionNotes || {},
				photoUrls: photoUrls || [],
				readmeUpdated: Boolean(readmeUpdated),
				blockersNotes,
				isMilestone: Boolean(isMilestone),
				milestoneTitle,
				hoursLogged: hoursLogged ? parseFloat(hoursLogged) : null,
				mood,
				nextWeekPlan,
			},
		});

		return ok(report);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/route.ts**
  - Methods: GET, PATCH
  - Auth/Permission: Session Required
  - Description: GET and PATCH /api/teams/[id]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;
		const userId = session.user.id;
		const userRole = session.user.role;

		const team = await prisma.team.findUnique({
			where: { id: teamId },
			include: {
				project: true,
				members: {
					include: {
						user: {
							select: { id: true, name: true, login: true, image: true, currentRank: true },
						},
					},
				},
				weeklyReports: {
					orderBy: { weekNumber: "asc" },
				},
				evaluationSlots: {
					include: {
						evaluations: true,
					},
				},
				materialRequests: true,
				fabricationRequests: true,
				damageReports: true,
				conflictFlags: true,
				scratchpad: {
					include: {
						lastEditedBy: {
							select: { login: true }
						}
					}
				},
				extensionRequests: true,
				disputes: true,
			},
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isAdmin = !!(session.user as any).isAdmin;
		const isOnTeam = team.members.some((m) => m.userId === userId);

		if (!isAdmin && !isOnTeam) {
			const { conflictFlags, scratchpad, extensionRequests, disputes, ...publicTeam } = team as any;
			return ok({ ...publicTeam, conflictFlags: [], scratchpad: null, extensionRequests: [], disputes: [] });
		}

		return ok(team);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const teamId = params.id;
		const userId = session.user.id;

		const body = await req.json();
		const { status, name, repoUrl } = body;

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return err("Team not found", 404);
		}

		const isAdmin = !!(session.user as any).isAdmin;
		if (team.leaderId !== userId && !isAdmin) {
			return err("Forbidden. Only the team leader or admin can update team details", 403);
		}

		let firstEverCompletion = false;
		const updateData: any = {};

		if (status) {
			if (!Object.values(TeamStatus).includes(status)) {
				return err("Valid team status is required", 400);
			}
			updateData.status = status as TeamStatus;

			if (status === TeamStatus.COMPLETED) {
				const project = await prisma.project.findUnique({
					where: { id: team.projectId },
					select: { hasBeenCompleted: true },
				});
				if (project && !project.hasBeenCompleted) {
					firstEverCompletion = true;
					await prisma.project.update({
						where: { id: team.projectId },
						data: { hasBeenCompleted: true },
					});
				}
			}
		}

		if (name !== undefined) updateData.name = name;
		if (repoUrl !== undefined) updateData.repoUrl = repoUrl;

		const updatedTeam = await prisma.team.update({
			where: { id: teamId },
			data: updateData,
		});

		return ok({ ...updatedTeam, _firstEverCompletion: firstEverCompletion });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/[id]/scratchpad/route.ts**
  - Methods: GET, PATCH
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

 GET /api/teams/[id]/scratchpad
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const scratchpad = await prisma.teamScratchpad.findUnique({
			where: { teamId },
			include: {
				lastEditedBy: {
					select: { login: true }
				}
			}
		});

		return ok(scratchpad || { content: "", updatedAt: new Date() });
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

// PATCH /api/teams/[id]/scratchpad
export async function PATCH(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const teamId = params.id;
		const { content } = await req.json();

		const member = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: session.user.id } },
		});

		if (!member && !(session.user as any).isAdmin) {
			return err("Forbidden. Only team members can edit the scratchpad", 403);
		}

		const scratchpad = await prisma.teamScratchpad.upsert({
			where: { teamId },
			update: {
				content,
				lastEditedById: session.user.id,
			},
			create: {
				teamId,
				content,
				lastEditedById: session.user.id,
			},
		});

		return ok(scratchpad);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/check-pairing/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { Rank, TeamStatus } from "@prisma/client";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const { searchParams } = new URL(req.url);
		const userId1 = searchParams.get("userId1");
		const userId2 = searchParams.get("userId2");
		const rank = searchParams.get("rank") as Rank;

		if (!userId1 || !userId2 || !rank) {
			return err("userId1, userId2, and rank are required", 400);
		}

		 Find if these two users have ever been in a COMPLETED team at this rank
		const commonTeams = await prisma.team.findMany({
			where: {
				status: TeamStatus.COMPLETED,
				rank: rank,
				members: {
					some: { userId: userId1 },
				},
				AND: {
					members: {
						some: { userId: userId2 },
					},
				},
			},
			select: { id: true },
		});

		return ok({ hasWorkedTogether: commonTeams.length > 0 });
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/teams/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: POST /api/teams
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { ProjectStatus, Rank, Status, TeamStatus } from "@prisma/client";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { projectId, memberIds = [], status = TeamStatus.FORMING } = body;

		if (!projectId) {
			return err("projectId is required", 400);
		}

		// Ensure current user is in members list if it's an ACTIVE team
		const allMemberIds = Array.from(new Set([session.user.id, ...memberIds]));

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
		});

		if (!user) {
			return err("User not found", 404);
		}

		if (user.status !== Status.ACTIVE) {
			return err("User must be ACTIVE to create a team", 403);
		}

		// Check if any member already has an active team
		const activeMembers = await prisma.teamMember.findMany({
			where: {
				userId: { in: allMemberIds },
				team: {
					status: {
						in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING],
					},
				},
			},
			include: { user: { select: { login: true } }, team: { select: { projectId: true } } },
		});

		if (activeMembers.length > 0) {
			const existingSameProject = activeMembers.find(m => m.team.projectId === projectId);
			if (existingSameProject) {
				return err(`${existingSameProject.user.login} is already registered for this project`, 400);
			}
			return err(`${activeMembers.map(m => m.user.login).join(", ")} already has an active project`, 400);
		}

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			include: {
				teams: {
					where: {
						status: {
							in: [TeamStatus.FORMING, TeamStatus.ACTIVE, TeamStatus.EVALUATING, TeamStatus.COMPLETED],
						},
					},
				},
			},
		});

		if (!project) {
			return err("Project not found", 404);
		}

		if (status === TeamStatus.ACTIVE) {
			if (allMemberIds.length < project.teamSizeMin || allMemberIds.length > project.teamSizeMax) {
				return err(`Team size must be between ${project.teamSizeMin} and ${project.teamSizeMax}`, 400);
			}

			// Validate rank for all members
			const users = await prisma.user.findMany({
				where: { id: { in: allMemberIds } },
				select: { login: true, currentRank: true },
			});

			const ineligible = users.filter(u => {
				const ranks = Object.values(Rank);
				const projectRankIdx = ranks.indexOf(project.rank);
				const userRankIdx = ranks.indexOf(u.currentRank);
				return userRankIdx < projectRankIdx;
			});

			if (ineligible.length > 0) {
				return err(`${ineligible.map(u => u.login).join(", ")} does not have the required rank (${project.rank})`, 400);
			}
		}

		if (project.status !== ProjectStatus.ACTIVE) {
			return err("Project is not ACTIVE", 400);
		}

		const isHighRank = ["B", "A", "S"].includes(project.rank);
		if (isHighRank && project.isUnique && project.teams.length > 0) {
			return err("Project is already claimed by another team", 400);
		}

		// blackholeDeadline
		const blackholeDeadline = new Date();
		blackholeDeadline.setDate(blackholeDeadline.getDate() + project.blackholeDays);

		const team = await prisma.team.create({
			data: {
				projectId: project.id,
				leaderId: user.id,
				status: status,
				rank: user.currentRank,
				blackholeDeadline: status === TeamStatus.ACTIVE ? blackholeDeadline : null,
				activatedAt: status === TeamStatus.ACTIVE ? new Date() : null,
				members: {
					create: allMemberIds.map(id => ({
						userId: id,
						isLeader: id === session.user.id,
					})),
				},
			},
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								login: true,
								image: true,
								currentRank: true,
							},
						},
					},
				},
			},
		});

		return ok(team);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/upload/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { err, ok } from "@/lib/api";


const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/svg+xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;  5MB

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const formData = await req.formData();
		const file = formData.get("file") as File;
		const teamId = formData.get("teamId") as string;
		const uploadType = formData.get("type") as string; // 'reports' or 'fabrication'

		if (!file) return err("No file provided", 400);
		if (!teamId) return err("Missing teamId", 400);

		if (!ALLOWED_TYPES.includes(file.type)) {
			return err(`File type ${file.type} not allowed`, 400);
		}

		if (file.size > MAX_FILE_SIZE) {
			return err("File size exceeds 5MB limit", 400);
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const folder = `robotics-club/${uploadType || "general"}/${teamId}`;

		return new Promise<Response>((resolve) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{ 
					folder,
					resource_type: "auto",
				},
				(error, result) => {
					if (error) {
						resolve(err(error.message, 500));
					} else {
						resolve(
							ok({
								url: result?.secure_url,
								publicId: result?.public_id,
								width: result?.width,
								height: result?.height,
							})
						);
					}
				}
			);

			uploadStream.end(buffer);
		});
	} catch (error: any) {
		return err(error.message || "Upload failed", 500);
	}
}

- **/src/app/api/user/[id]/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: GET /api/user/[id]
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { TeamStatus } from "@prisma/client";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const userId = params.id;

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				login: true,
				name: true,
				image: true,
				currentRank: true,
				status: true,
				joinedAt: true,
				githubHandle: true,
				skillProgress: true,
				achievements: {
					include: {
						achievement: true,
					},
				},
				teams: {
					where: {
						team: {
							status: TeamStatus.COMPLETED,
						},
					},
					include: {
						team: {
							select: {
								project: {
									select: {
										title: true,
										rank: true,
									},
								},
							},
						},
					},
				},
				_count: {
					select: {
						evaluationsGiven: true,
					},
				},
			},
		});

		if (!user) {
			return err("User not found", 404);
		}

		return ok(user);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/user/achievements/unlock/route.ts**
  - Methods: POST
  - Auth/Permission: Session Required
  - Description: Handles API requests for unlock

- **/src/app/api/user/alumni-evaluator/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: PATCH /api/user/alumni-evaluator
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true },
		});

		if (!user || user.status !== "ALUMNI") {
			return err("Only ALUMNI users can toggle evaluator opt-in", 403);
		}

		const existing = await prisma.alumniEvaluator.findUnique({
			where: { userId: session.user.id },
		});

		if (existing) {
			const updated = await prisma.alumniEvaluator.update({
				where: { userId: session.user.id },
				data: { isActive: !existing.isActive },
			});
			return ok(updated);
		}

		const created = await prisma.alumniEvaluator.create({
			data: { userId: session.user.id, isActive: true },
		});
		return ok(created);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/user/flags/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: Handles API requests for flags

- **/src/app/api/user/me/route.ts**
  - Methods: GET, PATCH
  - Auth/Permission: Session Required
  - Description: GET /api/user/me
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			include: {
				skillProgress: true,
				achievements: {
					include: {
						achievement: true,
					},
				},
				_count: {
					select: {
						evaluationsGiven: true,
						notifications: true,
					},
				},
			},
		});

		if (!user) {
			return err("User not found", 404);
		}

		return ok(user);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}
export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const body = await req.json();
		const { equippedTitle } = body;

		// Verify user actually has this achievement if it's a title from one
		if (equippedTitle) {
			const hasAchievement = await prisma.userAchievement.findFirst({
				where: {
					userId: session.user.id,
					achievement: { title: equippedTitle },
				},
			});
			if (!hasAchievement && equippedTitle !== "") {
				return err("You haven't unlocked this title yet", 403);
			}
		}

		const updated = await prisma.user.update({
			where: { id: session.user.id },
			data: { equippedTitle },
		});

		return ok(updated);
	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/user/onboarding/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: Handles API requests for onboarding

- **/src/app/api/user/search/route.ts**
  - Methods: GET
  - Auth/Permission: Session Required
  - Description: Handles API requests for search

- **/src/app/api/user/theme/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: PATCH /api/user/theme
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const body = await req.json();
		const { theme, unlockTheme } = body;

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { unlockedThemes: true },
		});

		if (!user) return err("User not found", 404);

		const data: any = {};
		if (theme) data.activeTheme = theme;
		let newlyUnlocked = false;
		if (unlockTheme && !user.unlockedThemes.includes(unlockTheme)) {
			data.unlockedThemes = {
				set: [...user.unlockedThemes, unlockTheme],
			};
			newlyUnlocked = true;
		}

		if (Object.keys(data).length === 0) {
			return ok({ message: "No changes" });
		}

		const updated = await prisma.user.update({
			where: { id: session.user.id },
			data,
			select: { activeTheme: true, unlockedThemes: true },
		});

		return ok({ ...updated, newlyUnlocked });

	} catch (error) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

- **/src/app/api/user/themes/route.ts**
  - Methods: PATCH
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";
import { THEMES } from "@/lib/themes";

export async function PATCH(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user) return err("Unauthorized", 401);

	const body = await req.json();
	const { activeTheme, unlockTheme, questComplete } = body;
	const userId = (session.user as any).id;

	 Handle Quest Completion
	if (questComplete) {
		await prisma.user.update({
			where: { id: userId },
			data: { hasFoundSecrets: true }
		});

		// Achievement Check: PATIENT_ZERO
		const achievement = await prisma.achievement.findUnique({ where: { key: "PATIENT_ZERO" } });
		if (achievement) {
			const existing = await prisma.userAchievement.findUnique({
				where: { userId_achievementId: { userId, achievementId: achievement.id } }
			});
			if (!existing) {
				await prisma.userAchievement.create({
					data: { userId, achievementId: achievement.id }
				});
			}
		}
		return ok({ message: "You were expected." });
	}

	try {
		// If questComplete was not handled, proceed with theme updates
		// const { activeTheme, unlockTheme } = await req.json(); // This line is now handled by the initial body parsing
		// const userId = (session.user as any).id; // This is now defined above

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { unlockedThemes: true },
		});

		if (!user) return err("User not found", 404);

		const updateData: any = {};

		if (activeTheme) {
			updateData.activeTheme = activeTheme;
		}

		let newlyUnlocked = false;
		if (unlockTheme) {
			if (!user.unlockedThemes.includes(unlockTheme)) {
				updateData.unlockedThemes = {
					set: [...user.unlockedThemes, unlockTheme],
				};
				newlyUnlocked = true;
			}
		}

		if (Object.keys(updateData).length === 0) {
			return ok({ message: "No changes" });
		}

		const updated = await prisma.user.update({
			where: { id: userId },
			data: updateData,
		});

		// Achievement Check: Interior Decorator
		const ALL_THEME_IDS = THEMES.map(t => t.id);
		const hasAllThemes = ALL_THEME_IDS.every(id => updated.unlockedThemes.includes(id));
		
		if (hasAllThemes) {
			// Check if already has it
			const achievement = await prisma.achievement.findUnique({ where: { key: "INTERIOR_DECORATOR" } });
			if (achievement) {
				const existing = await prisma.userAchievement.findUnique({
					where: { userId_achievementId: { userId, achievementId: achievement.id } }
				});
				if (!existing) {
					await prisma.userAchievement.create({
						data: { userId, achievementId: achievement.id }
					});
				}
			}
		}

		return ok({
			activeTheme: updated.activeTheme,
			unlockedThemes: updated.unlockedThemes,
			newlyUnlocked,
		});
	} catch (e: any) {
		console.error("Theme API Error:", e);
		return err(e.message, 500);
	}
}

- **/src/app/api/user/update-status/route.ts**
  - Methods: GET, POST
  - Auth/Permission: Session Required
  - Description: import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { lastSeenUpdateScreen: true }
		});

		if (!user) return err("User not found", 404);

		 Show if never seen or > 30 days ago
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		
		const shouldShow = !user.lastSeenUpdateScreen || user.lastSeenUpdateScreen < thirtyDaysAgo;

		return ok({ shouldShow });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

export async function POST() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) return err("Unauthorized", 401);

		await prisma.user.update({
			where: { id: session.user.id },
			data: { 
				lastSeenUpdateScreen: new Date(),
				survivedSystemUpdate: true
			}
		});

		return ok({ success: true });
	} catch (error) {
		return err((error as Error).message, 500);
	}
}

- **/src/app/api/workshops/[id]/rsvp/route.ts**
  - Methods: POST, DELETE
  - Auth/Permission: Session Required
  - Description: POST and DELETE /api/workshops/[id]/rsvp
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ok, err } from "@/lib/api";

export async function POST(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const workshopId = params.id;
		const body = await req.json();
		const status = body.status || "GOING";

		const rsvp = await prisma.workshopRSVP.upsert({
			where: {
				workshopId_userId: { workshopId, userId: session.user.id },
			},
			update: { status },
			create: { workshopId, userId: session.user.id, status },
		});

		return ok(rsvp);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return err("Unauthorized", 401);
		}

		const workshopId = params.id;

		const rsvp = await prisma.workshopRSVP.upsert({
			where: {
				workshopId_userId: { workshopId, userId: session.user.id },
			},
			update: { status: "NOT_GOING" },
			create: { workshopId, userId: session.user.id, status: "NOT_GOING" },
		});

		return ok(rsvp);
	} catch (error: unknown) {
		return err((error as Error).message || "Internal Server Error", 500);
	}
}

─────────────────────────────────────────\n## 3. DATABASE MODELS\n- **User 
  id                     String                  @id @default(cuid())
  createdAt              DateTime                @default(now()) @map("created_at")
  updatedAt              DateTime                @updatedAt @map("updated_at")
  fortyTwoId             String?                 @unique @map("forty_two_id")
  login                  String                  @unique @default(cuid())
  email                  String?                 @unique
  emailVerified          DateTime?               @map("email_verified")
  name                   String                  @default("")
  image                  String?                 @map("image")
  role                   String                  @default("STUDENT")
  status                 Status                  @default(WAITLIST)
  currentRank            Rank                    @default(E) @map("current_rank")
  labAccessEnabled       Boolean                 @default(false) @map("lab_access_enabled")
  githubHandle           String?                 @map("github_handle")
  activeTheme            String                  @default("FORGE") @map("active_theme")
  unlockedThemes         String[]                @default(["FORGE", "FIELD"]) @map("unlocked_themes")
  hasFoundSecrets        Boolean                 @default(false) @map("has_found_secrets")
  equippedTitle          String?                 @map("equipped_title")
  joinedAt               DateTime                @default(now()) @map("joined_at")
  soundsEnabled          Boolean                 @default(true) @map("sounds_enabled")
  impersonatorId         String?                 @map("impersonator_id")
  birthday               DateTime?               @map("birthday")
  hasSeenIntro           Boolean                 @default(false) @map("has_seen_intro")
  hasSeenWaitlistModal   Boolean                 @default(false) @map("has_seen_waitlist_modal")
  lastSeenUpdateScreen   DateTime?               @map("last_seen_update_screen")
  visitedVoid            Boolean                 @default(false) @map("visited_void")
  visitedHall            Boolean                 @default(false) @map("visited_hall")
  visitedMirror          Boolean                 @default(false) @map("visited_mirror")
  discoveredCheats       String[]                @default([]) @map("discovered_cheats")
  receivedPlatformNotif  Boolean                 @default(false) @map("received_platform_notif")
  survivedSystemUpdate   Boolean                 @default(false) @map("survived_system_update")
  accounts               Account[]
  auditLogsActed         AdminAuditLog[]         @relation("AdminActor")
  auditLogsTargeted      AdminAuditLog[]         @relation("AdminTarget")
  adminNotesAuthored     AdminNote[]             @relation("NoteAuthor")
  adminNotesTargeted     AdminNote[]             @relation("NoteTarget")
  alumniEvaluatorOptIn   AlumniEvaluator?
  announcementDismissals AnnouncementDismissal[]
  announcementsCreated   Announcement[]          @relation("AnnouncementCreator")
  checkouts              Checkout[]
  settingsUpdates        ClubSettings[]          @relation("SettingsUpdater")
  complimentsSent        Compliment[]            @relation("ComplimentSender")
  complimentsReceived    Compliment[]            @relation("ComplimentReceiver")
  conflictFlagsRaised    ConflictFlag[]          @relation("ConflictRaiser")
  conflictFlagsReviewed  ConflictFlag[]          @relation("ConflictReviewer")
  damageReports          DamageReport[]          @relation("Reporter")
  damageResolved         DamageReport[]          @relation("DamageResolver")
  feedbackReceived       EvaluationFeedback[]    @relation("FeedbackReceiver")
  evaluationsGiven       Evaluation[]            @relation("Evaluator")
  fabricationReviewed    FabricationRequest[]    @relation("FabricationReviewer")
  fabricationRequests    FabricationRequest[]    @relation("Requestor")
  featureRequestVotes    FeatureRequestVote[]
  featureRequests        FeatureRequest[]        @relation("FeatureRequestCreator")
  labAccessLogs          LabAccessLog[]
  materialRequests       MaterialRequest[]       @relation("MaterialRequestor")
  materialReviewed       MaterialRequest[]       @relation("MaterialReviewer")
  moodBoardNotes         MoodBoardNote[]
  notifications          Notification[]
  projectProposals       ProjectProposal[]       @relation("ProposalCreator")
  proposalsReviewed      ProjectProposal[]       @relation("ProposalReviewer")
  projectsCreated        Project[]               @relation("ProjectCreator")
  teams                  TeamMember[]
  teamsLed               Team[]                  @relation("TeamLeader")
  achievements           UserAchievement[]
  skillProgress          UserSkillProgress[]
  userTitles             UserTitle[]
  dynamicRole            DynamicRole             @relation(fields: [role], references: [name])
  weeklyReports          WeeklyReport[]
  workshopRsvps          WorkshopRSVP[]
  workshopsHosted        Workshop[]              @relation("WorkshopHost")
  scratchpadsEdited      TeamScratchpad[]
  postMortems            ProjectPostMortem[]
  extensionRequestsReviewed ExtensionRequest[]
  disputesReviewed       EvaluationDispute[]
  claimedSlots         EvaluationSlot[]      @relation("ClaimedSlots")
  defenseRegistrations  DefenseRegistration[]
  defenseEvaluations    DefenseEvaluation[]
  defensesOpened        PublicDefense[] @relation("DefenseOpenedBy")
  defensesClosedBy      PublicDefense[] @relation("DefenseClosedBy")
  defensesReopened      PublicDefense[] @relation("DefenseReopenedBy")
  defenseSettingsUpdates DefenseCriteriaSettings[] @relation("DefenseSettingsUpdater")

  @@map("users")
}**

- **AdminNote 
  id           String   @id @default(cuid())
  targetUserId String   @map("target_user_id")
  authorId     String   @map("author_id")
  body         String
  createdAt    DateTime @default(now()) @map("created_at")
  author       User     @relation("NoteAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  targetUser   User     @relation("NoteTarget", fields: [targetUserId], references: [id], onDelete: Cascade)

  @@index([targetUserId])
  @@index([authorId])
  @@map("admin_notes")
}**

- **Account 
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}**

- **Project 
  id                 String            @id @default(cuid())
  createdAt          DateTime          @default(now()) @map("created_at")
  updatedAt          DateTime          @updatedAt @map("updated_at")
  title              String
  description        String
  objectives         String[]          @default([])
  deliverables       String[]          @default([])
  rank               Rank
  status             ProjectStatus     @default(DRAFT)
  teamSizeMin        Int               @map("team_size_min")
  teamSizeMax        Int               @map("team_size_max")
  blackholeDays      Int               @map("blackhole_days")
  skillTags          String[]          @map("skill_tags")
  isUnique           Boolean           @default(false) @map("is_unique")
  subjectSheetUrl    String?           @map("subject_sheet_url")
  evaluationSheetUrl String?           @map("evaluation_sheet_url")
  createdById        String            @map("created_by_id")
  hasBeenCompleted   Boolean           @default(false) @map("has_been_completed")
  isRequired         Boolean           @default(false) @map("is_required")
  evaluations        Evaluation[]
  proposalsConverted ProjectProposal[] @relation("ConvertedProject")
  createdBy          User              @relation("ProjectCreator", fields: [createdById], references: [id])
  teams              Team[]
  postMortems        ProjectPostMortem[]
  evalSheet          EvalSheet?
  publicDefenses     PublicDefense[]

  @@index([createdById])
  @@map("projects")
}**

- **RankRequirement 
  id               String   @id @default(cuid())
  rank             Rank
  projectsRequired Int      @default(4) @map("projects_required")
  updatedById      String?  @map("updated_by_id")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([rank])
  @@map("rank_requirements")
}**

- **UserSkillProgress 
  id                String @id @default(cuid())
  userId            String @map("user_id")
  skillTag          String @map("skill_tag")
  projectsCompleted Int    @default(0) @map("projects_completed")
  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skillTag])
  @@index([userId])
  @@map("user_skill_progress")
}**

- **Team 
  id                  String               @id @default(cuid())
  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")
  projectId           String               @map("project_id")
  leaderId            String               @map("leader_id")
  status              TeamStatus           @default(FORMING)
  activatedAt         DateTime?            @map("activated_at")
  blackholeDeadline   DateTime?            @map("blackhole_deadline")
  rank                Rank?
  checkouts           Checkout[]
  conflictFlags       ConflictFlag[]
  damageReports       DamageReport[]
  feedbackReceived    EvaluationFeedback[] @relation("FeedbackTeamReceiver")
  evaluationSlots     EvaluationSlot[]
  availabilityWindows AvailabilityWindow[]
  evaluations         Evaluation[]
  fabricationRequests FabricationRequest[]
  materialRequests    MaterialRequest[]
  members             TeamMember[]
  leader              User                 @relation("TeamLeader", fields: [leaderId], references: [id])
  project             Project              @relation(fields: [projectId], references: [id])
  weeklyReports       WeeklyReport[]
  name                String?
  repoUrl             String?              @map("repo_url")
  isExtensionGranted  Boolean              @default(false) @map("is_extension_granted")
  scratchpad          TeamScratchpad?
  extensionRequests   ExtensionRequest[]
  disputes            EvaluationDispute[]
  nextAttemptApproved Boolean              @default(false) @map("next_attempt_approved")
  postMortems         ProjectPostMortem[]
  publicDefense       PublicDefense?

  @@index([projectId])
  @@index([leaderId])
  @@map("teams")
}**

- **TeamMember 
  id       String   @id @default(cuid())
  teamId   String   @map("team_id")
  userId   String   @map("user_id")
  joinedAt         DateTime @default(now()) @map("joined_at")
  isLeader         Boolean  @default(false) @map("is_leader")
  abandonConfirmed Boolean  @default(false) @map("abandon_confirmed")
  team     Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@map("team_members")
}**

- **AvailabilityWindow 
  id        String           @id @default(cuid())
  teamId    String           @map("team_id")
  startTime DateTime         @map("start_time")
  endTime   DateTime         @map("end_time")
  isOpen    Boolean          @default(true) @map("is_open")
  createdAt DateTime         @default(now()) @map("created_at")
  team      Team             @relation(fields: [teamId], references: [id], onDelete: Cascade)
  slots     EvaluationSlot[]

  @@index([teamId])
  @@map("availability_windows")
}**

- **EvaluationSlot 
  id                   String     @id @default(cuid())
  createdAt            DateTime   @default(now()) @map("created_at")
  availabilityWindowId String     @map("availability_window_id")
  teamId               String     @map("team_id")
  slotStart            DateTime   @map("slot_start")
  slotEnd              DateTime   @map("slot_end")
  claimedById          String?    @map("claimed_by_id")
  claimedAt            DateTime?  @map("claimed_at")
  status               SlotStatus @default(OPEN)
  
  window      AvailabilityWindow @relation(fields: [availabilityWindowId], references: [id], onDelete: Cascade)
  team        Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  evaluations Evaluation[]
  claimedBy   User?              @relation("ClaimedSlots", fields: [claimedById], references: [id])

  @@index([availabilityWindowId])
  @@index([teamId])
  @@index([claimedById])
  @@map("evaluation_slots")
}**

- **Evaluation 
  id                       String               @id @default(cuid())
  createdAt                DateTime             @default(now()) @map("created_at")
  updatedAt                DateTime             @updatedAt @map("updated_at")
  slotId                   String               @map("slot_id")
  evaluatorId              String               @map("evaluator_id")
  teamId                   String               @map("team_id")
  projectId                String               @map("project_id")
  status                   EvaluationStatus     @default(PENDING)
  tier1Score               Float?               @map("tier1_score")
  tier2Score               Float?               @map("tier2_score")
  tier3Score               Float?               @map("tier3_score")
  overallResult            EvaluationResult?    @map("overall_result")
  isStaffEval              Boolean              @default(false) @map("is_staff_eval")
  notificationSentAt       DateTime?            @map("notification_sent_at")
  notificationDelaySeconds Int?                 @map("notification_delay_seconds")
  claimedAt                DateTime?            @map("claimed_at")
  completedAt              DateTime?            @map("completed_at")
  feedback                 EvaluationFeedback[]
  evaluator                User                 @relation("Evaluator", fields: [evaluatorId], references: [id])
  project                  Project              @relation(fields: [projectId], references: [id])
  slot                     EvaluationSlot       @relation(fields: [slotId], references: [id])
  team                     Team                 @relation(fields: [teamId], references: [id])
  sheetVersion             Int                  @default(1) @map("sheet_version")
  totalScore               Float?               @map("total_score")
  passed                   Boolean?
  writtenFeedback          String?              @db.Text @map("written_feedback")
  teamResponse             String?              @db.Text @map("team_response")
  submittedAt              DateTime?            @map("submitted_at")
  durationSeconds          Int?                 @map("duration_seconds")
  isMidnightEval           Boolean              @default(false) @map("is_midnight_eval")
  isAnomaly                Boolean              @default(false) @map("is_anomaly")
  anomalyNote              String?              @db.Text @map("anomaly_note")
  responses                EvalResponse[]

  @@index([slotId])
  @@index([evaluatorId])
  @@index([teamId])
  @@index([projectId])
  @@map("evaluations")
}**

- **EvaluationFeedback 
  id            String       @id @default(cuid())
  createdAt     DateTime     @default(now()) @map("created_at")
  evaluationId  String       @map("evaluation_id")
  fromRole      FeedbackRole @map("from_role")
  toEvaluatorId String?      @map("to_evaluator_id")
  toTeamId      String?      @map("to_team_id")
  rating        Int
  comment       String?
  isAnonymous   Boolean      @default(true) @map("is_anonymous")
  evaluation    Evaluation   @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  toEvaluator   User?        @relation("FeedbackReceiver", fields: [toEvaluatorId], references: [id])
  toTeam        Team?        @relation("FeedbackTeamReceiver", fields: [toTeamId], references: [id])

  @@index([evaluationId])
  @@index([toEvaluatorId])
  @@index([toTeamId])
  @@map("evaluation_feedbacks")
}**

- **WeeklyReport 
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  teamId            String   @map("team_id")
  submittedById     String   @map("submitted_by_id")
  weekNumber        Int      @map("week_number")
  summary           String
  contributionNotes Json     @map("contribution_notes")
  photoUrls         String[] @map("photo_urls")
  readmeUpdated     Boolean  @default(false) @map("readme_updated")
  blockersNotes     String?  @map("blockers_notes")
  pdfUrl            String?  @map("pdf_url")
  isMilestone       Boolean  @default(false) @map("is_milestone")
  milestoneTitle    String?  @map("milestone_title")
  hoursLogged       Float?   @map("hours_logged")
  mood              String?
  nextWeekPlan      String?  @map("next_week_plan")
  submittedBy       User     @relation(fields: [submittedById], references: [id])
  team              Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, weekNumber])
  @@index([teamId])
  @@index([submittedById])
  @@map("weekly_reports")
}**

- **Checkout 
  id               String         @id @default(cuid())
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  userId           String         @map("user_id")
  teamId           String?        @map("team_id")
  itemName         String         @map("item_name")
  quantity         Int            @default(1)
  checkedOutAt     DateTime       @default(now()) @map("checked_out_at")
  expectedReturnAt DateTime       @map("expected_return_at")
  returnedAt       DateTime?      @map("returned_at")
  status           CheckoutStatus @default(OUT)
  team             Team?          @relation(fields: [teamId], references: [id])
  user             User           @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([teamId])
  @@map("checkouts")
}**

- **FabricationRequest 
  id                     String      @id @default(cuid())
  createdAt              DateTime    @default(now()) @map("created_at")
  updatedAt              DateTime    @updatedAt @map("updated_at")
  userId                 String      @map("user_id")
  teamId                 String?     @map("team_id")
  machineType            MachineType @map("machine_type")
  modelFileUrl           String      @map("model_file_url")
  estimatedMinutes       Int         @map("estimated_minutes")
  estimatedMaterialGrams Float       @map("estimated_material_grams")
  purpose                String
  status                 ReqStatus   @default(PENDING)
  scheduledAt            DateTime?   @map("scheduled_at")
  moderatorNote          String?     @map("moderator_note")
  reviewedById           String?     @map("reviewed_by_id")
  reviewedBy             User?       @relation("FabricationReviewer", fields: [reviewedById], references: [id])
  team                   Team?       @relation(fields: [teamId], references: [id])
  user                   User        @relation("Requestor", fields: [userId], references: [id])

  @@index([userId])
  @@index([teamId])
  @@index([reviewedById])
  @@map("fabrication_requests")
}**

- **DamageReport 
  id                 String       @id @default(cuid())
  createdAt          DateTime     @default(now()) @map("created_at")
  updatedAt          DateTime     @updatedAt @map("updated_at")
  reportedById       String       @map("reported_by_id")
  teamId             String?      @map("team_id")
  itemName           String       @map("item_name")
  estimatedValue     Float        @map("estimated_value")
  description        String
  status             DamageStatus @default(REPORTED)
  requiresModeration Boolean      @default(false) @map("requires_moderation")
  moderatorNote      String?      @map("moderator_note")
  resolvedById       String?      @map("resolved_by_id")
  reportedBy         User         @relation("Reporter", fields: [reportedById], references: [id])
  resolvedBy         User?        @relation("DamageResolver", fields: [resolvedById], references: [id])
  team               Team?        @relation(fields: [teamId], references: [id])

  @@index([reportedById])
  @@index([teamId])
  @@index([resolvedById])
  @@map("damage_reports")
}**

- **MaterialRequest 
  id            String            @id @default(cuid())
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")
  teamId        String?           @map("team_id")
  requestedById String            @map("requested_by_id")
  category      MaterialCategory  @default(OTHER)
  itemName      String            @map("item_name")
  quantity      Int               @default(1)
  estimatedCost Float             @map("estimated_cost")
  justification String
  status        MaterialReqStatus @default(PENDING)
  moderatorNote String?           @map("moderator_note")
  reviewedById  String?           @map("reviewed_by_id")
  requestedBy   User              @relation("MaterialRequestor", fields: [requestedById], references: [id])
  reviewedBy    User?             @relation("MaterialReviewer", fields: [reviewedById], references: [id])
  team          Team?             @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@index([requestedById])
  @@index([reviewedById])
  @@map("material_requests")
}**

- **ProjectProposal 
  id                   String         @id @default(cuid())
  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")
  proposedById         String         @map("proposed_by_id")
  title                String
  description          String
  proposedRank         Rank           @map("proposed_rank")
  requiredMaterials    String         @map("required_materials")
  estimatedCost        Float          @map("estimated_cost")
  learningObjectives   String         @map("learning_objectives")
  buildPlan            String         @map("build_plan")
  differentiationNotes String?        @map("differentiation_notes")
  status               ProposalStatus @default(PENDING)
  moderatorNote        String?        @map("moderator_note")
  reviewedById         String?        @map("reviewed_by_id")
  convertedProjectId   String?        @map("converted_project_id")
  convertedProject     Project?       @relation("ConvertedProject", fields: [convertedProjectId], references: [id])
  proposedBy           User           @relation("ProposalCreator", fields: [proposedById], references: [id])
  reviewedBy           User?          @relation("ProposalReviewer", fields: [reviewedById], references: [id])

  @@index([proposedById])
  @@index([reviewedById])
  @@index([convertedProjectId])
  @@map("project_proposals")
}**

- **Achievement 
  id              String            @id @default(cuid())
  key             String            @unique
  title           String
  description     String
  icon            String
  imageUrl        String?           @map("image_url")
  unlockedTitleId String?           @unique @map("unlocked_title_id")
  unlockedTitle   Title?            @relation("AchievementTitle", fields: [unlockedTitleId], references: [id])
  users           UserAchievement[]

  @@map("achievements")
}**

- **Title 
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  achievement Achievement? @relation("AchievementTitle")
  users       UserTitle[]

  @@map("titles")
}**

- **UserTitle 
  id              String   @id @default(cuid())
  unlockedAt      DateTime @default(now()) @map("unlocked_at")
  userId          String   @map("user_id")
  titleId         String   @map("title_id")
  title           Title    @relation(fields: [titleId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, titleId])
  @@index([userId])
  @@index([titleId])
  @@map("user_titles")
}**

- **AdminAuditLog 
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  actorId   String   @map("actor_id")
  targetId  String?  @map("target_id")
  action    String
  details   String?
  actor     User     @relation("AdminActor", fields: [actorId], references: [id])
  target    User?    @relation("AdminTarget", fields: [targetId], references: [id])

  @@index([actorId])
  @@index([targetId])
  @@index([createdAt])
  @@map("admin_audit_logs")
}**

- **UserAchievement 
  id            String      @id @default(cuid())
  unlockedAt    DateTime    @default(now()) @map("unlocked_at")
  userId        String      @map("user_id")
  achievementId String      @map("achievement_id")
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@map("user_achievements")
}**

- **Notification 
  id        String           @id @default(cuid())
  createdAt DateTime         @default(now()) @map("created_at")
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  body      String
  isPush    Boolean          @default(false) @map("is_push")
  readAt    DateTime?        @map("read_at")
  actionUrl String?          @map("action_url")
  deliverAt DateTime         @default(now()) @map("deliver_at")
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("notifications")
}**

- **ConflictFlag 
  id            String         @id @default(cuid())
  createdAt     DateTime       @default(now()) @map("created_at")
  raisedById    String         @map("raised_by_id")
  teamId        String         @map("team_id")
  description   String
  status        ConflictStatus @default(OPEN)
  moderatorNote String?        @map("moderator_note")
  reviewedById  String?        @map("reviewed_by_id")
  raisedBy      User           @relation("ConflictRaiser", fields: [raisedById], references: [id])
  reviewedBy    User?          @relation("ConflictReviewer", fields: [reviewedById], references: [id])
  team          Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([raisedById])
  @@index([teamId])
  @@index([reviewedById])
  @@map("conflict_flags")
}**

- **Workshop 
  id           String         @id @default(cuid())
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  title        String
  description  String
  hostId       String         @map("host_id")
  scheduledAt  DateTime       @map("scheduled_at")
  location     String
  rsvpDeadline DateTime?      @map("rsvp_deadline")
  rsvps        WorkshopRSVP[]
  host         User           @relation("WorkshopHost", fields: [hostId], references: [id])

  @@index([hostId])
  @@map("workshops")
}**

- **WorkshopRSVP 
  id         String     @id @default(cuid())
  createdAt  DateTime   @default(now()) @map("created_at")
  workshopId String     @map("workshop_id")
  userId     String     @map("user_id")
  status     RsvpStatus @default(GOING)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  workshop   Workshop   @relation(fields: [workshopId], references: [id], onDelete: Cascade)

  @@unique([workshopId, userId])
  @@index([workshopId])
  @@index([userId])
  @@map("workshop_rsvps")
}**

- **LabAccessLog 
  id        String     @id @default(cuid())
  createdAt DateTime   @default(now()) @map("created_at")
  userId    String     @map("user_id")
  method    AuthMethod
  success   Boolean
  flagged   Boolean    @default(false)
  note      String?
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("lab_access_logs")
}**

- **AlumniEvaluator 
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  optedInAt DateTime @default(now()) @map("opted_in_at")
  isActive  Boolean  @default(true) @map("is_active")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("alumni_evaluators")
}**

- **Compliment 
  id           String   @id @default(cuid())
  createdAt    DateTime @default(now()) @map("created_at")
  fromUserId   String   @map("from_user_id")
  toUserId     String   @map("to_user_id")
  evaluationId String?  @map("evaluation_id")
  message      String
  fromUser     User     @relation("ComplimentSender", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUser       User     @relation("ComplimentReceiver", fields: [toUserId], references: [id], onDelete: Cascade)

  @@unique([fromUserId, toUserId, evaluationId])
  @@index([fromUserId])
  @@index([toUserId])
  @@map("compliments")
}**

- **MoodBoardNote 
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  authorId  String   @map("author_id")
  content   String
  color     String   @default("#FFD700")
  pinned    Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@map("mood_board_notes")
}**

- **FeatureRequest 
  id          String                @id @default(cuid())
  createdAt   DateTime              @default(now()) @map("created_at")
  updatedAt   DateTime              @updatedAt @map("updated_at")
  userId      String                @map("user_id")
  category    FeatureRequestCategory @default(PLATFORM)
  title       String
  description String
  status      FeatureRequestStatus  @default(OPEN)
  votes       FeatureRequestVote[]
  user        User                  @relation("FeatureRequestCreator", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("feature_requests")
}**

- **FeatureRequestVote 
  id        String         @id @default(cuid())
  createdAt DateTime       @default(now()) @map("created_at")
  userId    String         @map("user_id")
  requestId String         @map("request_id")
  request   FeatureRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, requestId])
  @@index([userId])
  @@index([requestId])
  @@map("feature_request_votes")
}**

- **DynamicRole 
  name        String   @id
  displayName String   @map("display_name")
  isSystem    Boolean  @default(false) @map("is_system")
  isAdmin     Boolean  @default(false) @map("is_admin")
  permissions String[] @default([])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  users       User[]
  @@map("dynamic_roles")
}**

- **ClubSettings 
  id                   String   @id @default("singleton")
  clubName             String   @default("Robotics Club") @map("club_name")
  clubTagline          String   @default("42 Robotics Club Platform") @map("club_tagline")
  description          String   @default("A platform for the 42 Robotics Club members.")
  logoUrl              String?  @map("logo_url")
  maxActiveMembers     Int      @default(30) @map("max_active_members")
  labOpenTime          String   @default("09:00") @map("lab_open_time")
  labCloseTime         String   @default("21:00") @map("lab_close_time")
  defaultBlackholeDays Int      @default(60) @map("default_blackhole_days")
  minTeamSize          Int      @default(2) @map("min_team_size")
  maxTeamSize          Int      @default(5) @map("max_team_size")
  evalCooldownHours    Int      @default(24) @map("eval_cooldown_hours")
  antiSnipeMinutes     Int      @default(5) @map("anti_snipe_minutes")
  allowAlumniEvals     Boolean  @default(true) @map("allow_alumni_evals")
  maintenanceMode      Boolean  @default(false) @map("maintenance_mode")
  maintenanceMessage   String   @default("The platform is currently under maintenance. Please check back later.") @map("maintenance_message")
  goldenShimmerUntil   DateTime? @map("golden_shimmer_until")
  updatedAt            DateTime @updatedAt @map("updated_at")
  updatedById          String?  @map("updated_by_id")
  updatedBy            User?    @relation("SettingsUpdater", fields: [updatedById], references: [id])

  @@map("club_settings")
}**

- **Announcement 
  id          String                  @id @default(cuid())
  createdAt   DateTime                @default(now()) @map("created_at")
  title       String
  body        String
  expiresAt   DateTime                @map("expires_at")
  createdById String                  @map("created_by_id")
  dismissals  AnnouncementDismissal[]
  createdBy   User                    @relation("AnnouncementCreator", fields: [createdById], references: [id])

  @@index([expiresAt])
  @@index([createdById])
  @@map("announcements")
}**

- **AnnouncementDismissal 
  id             String       @id @default(cuid())
  announcementId String       @map("announcement_id")
  userId         String       @map("user_id")
  dismissedAt    DateTime     @default(now()) @map("dismissed_at")
  announcement   Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([announcementId, userId])
  @@index([announcementId])
  @@index([userId])
  @@map("announcement_dismissals")
}**

- **TeamScratchpad 
  teamId         String   @id @map("team_id")
  content        String   @default("")
  lastEditedById String?  @map("last_edited_by_id")
  updatedAt      DateTime @updatedAt @map("updated_at")
  team           Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  lastEditedBy   User?    @relation(fields: [lastEditedById], references: [id])

  @@map("team_scratchpads")
}**

- **ProjectPostMortem 
  id           String   @id @default(cuid())
  teamId       String   @map("team_id")
  userId       String   @map("user_id")
  projectId    String   @map("project_id")
  whatWorked   String   @map("what_worked")
  whatDidnt    String   @map("what_didnt")
  wouldDoBetter String   @map("would_do_better")
  createdAt    DateTime @default(now()) @map("created_at")
  team         Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@index([projectId])
  @@map("project_post_mortems")
}**

- **ExtensionRequest 
  id            String            @id @default(cuid())
  teamId        String            @map("team_id")
  reason        String
  status        MaterialReqStatus @default(PENDING) // Reusing MaterialReqStatus for simplicity if suitable, or create new
  moderatorNote String?           @map("moderator_note")
  reviewedById  String?           @map("reviewed_by_id")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")
  team          Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  reviewedBy    User?             @relation(fields: [reviewedById], references: [id])

  @@index([teamId])
  @@map("extension_requests")
}**

- **EvaluationDispute 
  id            String            @id @default(cuid())
  teamId        String            @map("team_id")
  reason        String
  evidence      String
  status        MaterialReqStatus @default(PENDING)
  moderatorNote String?           @map("moderator_note")
  reviewedById  String?           @map("reviewed_by_id")
  createdAt     DateTime          @default(now()) @map("created_at")
  team          Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  reviewedBy    User?             @relation(fields: [reviewedById], references: [id])

  @@index([teamId])
  @@map("evaluation_disputes")
}**

- **EvalSheet 
  id                String         @id @default(cuid())
  projectId         String         @unique @map("project_id")
  project           Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  version           Int            @default(1)
  passMark          Int            @default(60) @map("pass_mark")
  sections          EvalSection[]
  createdById       String         @map("created_by_id")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")

  @@map("eval_sheets")
}**

- **EvalSection 
  id              String         @id @default(cuid())
  sheetId         String         @map("sheet_id")
  sheet           EvalSheet      @relation(fields: [sheetId], references: [id], onDelete: Cascade)
  title           String
  order           Int
  weight          Int            // percentage of total score
  passMark        Int?           @map("pass_mark") // optional section minimum
  questions       EvalQuestion[]

  @@map("eval_sections")
}**

- **EvalQuestion 
  id                String         @id @default(cuid())
  sectionId         String         @map("section_id")
  section           EvalSection    @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  order             Int
  type              QuestionType
  label             String
  description       String?        @db.Text
  required          Boolean        @default(true)
  isHardRequirement Boolean        @default(false) @map("is_hard_requirement")
  weight            Int            @default(1)
  options           Json?          // for multiple choice / multi-select
  scaleMin          Int?           @map("scale_min") // for linear scale
  scaleMax          Int?           @map("scale_max")
  scaleMinLabel     String?        @map("scale_min_label")
  scaleMaxLabel     String?        @map("scale_max_label")
  passThreshold     Float?         @map("pass_threshold") // minimum value to pass for auto-fail
  responses         EvalResponse[]

  @@map("eval_questions")
}**

- **EvalResponse 
  id              String         @id @default(cuid())
  evaluationId    String         @map("evaluation_id")
  evaluation      Evaluation     @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  questionId      String         @map("question_id")
  question        EvalQuestion   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  value           Json           // flexible — stores any answer type
  createdAt       DateTime       @default(now()) @map("created_at")

  @@map("eval_responses")
}**

- **CalibrationSession 
  id              String                @id @default(cuid())
  createdAt       DateTime              @default(now()) @map("created_at")
  projectId       String                @map("project_id")
  sheetId         String                @map("sheet_id")
  title           String
  description     String                @db.Text
  dummySubmission Json                  @map("dummy_submission")
  isActive        Boolean               @default(true) @map("is_active")
  responses       CalibrationResponse[]

  @@map("calibration_sessions")
}**

- **CalibrationResponse 
  id           String             @id @default(cuid())
  sessionId    String             @map("session_id")
  evaluatorId  String             @map("evaluator_id")
  score        Float
  responses    Json
  feedback     String             @db.Text
  createdAt    DateTime           @default(now()) @map("created_at")
  session      CalibrationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("calibration_responses")
}**

- **DefenseCriteria 
  id            String   @id @default(cuid())
  name          String
  description   String
  order         Int
  minChars      Int      @default(100)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  scores        DefenseCriteriaScore[]

  @@map("defense_criteria")
}**

- **DefenseCriteriaSettings 
  id              String  @id @default("singleton")
  ratingScale     Int     @default(5) @map("rating_scale")
  overallMinChars Int     @default(150) @map("overall_min_chars")
  passThreshold   Int     @default(60) @map("pass_threshold")
  maxCriteria     Int     @default(15) @map("max_criteria")
  minCriteria     Int     @default(5) @map("min_criteria")
  updatedAt       DateTime @updatedAt @map("updated_at")
  updatedById    String? @map("updated_by_id")
  updatedBy      User?   @relation("DefenseSettingsUpdater", fields: [updatedById], references: [id])

  @@map("defense_criteria_settings")
}**

- **PublicDefense 
  id                    String        @id @default(cuid())
  teamId                String        @unique @map("team_id")
  team                  Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)
  projectId             String        @map("project_id")
  project               Project       @relation(fields: [projectId], references: [id])
  scheduledAt           DateTime      @map("scheduled_at")
  status                DefenseStatus @default(SCHEDULED)
  
  evaluationOpen        Boolean       @default(false) @map("evaluation_open")
  evaluationOpenedAt    DateTime?     @map("evaluation_opened_at")
  evaluationOpenedById  String?       @map("evaluation_opened_by_id")
  evaluationOpenedBy    User?         @relation("DefenseOpenedBy", fields: [evaluationOpenedById], references: [id])
  
  evaluationClosed      Boolean       @default(false) @map("evaluation_closed")
  evaluationClosedAt    DateTime?     @map("evaluation_closed_at")
  evaluationClosedById  String?       @map("evaluation_closed_by_id")
  evaluationClosedBy    User?         @relation("DefenseClosedBy", fields: [evaluationClosedById], references: [id])
  
  reopened              Boolean       @default(false)
  reopenedAt            DateTime?     @map("reopened_at")
  reopenedById          String?       @map("reopened_by_id")
  reopenedBy            User?         @relation("DefenseReopenedBy", fields: [reopenedById], references: [id])
  reopenNote            String?       @map("reopen_note")
  
  expertJuryOnly        Boolean       @default(false) @map("expert_jury_only")
  expertJuryOnlySetById String?       @map("expert_jury_only_set_by_id")
  expertJuryOnlySetAt   DateTime?     @map("expert_jury_only_set_at")
  
  lowerRankDispelled    Boolean       @default(false) @map("lower_rank_dispelled")
  lowerRankDispelledById String?      @map("lower_rank_dispelled_by_id")
  lowerRankDispelledAt  DateTime?     @map("lower_rank_dispelled_at")
  lowerRankDispelledNote String?      @map("lower_rank_dispelled_note")
  
  minimumMet            Boolean       @default(false) @map("minimum_met")
  provisionalReason     String?       @map("provisional_reason")
  
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")
  
  registrations         DefenseRegistration[]
  evaluations           DefenseEvaluation[]
  result                DefenseResult?

  @@map("public_defenses")
}**

- **DefenseRegistration 
  id           String        @id @default(cuid())
  defenseId    String        @map("defense_id")
  defense      PublicDefense @relation(fields: [defenseId], references: [id], onDelete: Cascade)
  userId       String        @map("user_id")
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  userRank     String        @map("user_rank")
  isAdmin      Boolean       @default(false) @map("is_admin")
  registeredAt DateTime      @default(now()) @map("registered_at")
  
  @@unique([defenseId, userId])
  @@map("defense_registrations")
}**

- **DefenseEvaluation 
  id              String        @id @default(cuid())
  defenseId       String        @map("defense_id")
  defense         PublicDefense @relation(fields: [defenseId], references: [id], onDelete: Cascade)
  evaluatorId     String        @map("evaluator_id")
  evaluator       User          @relation(fields: [evaluatorId], references: [id], onDelete: Cascade)
  evaluatorRank   String        @map("evaluator_rank")
  evaluatorWeight Float         @map("evaluator_weight")
  isAdmin         Boolean       @default(false) @map("is_admin")
  
  criteriaScores  DefenseCriteriaScore[]
  overallReview   String        @db.Text @map("overall_review")
  totalScore      Float?        @map("total_score")
  
  submittedAt     DateTime      @default(now()) @map("submitted_at")
  
  @@unique([defenseId, evaluatorId])
  @@map("defense_evaluations")
}**

- **DefenseCriteriaScore 
  id           String            @id @default(cuid())
  evaluationId String            @map("evaluation_id")
  evaluation   DefenseEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  criteriaId   String            @map("criteria_id")
  criteria     DefenseCriteria   @relation(fields: [criteriaId], references: [id])
  score        Int
  note         String            @db.Text
  
  @@unique([evaluationId, criteriaId])
  @@map("defense_criteria_scores")
}**

- **DefenseResult 
  id                   String        @id @default(cuid())
  defenseId            String        @unique @map("defense_id")
  defense              PublicDefense @relation(fields: [defenseId], references: [id], onDelete: Cascade)
  
  adminAverage         Float?        @map("admin_average")
  adminPassed          Boolean?      @map("admin_passed")
  adminCount           Int           @default(0) @map("admin_count")
  
  expertAverage        Float?        @map("expert_average")
  expertPassed         Boolean?      @map("expert_passed")
  expertCount          Int           @default(0) @map("expert_count")
  
  galleryWeighted      Float?        @map("gallery_weighted")
  galleryCount         Int           @default(0) @map("gallery_count")
  galleryExcluded      Boolean       @default(false) @map("gallery_excluded")
  
  finalScore           Float         @map("final_score")
  passed               Boolean
  provisional          Boolean       @default(false)
  provisionalReason    String?       @map("provisional_reason")
  
  presidentConfirmed   Boolean       @default(false) @map("president_confirmed")
  presidentConfirmedById String?      @map("president_confirmed_by_id")
  presidentConfirmedAt DateTime?     @map("president_confirmed_at")
  
  calculatedAt         DateTime      @default(now()) @map("calculated_at")

  @@map("defense_results")
}**

### ENUMS
- **Status 
  WAITLIST
  ACTIVE
  BLACKHOLED
  ALUMNI
}**: 
- **Rank 
  E
  D
  C
  B
  A
  S
}**: 
- **Theme 
  FORGE
  FIELD
}**: 
- **ProjectStatus 
  DRAFT
  ACTIVE
  RETIRED
}**: 
- **TeamStatus 
  FORMING
  ACTIVE
  EVALUATING
  COMPLETED
  BLACKHOLED
  ABANDONED
}**: 
- **SlotStatus 
  OPEN
  CLAIMED
  COMPLETED
  NO_SHOW
}**: 
- **EvaluationStatus 
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}**: 
- **EvaluationResult 
  PASS
  FAIL
}**: 
- **FeedbackRole 
  TEAM
  EVALUATOR
  PEER
}**: 
- **CheckoutStatus 
  OUT
  RETURNED
  OVERDUE
  FLAGGED
}**: 
- **MachineType 
  PRINTER_FDM
  PRINTER_RESIN
  CNC
}**: 
- **ReqStatus 
  PENDING
  APPROVED
  REJECTED
  SCHEDULED
  COMPLETED
}**: 
- **DamageStatus 
  REPORTED
  UNDER_REVIEW
  RESOLVED
}**: 
- **MaterialReqStatus 
  PENDING
  APPROVED
  REJECTED
}**: 
- **ProposalStatus 
  PENDING
  APPROVED
  REJECTED
  CONVERTED
}**: 
- **NotificationType 
  EVAL_SLOT_AVAILABLE
  EVAL_SLOT_CLAIMED
  EVAL_CANCELLED
  BLACKHOLE_WARNING
  PRINT_APPROVED
  REPORT_DUE
  WORKSHOP_ANNOUNCED
  ACHIEVEMENT_UNLOCKED
  FEEDBACK_RECEIVED
  MATERIAL_REQUEST_UPDATE
  DAMAGE_REPORT_UPDATE
  GENERAL
  PLATFORM_OBSERVATION
  PUBLIC_DEFENSE
}**: 
- **ConflictStatus 
  OPEN
  REVIEWED
  RESOLVED
}**: 
- **RsvpStatus 
  GOING
  NOT_GOING
}**: 
- **AuthMethod 
  FINGERPRINT
  QR_CODE
}**: 
- **FeatureRequestStatus 
  OPEN
  PLANNED
  DONE
  DISMISSED
}**: 
- **QuestionType 
  STAR_RATING
  CHECKBOX
  LINEAR_SCALE
  MULTIPLE_CHOICE
  SHORT_TEXT
  LONG_TEXT
}**: 
- **MaterialCategory 
  ELECTRONICS
  HARDWARE
  CONSUMABLE
  OTHER
}**: 
- **FeatureRequestCategory 
  PLATFORM
  PRINTERS
  CNC
  EQUIPMENT
  FACILITY
}**: 
- **DefenseStatus 
  SCHEDULED
  MINIMUM_NOT_MET
  OPEN
  CLOSED
  PROVISIONAL
  PASSED
  FAILED
  RESCHEDULED
}**: 

─────────────────────────────────────────\n## 4. COMPONENTS\n- **/src/components/admin/AccessSecurity.tsx**
  - Renders: AccessSecurity
  - Type: Client
  - Props: interface LogEntry {
	id: string;
	userName: string;
	userLogin: string;
	userImage: string | null;
	method: string;
	success: boolean;
	flagged: bool...

- **/src/components/admin/AchievementEditor.tsx**
  - Renders: AchievementEditor
  - Type: Client
  - Props: interface Achievement {
	id: string;
	key: string;
	title: string;
	description: string;
	icon: string;
	unlockedTitleId: string | null;
}

- **/src/components/admin/AdminNav.tsx**
  - Renders: AdminNav
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/admin/Analytics.tsx**
  - Renders: Analytics
  - Type: Server
  - Props: interface RankDist { rank: string; count: number; }

- **/src/components/admin/AnnouncementManager.tsx**
  - Renders: AnnouncementManager
  - Type: Client
  - Props: interface AnnouncementItem {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	expiresAt: string;
	createdBy: { login: string; name: st...

- **/src/components/admin/AuditLogView.tsx**
  - Renders: AuditLogView
  - Type: Client
  - Props: interface AuditLog {
	id: string;
	createdAt: string;
	action: string;
	details: string | null;
	actor: { login: string; name: string }

- **/src/components/admin/ClubSettingsPanel.tsx**
  - Renders: ClubSettingsPanel
  - Type: Client
  - Props: interface Settings {
	clubName: string;
	clubTagline: string;
	maxActiveMembers: number;
	labOpenTime: string;
	labCloseTime: string;
	defaultBlackhol...

- **/src/components/admin/ContentManagement.tsx**
  - Renders: ContentManagement
  - Type: Client
  - Props: interface ProjectItem {
	id: string;
	title: string;
	rank: string;
	status: string;
	teamCount: number;
	description: string;
	teamSizeMin: number;
	...

- **/src/components/admin/DefenseCriteriaEditor.tsx**
  - Renders: DefenseCriteriaEditor
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/admin/MemberControl.tsx**
  - Renders: MemberControl
  - Type: Client
  - Props: interface MemberUser {
	id: string;
	login: string;
	name: string;
	image: string | null;
	currentRank: string;
	status: string;
	labAccessEnabled: bo...

- **/src/components/admin/ModerationQueue.tsx**
  - Renders: ModerationQueue
  - Type: Client
  - Props: interface FabReq { id: string; userName: string; userLogin: string; machineType: string; purpose: string; estimatedTime: number | null; material: stri...

- **/src/components/admin/MoodBoard.tsx**
  - Renders: MoodBoard
  - Type: Client
  - Props: interface Note {
	id: string;
	content: string;
	color: string;
	pinned: boolean;
	createdAt: string;
	author: { login: string; name: string }

- **/src/components/admin/RankRequirementsEditor.tsx**
  - Renders: RankRequirementsEditor
  - Type: Client
  - Props: interface RankReq {
	rank: Rank;
	projectsRequired: number;
	requiredProjectCount: number;
}

- **/src/components/admin/RoleManagement.tsx**
  - Renders: RoleManagement
  - Type: Client
  - Props: interface DynamicRoleItem {
	name: string;
	displayName: string;
	isSystem: boolean;
	isAdmin: boolean;
	permissions: string[];
	_count: { users: numb...

- **/src/components/admin/TitleManager.tsx**
  - Renders: TitleManager
  - Type: Client
  - Props: interface Title {
	id: string;
	name: string;
	description: string | null;
	isCustom: boolean;
	createdAt: string;
}

- **/src/components/admin/evaluations/AdminOversight.tsx**
  - Renders: AdminOversight
  - Type: Client
  - Props: interface Evaluation {
	id: string;
	status: string;
	totalScore: number | null;
	passed: boolean;
	isAnomaly: boolean;
	anomalyNote: string | null;
	...

- **/src/components/admin/evaluations/CalibrationPortal.tsx**
  - Renders: CalibrationPortal
  - Type: Client
  - Props: interface CalibrationSession {
	id: string;
	title: string;
	description: string;
	projectId: string;
	sheetId: string;
	isActive: boolean;
	responses...

- **/src/components/admin/evaluations/DefenseOversight.tsx**
  - Renders: DefenseOversight
  - Type: Client
  - Props: interface DefenseOversightProps {
	userRole: string;
	permissions: string[];
}

- **/src/components/admin/evaluations/EvalSheetEditor.tsx**
  - Renders: EvalSheetEditor
  - Type: Client
  - Props: interface EvalSheetEditorProps {
	projectId: string;
	projectTitle: string;
}

- **/src/components/admin/sections/AdminAccessSection.tsx**
  - Renders: AdminAccessSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/admin/sections/AdminAnalyticsSection.tsx**
  - Renders: AdminAnalyticsSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/admin/sections/AdminContentSection.tsx**
  - Renders: AdminContentSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/admin/sections/AdminMembersSection.tsx**
  - Renders: AdminMembersSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/admin/sections/AdminQueueSection.tsx**
  - Renders: AdminQueueSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/auth/SignOutButton.tsx**
  - Renders: SignOutButton
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/cursus/ProjectCockpit.tsx**
  - Renders: ProjectCockpit
  - Type: Client
  - Props: interface TeamMemberUser {
	id: string;
	login: string;
	name: string;
	image: string | null;
	githubHandle: string | null;
}

- **/src/components/cursus/ProjectCockpitSection.tsx**
  - Renders: ProjectCockpitSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/cursus/SkillTree.tsx**
  - Renders: SkillTree
  - Type: Client
  - Props: interface ProjectNode {
	id: string;
	title: string;
	rank: string;
	skillTags: string[];
	blackholeDays: number;
	teamSizeMin: number;
	teamSizeMax: ...

- **/src/components/cursus/SkillTreeSection.tsx**
  - Renders: SkillTreeSection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/cursus/cockpit/AvailabilityPicker.tsx**
  - Renders: AvailabilityPicker
  - Type: Client
  - Props: interface AvailabilityWindow {
	startTime: Date;
	endTime: Date;
}

- **/src/components/cursus/cockpit/CockpitDanger.tsx**
  - Renders: CockpitDanger
  - Type: Client
  - Props: interface CockpitDangerProps {
	team: any;
	isAdmin: boolean;
	currentUser: any;
}

- **/src/components/cursus/cockpit/CockpitHeader.tsx**
  - Renders: CockpitHeader
  - Type: Client
  - Props: interface CockpitHeaderProps {
	team: any;
	currentUser: any;
	isAdmin: boolean;
}

- **/src/components/cursus/cockpit/CockpitMaterials.tsx**
  - Renders: CockpitMaterials
  - Type: Client
  - Props: interface CockpitMaterialsProps {
	team: any;
	isAdmin: boolean;
}

- **/src/components/cursus/cockpit/CockpitOverview.tsx**
  - Renders: CockpitOverview
  - Type: Client
  - Props: interface CockpitOverviewProps {
	team: any;
	isAdmin: boolean;
}

- **/src/components/cursus/cockpit/CockpitReports.tsx**
  - Renders: CockpitReports
  - Type: Client
  - Props: interface CockpitReportsProps {
	team: any;
	isAdmin: boolean;
}

- **/src/components/cursus/cockpit/CockpitShell.tsx**
  - Renders: CockpitShell
  - Type: Client
  - Props: interface CockpitShellProps {
	team: any;
	currentUser: any;
	isAdmin: boolean;
	hasSubmittedPostMortem: boolean;
}

- **/src/components/cursus/cockpit/CockpitSubmission.tsx**
  - Renders: CockpitSubmission
  - Type: Client
  - Props: interface CockpitSubmissionProps {
	team: any;
	isAdmin: boolean;
}

- **/src/components/cursus/cockpit/PhotoTimeline.tsx**
  - Renders: PhotoTimeline
  - Type: Client
  - Props: interface Photo {
	url: string;
	weekNumber: number;
	milestoneTitle?: string;
}

- **/src/components/cursus/cockpit/PostMortemForm.tsx**
  - Renders: PostMortemForm
  - Type: Client
  - Props: interface PostMortemFormProps {
	team: any;
	onSuccess: () => void;
}

- **/src/components/cursus/cockpit/PublicDefenseScheduler.tsx**
  - Renders: PublicDefenseScheduler
  - Type: Client
  - Props: interface PublicDefenseSchedulerProps {
	team: any;
}

- **/src/components/cursus/project/ProjectBrief.tsx**
  - Renders: ProjectBrief
  - Type: Client
  - Props: interface ProjectBriefProps {
	project: any;
}

- **/src/components/cursus/project/ProjectCommunityKnowledge.tsx**
  - Renders: ProjectCommunityKnowledge
  - Type: Client
  - Props: interface ProjectCommunityKnowledgeProps {
	project: any;
	userId: string;
}

- **/src/components/cursus/project/ProjectCurrentActivity.tsx**
  - Renders: ProjectCurrentActivity
  - Type: Client
  - Props: interface ProjectCurrentActivityProps {
	project: any;
}

- **/src/components/cursus/project/ProjectHero.tsx**
  - Renders: ProjectHero
  - Type: Client
  - Props: interface ProjectHeroProps {
	project: any;
	isEligible: boolean;
	eligibilityError: string | null;
	isCurrentlyActive: boolean;
	stats: {
		completio...

- **/src/components/cursus/project/ProjectHistoryWall.tsx**
  - Renders: ProjectHistoryWall
  - Type: Client
  - Props: interface ProjectHistoryWallProps {
	project: any;
}

- **/src/components/cursus/registration/RegistrationCommitStep.tsx**
  - Renders: RegistrationCommitStep
  - Type: Client
  - Props: interface RegistrationCommitStepProps {
	project: any;
	commits: any;
	setCommits: (c: any) => void;
}

- **/src/components/cursus/registration/RegistrationLaunchStep.tsx**
  - Renders: RegistrationLaunchStep
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/cursus/registration/RegistrationModal.tsx**
  - Renders: RegistrationModal
  - Type: Client
  - Props: interface RegistrationModalProps {
	project: any;
	isOpen: boolean;
	onClose: () => void;
}

- **/src/components/cursus/registration/RegistrationTeamStep.tsx**
  - Renders: RegistrationTeamStep
  - Type: Client
  - Props: interface RegistrationTeamStepProps {
	project: any;
	selectedMembers: any[];
	setSelectedMembers: (members: any[]) => void;
	onNext: () => void;
	onO...

- **/src/components/evaluations/AvailableMissions.tsx**
  - Renders: AvailableMissions
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/evaluations/ClaimSlotModal.tsx**
  - Renders: ClaimSlotModal
  - Type: Client
  - Props: interface ClaimSlotModalProps {
	window: any;
	onClose: () => void;
	onClaimed: () => void;
}

- **/src/components/evaluations/DefenseEvaluationForm.tsx**
  - Renders: DefenseEvaluationForm
  - Type: Client
  - Props: interface DefenseEvaluationFormProps {
	defenseId: string;
}

- **/src/components/evaluations/DefenseResultPage.tsx**
  - Renders: DefenseResultPage
  - Type: Client
  - Props: interface DefenseResultPageProps {
	defenseId: string;
}

- **/src/components/evaluations/EvaluationForm.tsx**
  - Renders: EvaluationForm
  - Type: Client
  - Props: interface EvaluationFormProps {
	slotId: string;
}

- **/src/components/evaluations/EvaluationHistory.tsx**
  - Renders: EvaluationHistory
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/evaluations/EvaluationResult.tsx**
  - Renders: EvaluationResult
  - Type: Client
  - Props: interface EvaluationResultProps {
	evaluationId: string;
}

- **/src/components/evaluations/EvaluationsPage.tsx**
  - Renders: EvaluationsPage
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/evaluations/EvaluatorPrepModal.tsx**
  - Renders: EvaluatorPrepModal
  - Type: Client
  - Props: interface EvaluatorPrepModalProps {
	slot: any;
	onClose: () => void;
	onReady: () => void;
}

- **/src/components/evaluations/PublicDefenseSection.tsx**
  - Renders: PublicDefenseSection
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/evaluations/UpcomingMissions.tsx**
  - Renders: UpcomingMissions
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/feature-requests/FeatureRequestList.tsx**
  - Renders: FeatureRequestList
  - Type: Client
  - Props: interface FeatureReq {
	id: string;
	category: string;
	title: string;
	description: string;
	status: string;
	createdAt: string;
	authorLogin: string...

- **/src/components/home/ActiveProjectCard.tsx**
  - Renders: ActiveProjectCard
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/home/AnnouncementBanners.tsx**
  - Renders: AnnouncementBanners
  - Type: Client
  - Props: interface ActiveAnnouncement {
	id: string;
	title: string;
	body: string;
	createdAt: string;
	expiresAt: string;
}

- **/src/components/home/BirthdayConfetti.tsx**
  - Renders: BirthdayConfetti
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/home/BirthdaySection.tsx**
  - Renders: BirthdaySection
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/home/MissionTicker.tsx**
  - Renders: MissionTicker
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/home/NotificationList.tsx**
  - Renders: NotificationList
  - Type: Client
  - Props: interface Notification {
	id: string;
	type: string;
	title: string;
	body: string | null;
	createdAt: string;
	readAt: string | null;
}

- **/src/components/home/NotificationPanel.tsx**
  - Renders: NotificationPanel
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/home/RecentAchievements.tsx**
  - Renders: RecentAchievements
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/home/UpcomingEvaluations.tsx**
  - Renders: UpcomingEvaluations
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/home/UserOverview.tsx**
  - Renders: UserOverview
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/home/WorkshopRsvpButton.tsx**
  - Renders: WorkshopRsvpButton
  - Type: Client
  - Props: interface WorkshopRsvpButtonProps {
	workshopId: string;
	initialStatus: "GOING" | "NOT_GOING" | null;
}

- **/src/components/home/WorkshopSidebar.tsx**
  - Renders: WorkshopSidebar
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/layout/ClientLogo.tsx**
  - Renders: ClientLogo
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/layout/EasterEggManager.tsx**
  - Renders: EasterEggManager
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/layout/ImpersonationBanner.tsx**
  - Renders: ImpersonationBanner
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/layout/KeyboardShortcuts.tsx**
  - Renders: KeyboardShortcuts
  - Type: Client
  - Props: interface KeyboardShortcutsProps {
	hasAdminAccess?: boolean;
}

- **/src/components/layout/MatrixRain.tsx**
  - Renders: MatrixRain
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/layout/StudentLayout.tsx**
  - Renders: StudentLayout
  - Type: Server
  - Props: interface StudentLayoutProps {
	children: React.ReactNode;
	user: {
		login: string;
		image: string | null;
		activeTheme: "FORGE" | "FIELD";
		role?...

- **/src/components/layout/StudentNav.tsx**
  - Renders: StudentNav
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/layout/ThemeInitializer.tsx**
  - Renders: ThemeInitializer
  - Type: Client
  - Props: interface ThemeInitializerProps {
	theme: string;
}

- **/src/components/layout/ThemeManager.tsx**
  - Renders: ThemeManager
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/onboarding/FirstLoginIntro.tsx**
  - Renders: FirstLoginIntro
  - Type: Client
  - Props: interface FirstLoginIntroProps {
	tagline: string;
}

- **/src/components/onboarding/WaitlistWelcomeModal.tsx**
  - Renders: WaitlistWelcomeModal
  - Type: Client
  - Props: interface WaitlistWelcomeModalProps {
	position: number;
}

- **/src/components/profile/AchievementsGrid.tsx**
  - Renders: AchievementsGrid
  - Type: Client
  - Props: interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	imageUrl?: string | null;
	unlockedTitle?: { name: string }

- **/src/components/profile/ActiveMissions.tsx**
  - Renders: ActiveMissions
  - Type: Client
  - Props: interface ActiveMissionsProps {
	teams: any[];
	currentUserId: string;
}

- **/src/components/profile/AdminNotesSection.tsx**
  - Renders: AdminNotesSection
  - Type: Client
  - Props: interface AdminNote {
	id: string;
	author: { login: string }

- **/src/components/profile/AlumniToggle.tsx**
  - Renders: AlumniToggle
  - Type: Client
  - Props: interface AlumniToggleProps {
	isOptedIn: boolean;
}

- **/src/components/profile/ClientAvatar.tsx**
  - Renders: ClientAvatar
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/profile/ComplimentWall.tsx**
  - Renders: ComplimentWall
  - Type: Client
  - Props: interface Compliment {
	id: string;
	message: string;
	createdAt: string;
}

- **/src/components/profile/ProfileCard.tsx**
  - Renders: ProfileCard
  - Type: Client
  - Props: interface ProfileCardProps {
	user: {
		id: string;
		name: string;
		login: string;
		avatar: string | null;
		currentRank: string;
		joinedAt: strin...

- **/src/components/profile/ProfileHeader.tsx**
  - Renders: ProfileHeader
  - Type: Client
  - Props: interface Milestone {
	title: string;
	timestamp: Date | string;
}

- **/src/components/profile/ProjectHistory.tsx**
  - Renders: ProjectHistory
  - Type: Server
  - Props: interface CompletedTeam {
	team: {
		updatedAt: Date | string;
		project: {
			title: string;
			rank: string;
			skillTags: string[];
		}

- **/src/components/profile/QuoteBar.tsx**
  - Renders: QuoteBar
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/profile/SendCompliment.tsx**
  - Renders: SendCompliment
  - Type: Client
  - Props: interface SendComplimentProps {
	toUserId: string;
	toUserLogin: string;
}

- **/src/components/profile/SkillRadar.tsx**
  - Renders: SkillRadar
  - Type: Server
  - Props: interface Skill {
	skillTag: string;
	projectsCompleted: number;
}

- **/src/components/profile/TeamHistory.tsx**
  - Renders: TeamHistory
  - Type: Client
  - Props: interface TeamHistoryTeam {
	team: {
		id: string;
		status: string;
		project: { title: string }

- **/src/components/profile/TitleSelector.tsx**
  - Renders: TitleSelector
  - Type: Client
  - Props: interface TitleSelectorProps {
	initialTitle: string | null;
	unlockedTitles: string[];
}

- **/src/components/requests/FabricationRequestList.tsx**
  - Renders: FabricationRequestList
  - Type: Client
  - Props: interface FabReq {
	id: string;
	machineType: string;
	modelFileUrl: string;
	estimatedMinutes: number;
	estimatedMaterialGrams: number;
	status: stri...

- **/src/components/requests/MaterialRequestList.tsx**
  - Renders: MaterialRequestList
  - Type: Client
  - Props: interface MaterialReq {
	id: string;
	itemName: string;
	quantity: number;
	estimatedCost: number;
	category: string;
	status: string;
	createdAt: str...

- **/src/components/requests/ProjectProposalForm.tsx**
  - Renders: ProjectProposalForm
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/requests/RequestsDashboard.tsx**
  - Renders: RequestsDashboard
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/showcase/FilterBar.tsx**
  - Renders: FilterBar
  - Type: Client
  - Props: interface FilterBarProps {
	ranks: string[];
	skillTags: string[];
	totalCount: number;
}

- **/src/components/showcase/ShowcaseCard.tsx**
  - Renders: ShowcaseCard
  - Type: Client
  - Props: interface ShowcaseTeam {
	id: string;
	status: string;
	updatedAt: Date | string;
	rank: string;
	project: {
		title: string;
		description: string | ...

- **/src/components/showcase/ShowcaseConfetti.tsx**
  - Renders: ShowcaseConfetti
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/ui/Badge.tsx**
  - Renders: Badge
  - Type: Server
  - Props: interface BadgeProps {
	rank: RankValue;
	size?: BadgeSize;
	className?: string;
}

- **/src/components/ui/BlackholeTimer.tsx**
  - Renders: BlackholeTimer
  - Type: Client
  - Props: interface BlackholeTimerProps {
	deadline: Date | string;
	activatedAt: Date | string;
	className?: string;
}

- **/src/components/ui/Button.tsx**
  - Renders: Button
  - Type: Server
  - Props: interface ButtonProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: ...

- **/src/components/ui/Card.tsx**
  - Renders: Card
  - Type: Server
  - Props: No explicit props interface found

- **/src/components/ui/FileUpload.tsx**
  - Renders: FileUpload
  - Type: Client
  - Props: interface FileUploadProps {
	teamId: string;
	uploadType: "reports" | "fabrication";
	onUploadComplete: (data: { url: string; publicId: string }

- **/src/components/ui/NotificationBell.tsx**
  - Renders: NotificationBell
  - Type: Client
  - Props: interface Notification {
	id: string;
	title: string;
	body: string | null;
	createdAt: string;
	readAt: string | null;
	actionUrl: string | null;
}

- **/src/components/ui/Terminal.tsx**
  - Renders: Terminal
  - Type: Client
  - Props: interface UserData {
	login: string;
	currentRank: string;
	name: string;
	completedProjects: number;
	evaluationsGiven: number;
	topSkill: string | n...

- **/src/components/ui/ThemeToggle.tsx**
  - Renders: ThemeToggle
  - Type: Client
  - Props: No explicit props interface found

- **/src/components/ui/Toast.tsx**
  - Renders: toast
  - Type: Client
  - Props: interface ToastData {
	id: number;
	message: string;
	type: "success" | "error";
}

- **/src/components/utils/DatabaseKeepAlive.tsx**
  - Renders: DatabaseKeepAlive
  - Type: Client
  - Props: No explicit props interface found

─────────────────────────────────────────\n## 5. LIBRARIES & HELPERS\n- **achievements.ts** (/src/lib/achievements.ts)
  - Exports: Default/Config exported
  - Description: Utility/library module.

- **admin-auth.ts** (/src/lib/admin-auth.ts)
  - Exports: isAdminRole
  - Description: Utility/library module.

- **api.ts** (/src/lib/api.ts)
  - Exports: ok, err
  - Description: Utility/library module.

- **auth.ts** (/src/lib/auth.ts)
  - Exports: authOptions
  - Description: Utility/library module.

- **cloudinary.ts** (/src/lib/cloudinary.ts)
  - Exports: Default/Config exported
  - Description: Utility/library module.

- **club-settings.ts** (/src/lib/club-settings.ts)
  - Exports: Default/Config exported
  - Description: Utility/library module.

- **constants.ts** (/src/lib/constants.ts)
  - Exports: APP_NAME
  - Description: Utility/library module.

- **defense-scoring.ts** (/src/lib/defense-scoring.ts)
  - Exports: EVALUATOR_WEIGHTS, getEvaluatorWeight, calculateEvaluationScore, calculateDefenseResult
  - Description: Utility/library module.

- **eval-scoring.ts** (/src/lib/eval-scoring.ts)
  - Exports: calculateScore
  - Description: Utility/library module.

- **evaluation-eligibility.ts** (/src/lib/evaluation-eligibility.ts)
  - Exports: rankValues, maxEvaluationTarget, isEligibleEvaluator
  - Description: Utility/library module.

- **permissions.ts** (/src/lib/permissions.ts)
  - Exports: ALL_PERMISSIONS, hasPermission, hasAnyPermission
  - Description: Utility/library module.

- **prisma.ts** (/src/lib/prisma.ts)
  - Exports: Default/Config exported
  - Description: Utility/library module.

- **projects.ts** (/src/lib/queries/projects.ts)
  - Exports: getActiveProjects, getProjectById, getProjectFullDetail
  - Description: Utility/library module.

- **users.ts** (/src/lib/queries/users.ts)
  - Exports: getUserProfile, getUserActiveTeam
  - Description: Utility/library module.

- **rank-advancement.ts** (/src/lib/rank-advancement.ts)
  - Exports: Default/Config exported
  - Description: Utility/library module.

- **rank-requirements.ts** (/src/lib/rank-requirements.ts)
  - Exports: Default/Config exported
  - Description: Utility/library module.

- **theme-engine.ts** (/src/lib/theme-engine.ts)
  - Exports: ThemeEngine
  - Description: Utility/library module.

- **theme.ts** (/src/lib/theme.ts)
  - Exports: applyTheme, initTheme
  - Description: Utility/library module.

- **themes.ts** (/src/lib/themes.ts)
  - Exports: THEMES, getThemeById
  - Description: Utility/library module.

- **evaluation-utils.ts** (/src/lib/utils/evaluation-utils.ts)
  - Exports: TACTICAL_ADJECTIVES, getTacticalMask, getIdentityRevealStatus
  - Description: Utility/library module.

─────────────────────────────────────────\n## 6. HOOKS\n- **/src/hooks/useCheatCodes.ts**
  - Hook Name: useCheatCodes
  - Returns: Object/Value returned

─────────────────────────────────────────\n## 7. PROVIDERS & CONTEXT\n- **/src/components/layout/ThemeProvider.tsx**
  - Manages Context: ThemeProvider
  - Exposes state across the component tree.

- **/src/components/providers/Providers.tsx**
  - Manages Context: Providers
  - Exposes state across the component tree.

- **/src/components/providers/SoundProvider.tsx**
  - Manages Context: SoundProvider
  - Exposes state across the component tree.

- **/src/components/ui/TerminalProvider.tsx**
  - Manages Context: TerminalProvider
  - Exposes state across the component tree.

─────────────────────────────────────────\n## 8. SCRIPTS\n- **/scripts/add-members.ts**
  - Description: Utility script tasks.
  - Execution: Typically run via package.json or node.

- **/scripts/find-fake-members.ts**
  - Description: Utility script tasks.
  - Execution: Typically run via package.json or node.

- **/scripts/wipe-dummy-members.ts**
  - Description: import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROTECTED_LOGINS = [
  "sshameer", "akheiral", "aelsafi", "fmohamed", "nateliya", "mamuzamm", "eabdelfa",
  "samamaev", "awaahmed", "fkuruthl", "iabdul-n", "ssujaude", "haiqbal",
  "moashraf", "hajmoham", "khzernou", "eihebini", "assempas", "smorlier",
  "jalsadik", "mdheen", "krajbans"
];

async function main() {
  console.log("Starting intelligent member cleanup...");

   Find all users not in the whitelist
  const dummyUsers = await prisma.user.findMany({
    where: {
      login: { notIn: PROTECTED_LOGINS }
    },
    select: { login: true, id: true }
  });

  console.log(`Found ${dummyUsers.length} potential dummy/filler members.`);

  for (const { login, id: userId } of dummyUsers) {
    try {

      // 1. Handle deep dependencies that prevent Team/Project/User deletion
      // These are relations without ON DELETE CASCADE or that block parent deletion
      
      // Cleanup all things that reference Teams that will be deleted
      const teamFilter = { OR: [{ leaderId: userId }, { project: { createdById: userId } }] };
      
      await prisma.evaluation.deleteMany({ where: { OR: [{ evaluatorId: userId }, { team: teamFilter }] } });
      await prisma.evaluationSlot.deleteMany({ where: { OR: [{ claimedById: userId }, { team: teamFilter }] } });
      await prisma.weeklyReport.deleteMany({ where: { OR: [{ submittedById: userId }, { team: teamFilter }] } });
      await prisma.checkout.deleteMany({ where: { OR: [{ userId }, { team: teamFilter }] } });
      await prisma.damageReport.deleteMany({ where: { OR: [{ reportedById: userId }, { resolvedById: userId }, { team: teamFilter }] } });
      await prisma.fabricationRequest.deleteMany({ where: { OR: [{ userId }, { reviewedById: userId }, { team: teamFilter }] } });
      await prisma.materialRequest.deleteMany({ where: { OR: [{ requestedById: userId }, { reviewedById: userId }, { team: teamFilter }] } });
      
      // Now safe to delete Teams
      await prisma.teamMember.deleteMany({ where: { OR: [{ userId }, { team: teamFilter }] } });
      await prisma.team.deleteMany({ where: teamFilter });

      // Now safe to delete Projects created by the user
      await prisma.project.deleteMany({ where: { createdById: userId } });

      // Handle other user-direct relations
      await prisma.$transaction([
        prisma.adminAuditLog.deleteMany({ where: { OR: [{ actorId: userId }, { targetId: userId }] } }),
        prisma.adminNote.deleteMany({ where: { OR: [{ targetUserId: userId }, { authorId: userId }] } }),
        prisma.announcementDismissal.deleteMany({ where: { userId } }),
        prisma.announcement.deleteMany({ where: { createdById: userId } }),
        prisma.workshopRSVP.deleteMany({ where: { userId } }),
        prisma.workshop.deleteMany({ where: { hostId: userId } }),
        prisma.projectProposal.deleteMany({ where: { OR: [{ proposedById: userId }, { reviewedById: userId }] } }),
        prisma.userAchievement.deleteMany({ where: { userId } }),
        prisma.userSkillProgress.deleteMany({ where: { userId } }),
        prisma.userTitle.deleteMany({ where: { userId } }),
        prisma.compliment.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } }),
        prisma.moodBoardNote.deleteMany({ where: { authorId: userId } }),
        prisma.featureRequestVote.deleteMany({ where: { userId } }),
        prisma.featureRequest.deleteMany({ where: { userId } }),
        prisma.labAccessLog.deleteMany({ where: { userId } }),
        prisma.alumniEvaluator.deleteMany({ where: { userId } }),
        prisma.notification.deleteMany({ where: { userId } }),
        prisma.clubSettings.updateMany({ where: { updatedById: userId }, data: { updatedById: null } }),
        prisma.account.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } })
      ]);

      console.log(`Deleted: ${login}`);
    } catch (error: any) {
      console.log(`Failed: ${login} — ${error.message}`);
    }
  }

  console.log("Wipe complete.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error during wipe:");
  console.error(e);
  process.exit(1);
});
  - Execution: Typically run via package.json or node.

─────────────────────────────────────────\n## 9. FEATURES — FULLY IMPLEMENTED\n\n─────────────────────────────────────────\n## 10. FEATURES — PARTIALLY IMPLEMENTED\n─────────────────────────────────────────\n## 11. FEATURES — SCHEMA ONLY\n- **User 
  id                     String                  @id @default(cuid())
  createdAt              DateTime                @default(now()) @map("created_at")
  updatedAt              DateTime                @updatedAt @map("updated_at")
  fortyTwoId             String?                 @unique @map("forty_two_id")
  login                  String                  @unique @default(cuid())
  email                  String?                 @unique
  emailVerified          DateTime?               @map("email_verified")
  name                   String                  @default("")
  image                  String?                 @map("image")
  role                   String                  @default("STUDENT")
  status                 Status                  @default(WAITLIST)
  currentRank            Rank                    @default(E) @map("current_rank")
  labAccessEnabled       Boolean                 @default(false) @map("lab_access_enabled")
  githubHandle           String?                 @map("github_handle")
  activeTheme            String                  @default("FORGE") @map("active_theme")
  unlockedThemes         String[]                @default(["FORGE", "FIELD"]) @map("unlocked_themes")
  hasFoundSecrets        Boolean                 @default(false) @map("has_found_secrets")
  equippedTitle          String?                 @map("equipped_title")
  joinedAt               DateTime                @default(now()) @map("joined_at")
  soundsEnabled          Boolean                 @default(true) @map("sounds_enabled")
  impersonatorId         String?                 @map("impersonator_id")
  birthday               DateTime?               @map("birthday")
  hasSeenIntro           Boolean                 @default(false) @map("has_seen_intro")
  hasSeenWaitlistModal   Boolean                 @default(false) @map("has_seen_waitlist_modal")
  lastSeenUpdateScreen   DateTime?               @map("last_seen_update_screen")
  visitedVoid            Boolean                 @default(false) @map("visited_void")
  visitedHall            Boolean                 @default(false) @map("visited_hall")
  visitedMirror          Boolean                 @default(false) @map("visited_mirror")
  discoveredCheats       String[]                @default([]) @map("discovered_cheats")
  receivedPlatformNotif  Boolean                 @default(false) @map("received_platform_notif")
  survivedSystemUpdate   Boolean                 @default(false) @map("survived_system_update")
  accounts               Account[]
  auditLogsActed         AdminAuditLog[]         @relation("AdminActor")
  auditLogsTargeted      AdminAuditLog[]         @relation("AdminTarget")
  adminNotesAuthored     AdminNote[]             @relation("NoteAuthor")
  adminNotesTargeted     AdminNote[]             @relation("NoteTarget")
  alumniEvaluatorOptIn   AlumniEvaluator?
  announcementDismissals AnnouncementDismissal[]
  announcementsCreated   Announcement[]          @relation("AnnouncementCreator")
  checkouts              Checkout[]
  settingsUpdates        ClubSettings[]          @relation("SettingsUpdater")
  complimentsSent        Compliment[]            @relation("ComplimentSender")
  complimentsReceived    Compliment[]            @relation("ComplimentReceiver")
  conflictFlagsRaised    ConflictFlag[]          @relation("ConflictRaiser")
  conflictFlagsReviewed  ConflictFlag[]          @relation("ConflictReviewer")
  damageReports          DamageReport[]          @relation("Reporter")
  damageResolved         DamageReport[]          @relation("DamageResolver")
  feedbackReceived       EvaluationFeedback[]    @relation("FeedbackReceiver")
  evaluationsGiven       Evaluation[]            @relation("Evaluator")
  fabricationReviewed    FabricationRequest[]    @relation("FabricationReviewer")
  fabricationRequests    FabricationRequest[]    @relation("Requestor")
  featureRequestVotes    FeatureRequestVote[]
  featureRequests        FeatureRequest[]        @relation("FeatureRequestCreator")
  labAccessLogs          LabAccessLog[]
  materialRequests       MaterialRequest[]       @relation("MaterialRequestor")
  materialReviewed       MaterialRequest[]       @relation("MaterialReviewer")
  moodBoardNotes         MoodBoardNote[]
  notifications          Notification[]
  projectProposals       ProjectProposal[]       @relation("ProposalCreator")
  proposalsReviewed      ProjectProposal[]       @relation("ProposalReviewer")
  projectsCreated        Project[]               @relation("ProjectCreator")
  teams                  TeamMember[]
  teamsLed               Team[]                  @relation("TeamLeader")
  achievements           UserAchievement[]
  skillProgress          UserSkillProgress[]
  userTitles             UserTitle[]
  dynamicRole            DynamicRole             @relation(fields: [role], references: [name])
  weeklyReports          WeeklyReport[]
  workshopRsvps          WorkshopRSVP[]
  workshopsHosted        Workshop[]              @relation("WorkshopHost")
  scratchpadsEdited      TeamScratchpad[]
  postMortems            ProjectPostMortem[]
  extensionRequestsReviewed ExtensionRequest[]
  disputesReviewed       EvaluationDispute[]
  claimedSlots         EvaluationSlot[]      @relation("ClaimedSlots")
  defenseRegistrations  DefenseRegistration[]
  defenseEvaluations    DefenseEvaluation[]
  defensesOpened        PublicDefense[] @relation("DefenseOpenedBy")
  defensesClosedBy      PublicDefense[] @relation("DefenseClosedBy")
  defensesReopened      PublicDefense[] @relation("DefenseReopenedBy")
  defenseSettingsUpdates DefenseCriteriaSettings[] @relation("DefenseSettingsUpdater")

  @@map("users")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **AdminNote 
  id           String   @id @default(cuid())
  targetUserId String   @map("target_user_id")
  authorId     String   @map("author_id")
  body         String
  createdAt    DateTime @default(now()) @map("created_at")
  author       User     @relation("NoteAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  targetUser   User     @relation("NoteTarget", fields: [targetUserId], references: [id], onDelete: Cascade)

  @@index([targetUserId])
  @@index([authorId])
  @@map("admin_notes")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Account 
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Project 
  id                 String            @id @default(cuid())
  createdAt          DateTime          @default(now()) @map("created_at")
  updatedAt          DateTime          @updatedAt @map("updated_at")
  title              String
  description        String
  objectives         String[]          @default([])
  deliverables       String[]          @default([])
  rank               Rank
  status             ProjectStatus     @default(DRAFT)
  teamSizeMin        Int               @map("team_size_min")
  teamSizeMax        Int               @map("team_size_max")
  blackholeDays      Int               @map("blackhole_days")
  skillTags          String[]          @map("skill_tags")
  isUnique           Boolean           @default(false) @map("is_unique")
  subjectSheetUrl    String?           @map("subject_sheet_url")
  evaluationSheetUrl String?           @map("evaluation_sheet_url")
  createdById        String            @map("created_by_id")
  hasBeenCompleted   Boolean           @default(false) @map("has_been_completed")
  isRequired         Boolean           @default(false) @map("is_required")
  evaluations        Evaluation[]
  proposalsConverted ProjectProposal[] @relation("ConvertedProject")
  createdBy          User              @relation("ProjectCreator", fields: [createdById], references: [id])
  teams              Team[]
  postMortems        ProjectPostMortem[]
  evalSheet          EvalSheet?
  publicDefenses     PublicDefense[]

  @@index([createdById])
  @@map("projects")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **RankRequirement 
  id               String   @id @default(cuid())
  rank             Rank
  projectsRequired Int      @default(4) @map("projects_required")
  updatedById      String?  @map("updated_by_id")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([rank])
  @@map("rank_requirements")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **UserSkillProgress 
  id                String @id @default(cuid())
  userId            String @map("user_id")
  skillTag          String @map("skill_tag")
  projectsCompleted Int    @default(0) @map("projects_completed")
  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, skillTag])
  @@index([userId])
  @@map("user_skill_progress")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Team 
  id                  String               @id @default(cuid())
  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")
  projectId           String               @map("project_id")
  leaderId            String               @map("leader_id")
  status              TeamStatus           @default(FORMING)
  activatedAt         DateTime?            @map("activated_at")
  blackholeDeadline   DateTime?            @map("blackhole_deadline")
  rank                Rank?
  checkouts           Checkout[]
  conflictFlags       ConflictFlag[]
  damageReports       DamageReport[]
  feedbackReceived    EvaluationFeedback[] @relation("FeedbackTeamReceiver")
  evaluationSlots     EvaluationSlot[]
  availabilityWindows AvailabilityWindow[]
  evaluations         Evaluation[]
  fabricationRequests FabricationRequest[]
  materialRequests    MaterialRequest[]
  members             TeamMember[]
  leader              User                 @relation("TeamLeader", fields: [leaderId], references: [id])
  project             Project              @relation(fields: [projectId], references: [id])
  weeklyReports       WeeklyReport[]
  name                String?
  repoUrl             String?              @map("repo_url")
  isExtensionGranted  Boolean              @default(false) @map("is_extension_granted")
  scratchpad          TeamScratchpad?
  extensionRequests   ExtensionRequest[]
  disputes            EvaluationDispute[]
  nextAttemptApproved Boolean              @default(false) @map("next_attempt_approved")
  postMortems         ProjectPostMortem[]
  publicDefense       PublicDefense?

  @@index([projectId])
  @@index([leaderId])
  @@map("teams")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **TeamMember 
  id       String   @id @default(cuid())
  teamId   String   @map("team_id")
  userId   String   @map("user_id")
  joinedAt         DateTime @default(now()) @map("joined_at")
  isLeader         Boolean  @default(false) @map("is_leader")
  abandonConfirmed Boolean  @default(false) @map("abandon_confirmed")
  team     Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@map("team_members")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **AvailabilityWindow 
  id        String           @id @default(cuid())
  teamId    String           @map("team_id")
  startTime DateTime         @map("start_time")
  endTime   DateTime         @map("end_time")
  isOpen    Boolean          @default(true) @map("is_open")
  createdAt DateTime         @default(now()) @map("created_at")
  team      Team             @relation(fields: [teamId], references: [id], onDelete: Cascade)
  slots     EvaluationSlot[]

  @@index([teamId])
  @@map("availability_windows")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvaluationSlot 
  id                   String     @id @default(cuid())
  createdAt            DateTime   @default(now()) @map("created_at")
  availabilityWindowId String     @map("availability_window_id")
  teamId               String     @map("team_id")
  slotStart            DateTime   @map("slot_start")
  slotEnd              DateTime   @map("slot_end")
  claimedById          String?    @map("claimed_by_id")
  claimedAt            DateTime?  @map("claimed_at")
  status               SlotStatus @default(OPEN)
  
  window      AvailabilityWindow @relation(fields: [availabilityWindowId], references: [id], onDelete: Cascade)
  team        Team               @relation(fields: [teamId], references: [id], onDelete: Cascade)
  evaluations Evaluation[]
  claimedBy   User?              @relation("ClaimedSlots", fields: [claimedById], references: [id])

  @@index([availabilityWindowId])
  @@index([teamId])
  @@index([claimedById])
  @@map("evaluation_slots")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Evaluation 
  id                       String               @id @default(cuid())
  createdAt                DateTime             @default(now()) @map("created_at")
  updatedAt                DateTime             @updatedAt @map("updated_at")
  slotId                   String               @map("slot_id")
  evaluatorId              String               @map("evaluator_id")
  teamId                   String               @map("team_id")
  projectId                String               @map("project_id")
  status                   EvaluationStatus     @default(PENDING)
  tier1Score               Float?               @map("tier1_score")
  tier2Score               Float?               @map("tier2_score")
  tier3Score               Float?               @map("tier3_score")
  overallResult            EvaluationResult?    @map("overall_result")
  isStaffEval              Boolean              @default(false) @map("is_staff_eval")
  notificationSentAt       DateTime?            @map("notification_sent_at")
  notificationDelaySeconds Int?                 @map("notification_delay_seconds")
  claimedAt                DateTime?            @map("claimed_at")
  completedAt              DateTime?            @map("completed_at")
  feedback                 EvaluationFeedback[]
  evaluator                User                 @relation("Evaluator", fields: [evaluatorId], references: [id])
  project                  Project              @relation(fields: [projectId], references: [id])
  slot                     EvaluationSlot       @relation(fields: [slotId], references: [id])
  team                     Team                 @relation(fields: [teamId], references: [id])
  sheetVersion             Int                  @default(1) @map("sheet_version")
  totalScore               Float?               @map("total_score")
  passed                   Boolean?
  writtenFeedback          String?              @db.Text @map("written_feedback")
  teamResponse             String?              @db.Text @map("team_response")
  submittedAt              DateTime?            @map("submitted_at")
  durationSeconds          Int?                 @map("duration_seconds")
  isMidnightEval           Boolean              @default(false) @map("is_midnight_eval")
  isAnomaly                Boolean              @default(false) @map("is_anomaly")
  anomalyNote              String?              @db.Text @map("anomaly_note")
  responses                EvalResponse[]

  @@index([slotId])
  @@index([evaluatorId])
  @@index([teamId])
  @@index([projectId])
  @@map("evaluations")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvaluationFeedback 
  id            String       @id @default(cuid())
  createdAt     DateTime     @default(now()) @map("created_at")
  evaluationId  String       @map("evaluation_id")
  fromRole      FeedbackRole @map("from_role")
  toEvaluatorId String?      @map("to_evaluator_id")
  toTeamId      String?      @map("to_team_id")
  rating        Int
  comment       String?
  isAnonymous   Boolean      @default(true) @map("is_anonymous")
  evaluation    Evaluation   @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  toEvaluator   User?        @relation("FeedbackReceiver", fields: [toEvaluatorId], references: [id])
  toTeam        Team?        @relation("FeedbackTeamReceiver", fields: [toTeamId], references: [id])

  @@index([evaluationId])
  @@index([toEvaluatorId])
  @@index([toTeamId])
  @@map("evaluation_feedbacks")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **WeeklyReport 
  id                String   @id @default(cuid())
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  teamId            String   @map("team_id")
  submittedById     String   @map("submitted_by_id")
  weekNumber        Int      @map("week_number")
  summary           String
  contributionNotes Json     @map("contribution_notes")
  photoUrls         String[] @map("photo_urls")
  readmeUpdated     Boolean  @default(false) @map("readme_updated")
  blockersNotes     String?  @map("blockers_notes")
  pdfUrl            String?  @map("pdf_url")
  isMilestone       Boolean  @default(false) @map("is_milestone")
  milestoneTitle    String?  @map("milestone_title")
  hoursLogged       Float?   @map("hours_logged")
  mood              String?
  nextWeekPlan      String?  @map("next_week_plan")
  submittedBy       User     @relation(fields: [submittedById], references: [id])
  team              Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, weekNumber])
  @@index([teamId])
  @@index([submittedById])
  @@map("weekly_reports")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Checkout 
  id               String         @id @default(cuid())
  createdAt        DateTime       @default(now()) @map("created_at")
  updatedAt        DateTime       @updatedAt @map("updated_at")
  userId           String         @map("user_id")
  teamId           String?        @map("team_id")
  itemName         String         @map("item_name")
  quantity         Int            @default(1)
  checkedOutAt     DateTime       @default(now()) @map("checked_out_at")
  expectedReturnAt DateTime       @map("expected_return_at")
  returnedAt       DateTime?      @map("returned_at")
  status           CheckoutStatus @default(OUT)
  team             Team?          @relation(fields: [teamId], references: [id])
  user             User           @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([teamId])
  @@map("checkouts")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **FabricationRequest 
  id                     String      @id @default(cuid())
  createdAt              DateTime    @default(now()) @map("created_at")
  updatedAt              DateTime    @updatedAt @map("updated_at")
  userId                 String      @map("user_id")
  teamId                 String?     @map("team_id")
  machineType            MachineType @map("machine_type")
  modelFileUrl           String      @map("model_file_url")
  estimatedMinutes       Int         @map("estimated_minutes")
  estimatedMaterialGrams Float       @map("estimated_material_grams")
  purpose                String
  status                 ReqStatus   @default(PENDING)
  scheduledAt            DateTime?   @map("scheduled_at")
  moderatorNote          String?     @map("moderator_note")
  reviewedById           String?     @map("reviewed_by_id")
  reviewedBy             User?       @relation("FabricationReviewer", fields: [reviewedById], references: [id])
  team                   Team?       @relation(fields: [teamId], references: [id])
  user                   User        @relation("Requestor", fields: [userId], references: [id])

  @@index([userId])
  @@index([teamId])
  @@index([reviewedById])
  @@map("fabrication_requests")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DamageReport 
  id                 String       @id @default(cuid())
  createdAt          DateTime     @default(now()) @map("created_at")
  updatedAt          DateTime     @updatedAt @map("updated_at")
  reportedById       String       @map("reported_by_id")
  teamId             String?      @map("team_id")
  itemName           String       @map("item_name")
  estimatedValue     Float        @map("estimated_value")
  description        String
  status             DamageStatus @default(REPORTED)
  requiresModeration Boolean      @default(false) @map("requires_moderation")
  moderatorNote      String?      @map("moderator_note")
  resolvedById       String?      @map("resolved_by_id")
  reportedBy         User         @relation("Reporter", fields: [reportedById], references: [id])
  resolvedBy         User?        @relation("DamageResolver", fields: [resolvedById], references: [id])
  team               Team?        @relation(fields: [teamId], references: [id])

  @@index([reportedById])
  @@index([teamId])
  @@index([resolvedById])
  @@map("damage_reports")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **MaterialRequest 
  id            String            @id @default(cuid())
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")
  teamId        String?           @map("team_id")
  requestedById String            @map("requested_by_id")
  category      MaterialCategory  @default(OTHER)
  itemName      String            @map("item_name")
  quantity      Int               @default(1)
  estimatedCost Float             @map("estimated_cost")
  justification String
  status        MaterialReqStatus @default(PENDING)
  moderatorNote String?           @map("moderator_note")
  reviewedById  String?           @map("reviewed_by_id")
  requestedBy   User              @relation("MaterialRequestor", fields: [requestedById], references: [id])
  reviewedBy    User?             @relation("MaterialReviewer", fields: [reviewedById], references: [id])
  team          Team?             @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@index([requestedById])
  @@index([reviewedById])
  @@map("material_requests")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **ProjectProposal 
  id                   String         @id @default(cuid())
  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")
  proposedById         String         @map("proposed_by_id")
  title                String
  description          String
  proposedRank         Rank           @map("proposed_rank")
  requiredMaterials    String         @map("required_materials")
  estimatedCost        Float          @map("estimated_cost")
  learningObjectives   String         @map("learning_objectives")
  buildPlan            String         @map("build_plan")
  differentiationNotes String?        @map("differentiation_notes")
  status               ProposalStatus @default(PENDING)
  moderatorNote        String?        @map("moderator_note")
  reviewedById         String?        @map("reviewed_by_id")
  convertedProjectId   String?        @map("converted_project_id")
  convertedProject     Project?       @relation("ConvertedProject", fields: [convertedProjectId], references: [id])
  proposedBy           User           @relation("ProposalCreator", fields: [proposedById], references: [id])
  reviewedBy           User?          @relation("ProposalReviewer", fields: [reviewedById], references: [id])

  @@index([proposedById])
  @@index([reviewedById])
  @@index([convertedProjectId])
  @@map("project_proposals")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Achievement 
  id              String            @id @default(cuid())
  key             String            @unique
  title           String
  description     String
  icon            String
  imageUrl        String?           @map("image_url")
  unlockedTitleId String?           @unique @map("unlocked_title_id")
  unlockedTitle   Title?            @relation("AchievementTitle", fields: [unlockedTitleId], references: [id])
  users           UserAchievement[]

  @@map("achievements")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Title 
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  achievement Achievement? @relation("AchievementTitle")
  users       UserTitle[]

  @@map("titles")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **UserTitle 
  id              String   @id @default(cuid())
  unlockedAt      DateTime @default(now()) @map("unlocked_at")
  userId          String   @map("user_id")
  titleId         String   @map("title_id")
  title           Title    @relation(fields: [titleId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, titleId])
  @@index([userId])
  @@index([titleId])
  @@map("user_titles")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **AdminAuditLog 
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  actorId   String   @map("actor_id")
  targetId  String?  @map("target_id")
  action    String
  details   String?
  actor     User     @relation("AdminActor", fields: [actorId], references: [id])
  target    User?    @relation("AdminTarget", fields: [targetId], references: [id])

  @@index([actorId])
  @@index([targetId])
  @@index([createdAt])
  @@map("admin_audit_logs")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **UserAchievement 
  id            String      @id @default(cuid())
  unlockedAt    DateTime    @default(now()) @map("unlocked_at")
  userId        String      @map("user_id")
  achievementId String      @map("achievement_id")
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
  @@index([achievementId])
  @@map("user_achievements")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Notification 
  id        String           @id @default(cuid())
  createdAt DateTime         @default(now()) @map("created_at")
  userId    String           @map("user_id")
  type      NotificationType
  title     String
  body      String
  isPush    Boolean          @default(false) @map("is_push")
  readAt    DateTime?        @map("read_at")
  actionUrl String?          @map("action_url")
  deliverAt DateTime         @default(now()) @map("deliver_at")
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("notifications")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **ConflictFlag 
  id            String         @id @default(cuid())
  createdAt     DateTime       @default(now()) @map("created_at")
  raisedById    String         @map("raised_by_id")
  teamId        String         @map("team_id")
  description   String
  status        ConflictStatus @default(OPEN)
  moderatorNote String?        @map("moderator_note")
  reviewedById  String?        @map("reviewed_by_id")
  raisedBy      User           @relation("ConflictRaiser", fields: [raisedById], references: [id])
  reviewedBy    User?          @relation("ConflictReviewer", fields: [reviewedById], references: [id])
  team          Team           @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([raisedById])
  @@index([teamId])
  @@index([reviewedById])
  @@map("conflict_flags")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Workshop 
  id           String         @id @default(cuid())
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  title        String
  description  String
  hostId       String         @map("host_id")
  scheduledAt  DateTime       @map("scheduled_at")
  location     String
  rsvpDeadline DateTime?      @map("rsvp_deadline")
  rsvps        WorkshopRSVP[]
  host         User           @relation("WorkshopHost", fields: [hostId], references: [id])

  @@index([hostId])
  @@map("workshops")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **WorkshopRSVP 
  id         String     @id @default(cuid())
  createdAt  DateTime   @default(now()) @map("created_at")
  workshopId String     @map("workshop_id")
  userId     String     @map("user_id")
  status     RsvpStatus @default(GOING)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  workshop   Workshop   @relation(fields: [workshopId], references: [id], onDelete: Cascade)

  @@unique([workshopId, userId])
  @@index([workshopId])
  @@index([userId])
  @@map("workshop_rsvps")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **LabAccessLog 
  id        String     @id @default(cuid())
  createdAt DateTime   @default(now()) @map("created_at")
  userId    String     @map("user_id")
  method    AuthMethod
  success   Boolean
  flagged   Boolean    @default(false)
  note      String?
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("lab_access_logs")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **AlumniEvaluator 
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  optedInAt DateTime @default(now()) @map("opted_in_at")
  isActive  Boolean  @default(true) @map("is_active")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("alumni_evaluators")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Compliment 
  id           String   @id @default(cuid())
  createdAt    DateTime @default(now()) @map("created_at")
  fromUserId   String   @map("from_user_id")
  toUserId     String   @map("to_user_id")
  evaluationId String?  @map("evaluation_id")
  message      String
  fromUser     User     @relation("ComplimentSender", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUser       User     @relation("ComplimentReceiver", fields: [toUserId], references: [id], onDelete: Cascade)

  @@unique([fromUserId, toUserId, evaluationId])
  @@index([fromUserId])
  @@index([toUserId])
  @@map("compliments")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **MoodBoardNote 
  id        String   @id @default(cuid())
  createdAt DateTime @default(now()) @map("created_at")
  authorId  String   @map("author_id")
  content   String
  color     String   @default("#FFD700")
  pinned    Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId])
  @@map("mood_board_notes")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **FeatureRequest 
  id          String                @id @default(cuid())
  createdAt   DateTime              @default(now()) @map("created_at")
  updatedAt   DateTime              @updatedAt @map("updated_at")
  userId      String                @map("user_id")
  category    FeatureRequestCategory @default(PLATFORM)
  title       String
  description String
  status      FeatureRequestStatus  @default(OPEN)
  votes       FeatureRequestVote[]
  user        User                  @relation("FeatureRequestCreator", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("feature_requests")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **FeatureRequestVote 
  id        String         @id @default(cuid())
  createdAt DateTime       @default(now()) @map("created_at")
  userId    String         @map("user_id")
  requestId String         @map("request_id")
  request   FeatureRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, requestId])
  @@index([userId])
  @@index([requestId])
  @@map("feature_request_votes")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DynamicRole 
  name        String   @id
  displayName String   @map("display_name")
  isSystem    Boolean  @default(false) @map("is_system")
  isAdmin     Boolean  @default(false) @map("is_admin")
  permissions String[] @default([])
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  users       User[]
  @@map("dynamic_roles")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **ClubSettings 
  id                   String   @id @default("singleton")
  clubName             String   @default("Robotics Club") @map("club_name")
  clubTagline          String   @default("42 Robotics Club Platform") @map("club_tagline")
  description          String   @default("A platform for the 42 Robotics Club members.")
  logoUrl              String?  @map("logo_url")
  maxActiveMembers     Int      @default(30) @map("max_active_members")
  labOpenTime          String   @default("09:00") @map("lab_open_time")
  labCloseTime         String   @default("21:00") @map("lab_close_time")
  defaultBlackholeDays Int      @default(60) @map("default_blackhole_days")
  minTeamSize          Int      @default(2) @map("min_team_size")
  maxTeamSize          Int      @default(5) @map("max_team_size")
  evalCooldownHours    Int      @default(24) @map("eval_cooldown_hours")
  antiSnipeMinutes     Int      @default(5) @map("anti_snipe_minutes")
  allowAlumniEvals     Boolean  @default(true) @map("allow_alumni_evals")
  maintenanceMode      Boolean  @default(false) @map("maintenance_mode")
  maintenanceMessage   String   @default("The platform is currently under maintenance. Please check back later.") @map("maintenance_message")
  goldenShimmerUntil   DateTime? @map("golden_shimmer_until")
  updatedAt            DateTime @updatedAt @map("updated_at")
  updatedById          String?  @map("updated_by_id")
  updatedBy            User?    @relation("SettingsUpdater", fields: [updatedById], references: [id])

  @@map("club_settings")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **Announcement 
  id          String                  @id @default(cuid())
  createdAt   DateTime                @default(now()) @map("created_at")
  title       String
  body        String
  expiresAt   DateTime                @map("expires_at")
  createdById String                  @map("created_by_id")
  dismissals  AnnouncementDismissal[]
  createdBy   User                    @relation("AnnouncementCreator", fields: [createdById], references: [id])

  @@index([expiresAt])
  @@index([createdById])
  @@map("announcements")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **AnnouncementDismissal 
  id             String       @id @default(cuid())
  announcementId String       @map("announcement_id")
  userId         String       @map("user_id")
  dismissedAt    DateTime     @default(now()) @map("dismissed_at")
  announcement   Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([announcementId, userId])
  @@index([announcementId])
  @@index([userId])
  @@map("announcement_dismissals")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **TeamScratchpad 
  teamId         String   @id @map("team_id")
  content        String   @default("")
  lastEditedById String?  @map("last_edited_by_id")
  updatedAt      DateTime @updatedAt @map("updated_at")
  team           Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  lastEditedBy   User?    @relation(fields: [lastEditedById], references: [id])

  @@map("team_scratchpads")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **ProjectPostMortem 
  id           String   @id @default(cuid())
  teamId       String   @map("team_id")
  userId       String   @map("user_id")
  projectId    String   @map("project_id")
  whatWorked   String   @map("what_worked")
  whatDidnt    String   @map("what_didnt")
  wouldDoBetter String   @map("would_do_better")
  createdAt    DateTime @default(now()) @map("created_at")
  team         Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@index([projectId])
  @@map("project_post_mortems")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **ExtensionRequest 
  id            String            @id @default(cuid())
  teamId        String            @map("team_id")
  reason        String
  status        MaterialReqStatus @default(PENDING) // Reusing MaterialReqStatus for simplicity if suitable, or create new
  moderatorNote String?           @map("moderator_note")
  reviewedById  String?           @map("reviewed_by_id")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")
  team          Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  reviewedBy    User?             @relation(fields: [reviewedById], references: [id])

  @@index([teamId])
  @@map("extension_requests")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvaluationDispute 
  id            String            @id @default(cuid())
  teamId        String            @map("team_id")
  reason        String
  evidence      String
  status        MaterialReqStatus @default(PENDING)
  moderatorNote String?           @map("moderator_note")
  reviewedById  String?           @map("reviewed_by_id")
  createdAt     DateTime          @default(now()) @map("created_at")
  team          Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  reviewedBy    User?             @relation(fields: [reviewedById], references: [id])

  @@index([teamId])
  @@map("evaluation_disputes")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvalSheet 
  id                String         @id @default(cuid())
  projectId         String         @unique @map("project_id")
  project           Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  version           Int            @default(1)
  passMark          Int            @default(60) @map("pass_mark")
  sections          EvalSection[]
  createdById       String         @map("created_by_id")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")

  @@map("eval_sheets")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvalSection 
  id              String         @id @default(cuid())
  sheetId         String         @map("sheet_id")
  sheet           EvalSheet      @relation(fields: [sheetId], references: [id], onDelete: Cascade)
  title           String
  order           Int
  weight          Int            // percentage of total score
  passMark        Int?           @map("pass_mark") // optional section minimum
  questions       EvalQuestion[]

  @@map("eval_sections")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvalQuestion 
  id                String         @id @default(cuid())
  sectionId         String         @map("section_id")
  section           EvalSection    @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  order             Int
  type              QuestionType
  label             String
  description       String?        @db.Text
  required          Boolean        @default(true)
  isHardRequirement Boolean        @default(false) @map("is_hard_requirement")
  weight            Int            @default(1)
  options           Json?          // for multiple choice / multi-select
  scaleMin          Int?           @map("scale_min") // for linear scale
  scaleMax          Int?           @map("scale_max")
  scaleMinLabel     String?        @map("scale_min_label")
  scaleMaxLabel     String?        @map("scale_max_label")
  passThreshold     Float?         @map("pass_threshold") // minimum value to pass for auto-fail
  responses         EvalResponse[]

  @@map("eval_questions")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **EvalResponse 
  id              String         @id @default(cuid())
  evaluationId    String         @map("evaluation_id")
  evaluation      Evaluation     @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  questionId      String         @map("question_id")
  question        EvalQuestion   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  value           Json           // flexible — stores any answer type
  createdAt       DateTime       @default(now()) @map("created_at")

  @@map("eval_responses")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **CalibrationSession 
  id              String                @id @default(cuid())
  createdAt       DateTime              @default(now()) @map("created_at")
  projectId       String                @map("project_id")
  sheetId         String                @map("sheet_id")
  title           String
  description     String                @db.Text
  dummySubmission Json                  @map("dummy_submission")
  isActive        Boolean               @default(true) @map("is_active")
  responses       CalibrationResponse[]

  @@map("calibration_sessions")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **CalibrationResponse 
  id           String             @id @default(cuid())
  sessionId    String             @map("session_id")
  evaluatorId  String             @map("evaluator_id")
  score        Float
  responses    Json
  feedback     String             @db.Text
  createdAt    DateTime           @default(now()) @map("created_at")
  session      CalibrationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("calibration_responses")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DefenseCriteria 
  id            String   @id @default(cuid())
  name          String
  description   String
  order         Int
  minChars      Int      @default(100)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  scores        DefenseCriteriaScore[]

  @@map("defense_criteria")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DefenseCriteriaSettings 
  id              String  @id @default("singleton")
  ratingScale     Int     @default(5) @map("rating_scale")
  overallMinChars Int     @default(150) @map("overall_min_chars")
  passThreshold   Int     @default(60) @map("pass_threshold")
  maxCriteria     Int     @default(15) @map("max_criteria")
  minCriteria     Int     @default(5) @map("min_criteria")
  updatedAt       DateTime @updatedAt @map("updated_at")
  updatedById    String? @map("updated_by_id")
  updatedBy      User?   @relation("DefenseSettingsUpdater", fields: [updatedById], references: [id])

  @@map("defense_criteria_settings")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **PublicDefense 
  id                    String        @id @default(cuid())
  teamId                String        @unique @map("team_id")
  team                  Team          @relation(fields: [teamId], references: [id], onDelete: Cascade)
  projectId             String        @map("project_id")
  project               Project       @relation(fields: [projectId], references: [id])
  scheduledAt           DateTime      @map("scheduled_at")
  status                DefenseStatus @default(SCHEDULED)
  
  evaluationOpen        Boolean       @default(false) @map("evaluation_open")
  evaluationOpenedAt    DateTime?     @map("evaluation_opened_at")
  evaluationOpenedById  String?       @map("evaluation_opened_by_id")
  evaluationOpenedBy    User?         @relation("DefenseOpenedBy", fields: [evaluationOpenedById], references: [id])
  
  evaluationClosed      Boolean       @default(false) @map("evaluation_closed")
  evaluationClosedAt    DateTime?     @map("evaluation_closed_at")
  evaluationClosedById  String?       @map("evaluation_closed_by_id")
  evaluationClosedBy    User?         @relation("DefenseClosedBy", fields: [evaluationClosedById], references: [id])
  
  reopened              Boolean       @default(false)
  reopenedAt            DateTime?     @map("reopened_at")
  reopenedById          String?       @map("reopened_by_id")
  reopenedBy            User?         @relation("DefenseReopenedBy", fields: [reopenedById], references: [id])
  reopenNote            String?       @map("reopen_note")
  
  expertJuryOnly        Boolean       @default(false) @map("expert_jury_only")
  expertJuryOnlySetById String?       @map("expert_jury_only_set_by_id")
  expertJuryOnlySetAt   DateTime?     @map("expert_jury_only_set_at")
  
  lowerRankDispelled    Boolean       @default(false) @map("lower_rank_dispelled")
  lowerRankDispelledById String?      @map("lower_rank_dispelled_by_id")
  lowerRankDispelledAt  DateTime?     @map("lower_rank_dispelled_at")
  lowerRankDispelledNote String?      @map("lower_rank_dispelled_note")
  
  minimumMet            Boolean       @default(false) @map("minimum_met")
  provisionalReason     String?       @map("provisional_reason")
  
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")
  
  registrations         DefenseRegistration[]
  evaluations           DefenseEvaluation[]
  result                DefenseResult?

  @@map("public_defenses")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DefenseRegistration 
  id           String        @id @default(cuid())
  defenseId    String        @map("defense_id")
  defense      PublicDefense @relation(fields: [defenseId], references: [id], onDelete: Cascade)
  userId       String        @map("user_id")
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  userRank     String        @map("user_rank")
  isAdmin      Boolean       @default(false) @map("is_admin")
  registeredAt DateTime      @default(now()) @map("registered_at")
  
  @@unique([defenseId, userId])
  @@map("defense_registrations")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DefenseEvaluation 
  id              String        @id @default(cuid())
  defenseId       String        @map("defense_id")
  defense         PublicDefense @relation(fields: [defenseId], references: [id], onDelete: Cascade)
  evaluatorId     String        @map("evaluator_id")
  evaluator       User          @relation(fields: [evaluatorId], references: [id], onDelete: Cascade)
  evaluatorRank   String        @map("evaluator_rank")
  evaluatorWeight Float         @map("evaluator_weight")
  isAdmin         Boolean       @default(false) @map("is_admin")
  
  criteriaScores  DefenseCriteriaScore[]
  overallReview   String        @db.Text @map("overall_review")
  totalScore      Float?        @map("total_score")
  
  submittedAt     DateTime      @default(now()) @map("submitted_at")
  
  @@unique([defenseId, evaluatorId])
  @@map("defense_evaluations")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DefenseCriteriaScore 
  id           String            @id @default(cuid())
  evaluationId String            @map("evaluation_id")
  evaluation   DefenseEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  criteriaId   String            @map("criteria_id")
  criteria     DefenseCriteria   @relation(fields: [criteriaId], references: [id])
  score        Int
  note         String            @db.Text
  
  @@unique([evaluationId, criteriaId])
  @@map("defense_criteria_scores")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.
- **DefenseResult 
  id                   String        @id @default(cuid())
  defenseId            String        @unique @map("defense_id")
  defense              PublicDefense @relation(fields: [defenseId], references: [id], onDelete: Cascade)
  
  adminAverage         Float?        @map("admin_average")
  adminPassed          Boolean?      @map("admin_passed")
  adminCount           Int           @default(0) @map("admin_count")
  
  expertAverage        Float?        @map("expert_average")
  expertPassed         Boolean?      @map("expert_passed")
  expertCount          Int           @default(0) @map("expert_count")
  
  galleryWeighted      Float?        @map("gallery_weighted")
  galleryCount         Int           @default(0) @map("gallery_count")
  galleryExcluded      Boolean       @default(false) @map("gallery_excluded")
  
  finalScore           Float         @map("final_score")
  passed               Boolean
  provisional          Boolean       @default(false)
  provisionalReason    String?       @map("provisional_reason")
  
  presidentConfirmed   Boolean       @default(false) @map("president_confirmed")
  presidentConfirmedById String?      @map("president_confirmed_by_id")
  presidentConfirmedAt DateTime?     @map("president_confirmed_at")
  
  calculatedAt         DateTime      @default(now()) @map("calculated_at")

  @@map("defense_results")
}**: Exists in Prisma schema but lacks dedicated API routes/UI pages.

─────────────────────────────────────────\n## 12. BROKEN OR SUSPICIOUS\n### Dangerous 'any' casts (Sample):
```
/Users/syedahamed/Documents/42_Robotics/robotics-club/src/components/evaluations/PublicDefenseSection.tsx:30:function UpcomingDefenseCard({ d, myRegistrations, myTeamId, handleCancel, handleRegister, actionLoading }: any) {
/Users/syedahamed/Documents/42_Robotics/robotics-club/src/components/providers/Providers.tsx:14:export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
/Users/syedahamed/Documents/42_Robotics/robotics-club/src/components/admin/MemberControl.tsx:68:	onAction: (action: string, payload?: any) => void;
/Users/syedahamed/Documents/42_Robotics/robotics-club/src/components/admin/MemberControl.tsx:206:	const handleAction = (member: ActiveMember, action: string, payload?: any) => {
```

─────────────────────────────────────────\n## 13. ENVIRONMENT & CONFIG\n### Environment Variables Referenced in Codebase:
- `process.env.CLOUDINARY_API_KEY
process.env.CLOUDINARY_API_SECRET
process.env.FORTYTWO_CLIENT_ID
process.env.FORTYTWO_CLIENT_SECRET
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
process.env.NODE_ENV`

─────────────────────────────────────────\n## 14. ANYTHING ELSE\n- **Strict Role-Based Middleware Checks:** Found in `middleware.ts`. Uses JWT-based cached permissions to prevent database spam.\n- **Impersonation System:** `admin-auth.ts` reveals a sophisticated impersonation framework allowing admins to act as other users.\n- **Konami Cheat Code Theming:** Found references to cheat codes and secret themes.\n- **Server Components Architecture:** Heavy usage of Next.js 14 App Router server components ensuring strong SEO and minimal JS bundles, paired accurately with Client Components for interactions.\n- **Prisma Soft Delete Pattern:** Some models use flags like `status` rather than destructive deletes, ensuring audit safety.\n