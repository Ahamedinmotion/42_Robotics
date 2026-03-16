import { PrismaClient, Status, Rank, ProjectStatus, TeamStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Start seeding...');

	// --- 0. Dynamic Roles ---
	const rolesToSeed = [
		{
			name: "STUDENT", displayName: "Student", isSystem: true, isAdmin: false,
			permissions: [] as string[],
		},
		{
			name: "SECRETARY", displayName: "Secretary", isSystem: true, isAdmin: true,
			permissions: ["CAN_MANAGE_MEMBERS", "CAN_MANAGE_WAITLIST", "CAN_MANAGE_LAB_ACCESS", "CAN_MANAGE_DAMAGE", "CAN_RESOLVE_CONFLICTS"],
		},
		{
			name: "PROJECT_MANAGER", displayName: "Project Manager", isSystem: true, isAdmin: true,
			permissions: ["CAN_MANAGE_PROJECTS", "CAN_APPROVE_PROPOSALS", "CAN_APPROVE_FABRICATION", "CAN_APPROVE_MATERIALS", "CAN_EDIT_CONTENT"],
		},
		{
			name: "SOCIAL_MEDIA_MANAGER", displayName: "Social Media Manager", isSystem: true, isAdmin: true,
			permissions: ["CAN_SEND_ANNOUNCEMENTS", "CAN_MANAGE_ANNOUNCEMENTS", "CAN_EDIT_CONTENT"],
		},
		{
			name: "VP", displayName: "Vice President", isSystem: true, isAdmin: true,
			permissions: [
				"CAN_SEND_ANNOUNCEMENTS", "CAN_MANAGE_MEMBERS", "CAN_MANAGE_WAITLIST",
				"CAN_EXTEND_DEADLINES", "CAN_APPROVE_FABRICATION", "CAN_APPROVE_MATERIALS",
				"CAN_APPROVE_PROPOSALS", "CAN_RESOLVE_CONFLICTS", "CAN_MANAGE_DAMAGE",
				"CAN_MANAGE_PROJECTS", "CAN_MANAGE_LAB_ACCESS", "CAN_VIEW_ANALYTICS",
				"CAN_EDIT_CONTENT", "CAN_MANAGE_ANNOUNCEMENTS",
			],
		},
		{
			name: "PRESIDENT", displayName: "President", isSystem: true, isAdmin: true,
			permissions: [
				"CAN_SEND_ANNOUNCEMENTS", "CAN_MANAGE_MEMBERS", "CAN_MANAGE_WAITLIST",
				"CAN_EXTEND_DEADLINES", "CAN_APPROVE_FABRICATION", "CAN_APPROVE_MATERIALS",
				"CAN_APPROVE_PROPOSALS", "CAN_RESOLVE_CONFLICTS", "CAN_MANAGE_DAMAGE",
				"CAN_MANAGE_PROJECTS", "CAN_MANAGE_LAB_ACCESS", "CAN_VIEW_ANALYTICS",
				"CAN_EDIT_CONTENT", "CAN_MANAGE_ROLES", "CAN_MANAGE_CLUB_SETTINGS",
				"CAN_MANAGE_ANNOUNCEMENTS",
			],
		},
	];

	for (const r of rolesToSeed) {
		await (prisma as any).dynamicRole.upsert({
			where: { name: r.name },
			update: {},
			create: r,
		});
	}
	console.log(`Seeded ${rolesToSeed.length} dynamic roles.`);

	// --- 1. Users ---
	const usersToCreate = [
		{ login: "president_user", name: "Alex Carter", role: "PRESIDENT", status: Status.ACTIVE, currentRank: Rank.S, labAccessEnabled: true },
		{ login: "vp_user", name: "Jordan Mills", role: "VP", status: Status.ACTIVE, currentRank: Rank.A, labAccessEnabled: true },
		{ login: "projmanager_user", name: "Sam Rivera", role: "PROJECT_MANAGER", status: Status.ACTIVE, currentRank: Rank.B, labAccessEnabled: true },
		{ login: "secretary_user", name: "Casey Nguyen", role: "SECRETARY", status: Status.ACTIVE, currentRank: Rank.C, labAccessEnabled: false },
		{ login: "social_user", name: "Morgan Blake", role: "SOCIAL_MEDIA_MANAGER", status: Status.ACTIVE, currentRank: Rank.E, labAccessEnabled: false },
		{ login: "student_a", name: "Riley Chen", role: "STUDENT", status: Status.ACTIVE, currentRank: Rank.B, labAccessEnabled: true },
		{ login: "student_b", name: "Taylor Osman", role: "STUDENT", status: Status.ACTIVE, currentRank: Rank.C, labAccessEnabled: true },
		{ login: "student_c", name: "Avery Singh", role: "STUDENT", status: Status.ACTIVE, currentRank: Rank.C, labAccessEnabled: false },
		{ login: "student_d", name: "Quinn Park", role: "STUDENT", status: Status.ACTIVE, currentRank: Rank.D, labAccessEnabled: false },
		{ login: "student_e", name: "Sage Kowalski", role: "STUDENT", status: Status.ACTIVE, currentRank: Rank.E, labAccessEnabled: false },
		{ login: "waitlist_user", name: "Drew Hoffman", role: "STUDENT", status: Status.WAITLIST, currentRank: Rank.E, labAccessEnabled: false },
		{ login: "blackholed_user", name: "Finley Cross", role: "STUDENT", status: Status.BLACKHOLED, currentRank: Rank.D, labAccessEnabled: false },
	];

	const createdUsers: Record<string, any> = {};
	for (const u of usersToCreate) {
		const user = await prisma.user.upsert({
			where: { login: u.login },
			update: {},
			create: {
				fortyTwoId: `42_${u.login}`,
				login: u.login,
				name: u.name,
				image: null,
				role: u.role,
				status: u.status,
				currentRank: u.currentRank,
				labAccessEnabled: u.labAccessEnabled,
				githubHandle: `${u.login}_gh`,
				activeTheme: "FORGE",
				joinedAt: new Date(),
			},
		});
		createdUsers[u.login] = user;
	}

	// --- 2. Achievements ---
	const achievementsToCreate = [
		{ key: "FIRST_EVAL_GIVEN", title: "First Impression", description: "Completed your first evaluation as an evaluator", icon: "star", imageUrl: "/achievements/brain.png" },
		{ key: "FIRST_PROJECT_COMPLETED", title: "Off the Ground", description: "Completed your first project", icon: "rocket", imageUrl: "/achievements/rocket.png" },
		{ key: "PERFECT_REPORT_STREAK", title: "Clockwork", description: "Submitted weekly reports on time for an entire project", icon: "clock", imageUrl: "/achievements/clock.png" },
		{ key: "DIVERSE_SKILLS", title: "Polymath", description: "Completed projects across 4 or more skill categories", icon: "brain", imageUrl: "/achievements/brain.png" },
		{ key: "TEAM_LEADER", title: "Point Person", description: "Served as team leader on a completed project", icon: "flag", imageUrl: "/achievements/rocket.png" },
		{ key: "PROJECT_PROPOSAL_ACCEPTED", title: "Curriculum Maker", description: "Had a project proposal accepted into the curriculum", icon: "lightbulb", imageUrl: "/achievements/brain.png" },
		{ key: "EVALUATOR_STREAK", title: "Sharp Eye", description: "Completed 5 evaluations with no quality flags", icon: "eye", imageUrl: "/achievements/brain.png" },
		{ key: "ALUMNI", title: "S Rank", description: "Completed the full Robotics Club cursus", icon: "crown", imageUrl: "/achievements/rocket.png" },
		{ key: "PATIENCE", title: "Patience", description: "...", icon: "clock", imageUrl: "/achievements/clock.png" },
		{ key: "FOUND_NOTHING", title: "Found Nothing", description: "...", icon: "help-circle", imageUrl: "/achievements/brain.png" },
		{ key: "UNREACHABLE", title: "Unreachable", description: "...", icon: "bell-off", imageUrl: "/achievements/brain.png" },
		{ key: "STARED_INTO_VOID", title: "Stared Into The Void", description: "...", icon: "eye-off", imageUrl: "/achievements/brain.png" },
		{ key: "PATIENT_ZERO", title: "Patient Zero", description: "...", icon: "bug", imageUrl: "/achievements/brain.png" },
		{ key: "YOU_WERE_EXPECTED", title: "You Were Expected", description: "...", icon: "ghost", imageUrl: "/achievements/brain.png" },
		{ key: "INTERIOR_DECORATOR", title: "Interior Decorator", description: "...", icon: "palette", imageUrl: "/achievements/brain.png" },
		{ key: "YOU_WERE_NEVER_SUPPOSED_TO_FIND_THIS", title: "You Were Never Supposed To Find This", description: "...", icon: "lock", imageUrl: "/achievements/brain.png" },
		{ key: "RELENTLESS", title: "Relentless", description: "...", icon: "flame", imageUrl: "/achievements/brain.png" },
	];

	for (const a of achievementsToCreate) {
		await prisma.achievement.upsert({
			where: { key: a.key },
			update: {
				title: a.title,
				description: a.description,
				icon: a.icon,
				imageUrl: a.imageUrl
			},
			create: a,
		});
	}

	// --- 3. Projects ---
	const projectsToCreate = [
		{
			title: "Line Following Robot", rank: Rank.E, status: ProjectStatus.ACTIVE, teamSizeMin: 2, teamSizeMax: 2, blackholeDays: 21,
			skillTags: ["embedded_systems", "firmware", "mechanical_design"], isUnique: false,
			description: "Build a robot that autonomously follows a line using IR sensors and a microcontroller. Introduction to sensors, motor control, and basic firmware.",
			createdById: createdUsers["president_user"].id,
		},
		{
			title: "Obstacle Avoidance Robot", rank: Rank.E, status: ProjectStatus.ACTIVE, teamSizeMin: 2, teamSizeMax: 2, blackholeDays: 21,
			skillTags: ["embedded_systems", "firmware", "sensors"], isUnique: false,
			description: "Build a robot that detects and avoids obstacles using ultrasonic sensors. Covers sensor integration, decision logic, and motor control.",
			createdById: createdUsers["president_user"].id,
		},
		{
			title: "Wireless Sensor Network", rank: Rank.D, status: ProjectStatus.ACTIVE, teamSizeMin: 2, teamSizeMax: 2, blackholeDays: 28,
			skillTags: ["embedded_systems", "networking", "firmware"], isUnique: false,
			description: "Design and build a network of wireless sensor nodes that communicate data to a central hub. Covers RF communication, data serialisation, and power management.",
			createdById: createdUsers["president_user"].id,
		},
		{
			title: "Robotic Arm — CAD & Print", rank: Rank.C, status: ProjectStatus.ACTIVE, teamSizeMin: 2, teamSizeMax: 3, blackholeDays: 35,
			skillTags: ["cad", "mechanical_design", "3d_printing", "embedded_systems"], isUnique: false,
			description: "Design and 3D print a multi-joint robotic arm controlled by servo motors. Mandatory C rank fabrication project. Covers CAD fundamentals, slicing, print tolerances, and servo control.",
			createdById: createdUsers["president_user"].id,
		},
		{
			title: "Autonomous Drone Navigation", rank: Rank.B, status: ProjectStatus.ACTIVE, teamSizeMin: 3, teamSizeMax: 3, blackholeDays: 42,
			skillTags: ["firmware", "control_theory", "sensors", "mechanical_design"], isUnique: true,
			description: "Build and program a drone capable of autonomous waypoint navigation. Covers flight controllers, PID tuning, GPS integration, and safety protocols.",
			createdById: createdUsers["president_user"].id,
		},
		{
			title: "Computer Vision Sorting System", rank: Rank.A, status: ProjectStatus.ACTIVE, teamSizeMin: 3, teamSizeMax: 5, blackholeDays: 56,
			skillTags: ["computer_vision", "embedded_systems", "mechanical_design", "firmware"], isUnique: true,
			description: "Build a conveyor-based system that uses a camera and computer vision to identify and sort objects by colour and shape. Covers OpenCV, model inference, actuator control, and system integration.",
			createdById: createdUsers["president_user"].id,
		},
		{
			title: "Humanoid Locomotion Engine", rank: Rank.S, status: ProjectStatus.ACTIVE, teamSizeMin: 3, teamSizeMax: 3, blackholeDays: 90,
			skillTags: ["control_theory", "firmware", "mechanical_design", "ai"], isUnique: true,
			description: "The final mission. Develop a bipedal walking algorithm for the club's flagship humanoid platform.",
			createdById: createdUsers["president_user"].id,
		},
	];

	const createdProjects: Record<string, any> = {};
	for (const p of projectsToCreate) {
		const project = await prisma.project.upsert({
			where: { id: `seed-proj-${p.title.replace(/\s+/g, '-').toLowerCase()}` },
			update: {},
			create: {
				id: `seed-proj-${p.title.replace(/\s+/g, '-').toLowerCase()}`,
				...p,
			},
		});
		createdProjects[p.title] = project;
	}

	// --- 4. Teams ---
	const lineFollowingProj = createdProjects["Line Following Robot"];
	const roboticArmProj = createdProjects["Robotic Arm — CAD & Print"];

	const team1 = await prisma.team.upsert({
		where: { id: "seed-team-1" },
		update: {},
		create: {
			id: "seed-team-1",
			projectId: lineFollowingProj.id,
			leaderId: createdUsers["student_e"].id,
			status: TeamStatus.ACTIVE,
			activatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
			blackholeDeadline: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
			rank: Rank.E,
			members: {
				create: [
					{ userId: createdUsers["student_e"].id, isLeader: true },
					{ userId: createdUsers["student_d"].id, isLeader: false },
				]
			}
		}
	});

	const team2 = await prisma.team.upsert({
		where: { id: "seed-team-2" },
		update: {},
		create: {
			id: "seed-team-2",
			projectId: roboticArmProj.id,
			leaderId: createdUsers["student_b"].id,
			status: TeamStatus.EVALUATING,
			activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
			blackholeDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
			rank: Rank.C,
			members: {
				create: [
					{ userId: createdUsers["student_b"].id, isLeader: true },
					{ userId: createdUsers["student_c"].id, isLeader: false },
					{ userId: createdUsers["student_a"].id, isLeader: false },
				]
			}
		}
	});

	const team3 = await prisma.team.upsert({
		where: { id: "seed-team-3" },
		update: {},
		create: {
			id: "seed-team-3",
			projectId: createdProjects["Humanoid Locomotion Engine"].id,
			leaderId: createdUsers["president_user"].id,
			status: TeamStatus.COMPLETED,
			activatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
			rank: Rank.S,
			members: {
				create: [
					{ userId: createdUsers["president_user"].id, isLeader: true },
				]
			}
		}
	});

	// --- 5. Weekly Reports ---
	await prisma.weeklyReport.upsert({
		where: { teamId_weekNumber: { teamId: team1.id, weekNumber: 1 } },
		update: {},
		create: {
			teamId: team1.id,
			submittedById: createdUsers["student_e"].id,
			weekNumber: 1,
			summary: "Set up development environment, flashed firmware onto microcontroller, tested basic motor control routines.",
			contributionNotes: {
				"student_e": "Firmware setup and motor driver wiring",
				"student_d": "IR sensor testing and calibration"
			},
			readmeUpdated: true,
		}
	});

	await prisma.weeklyReport.upsert({
		where: { teamId_weekNumber: { teamId: team1.id, weekNumber: 2 } },
		update: {},
		create: {
			teamId: team1.id,
			submittedById: createdUsers["student_e"].id,
			weekNumber: 2,
			summary: "Integrated IR sensor readings with motor control. Robot successfully follows straight line. Curve handling in progress.",
			contributionNotes: {
				"student_e": "Sensor-motor integration logic",
				"student_d": "Track design and physical testing"
			},
			readmeUpdated: true,
		}
	});

	// --- 6. User Achievements ---
	const assignAchievements = async (login: string, keys: string[]) => {
		const user = createdUsers[login];
		for (const key of keys) {
			const achievement = await prisma.achievement.findUnique({ where: { key } });
			if (achievement) {
				await prisma.userAchievement.upsert({
					where: { userId_achievementId: { userId: user.id, achievementId: achievement.id } },
					update: {},
					create: { userId: user.id, achievementId: achievement.id },
				});
			}
		}
	};

	await assignAchievements("president_user", ["ALUMNI", "FIRST_PROJECT_COMPLETED", "TEAM_LEADER", "DIVERSE_SKILLS", "FIRST_EVAL_GIVEN", "EVALUATOR_STREAK"]);
	await assignAchievements("student_a", ["FIRST_PROJECT_COMPLETED", "TEAM_LEADER", "FIRST_EVAL_GIVEN"]);
	await assignAchievements("student_b", ["FIRST_PROJECT_COMPLETED", "TEAM_LEADER"]);

	// --- 7. User Skill Progress ---
	const assignSkills = async (login: string, skills: Record<string, number>) => {
		const user = createdUsers[login];
		for (const [skillTag, projectsCompleted] of Object.entries(skills)) {
			await prisma.userSkillProgress.upsert({
				where: { userId_skillTag: { userId: user.id, skillTag } },
				update: {},
				create: { userId: user.id, skillTag, projectsCompleted: projectsCompleted as number },
			});
		}
	};

	await assignSkills("president_user", {
		"embedded_systems": 6, "firmware": 5, "mechanical_design": 4, "cad": 3,
		"computer_vision": 2, "control_theory": 2, "sensors": 3, "networking": 1
	});
	await assignSkills("student_a", { "embedded_systems": 3, "firmware": 2, "mechanical_design": 2, "sensors": 2 });
	await assignSkills("student_b", { "embedded_systems": 2, "cad": 2, "mechanical_design": 3, "3d_printing": 1 });

	// --- 8. Workshops ---
	const workshop = await prisma.workshop.upsert({
		where: { id: "seed-workshop-ros2" },
		update: {},
		create: {
			id: "seed-workshop-ros2",
			title: "Intro to ROS2 — Robot Operating System",
			description: "A hands-on introduction to ROS2. We will cover nodes, topics, services, and build a simple publisher-subscriber system. No prior ROS experience required.",
			hostId: createdUsers["projmanager_user"].id,
			scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
			location: "Robotics Lab — Room 204",
			rsvpDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
		}
	});

	const rsvpStudents = ["student_a", "student_b", "student_e"];
	for (const login of rsvpStudents) {
		await prisma.workshopRSVP.upsert({
			where: { workshopId_userId: { workshopId: workshop.id, userId: createdUsers[login].id } },
			update: {},
			create: { workshopId: workshop.id, userId: createdUsers[login].id, status: "GOING" }
		});
	}

	// --- 9. Alumni Evaluator ---
	await prisma.alumniEvaluator.upsert({
		where: { userId: createdUsers["president_user"].id },
		update: {},
		create: { userId: createdUsers["president_user"].id, isActive: true }
	});

	// --- 10. Club Settings (singleton) ---
	await prisma.clubSettings.upsert({
		where: { id: "singleton" },
		update: {},
		create: { id: "singleton" },
	});

	// --- Summary ---
	const userCount = await prisma.user.count();
	const projectCount = await prisma.project.count();
	const teamCount = await prisma.team.count();
	const achievementCount = await prisma.achievement.count();

	console.log(`Seeding finished.`);
	console.log(`Seeded: ${userCount} users, ${projectCount} projects, ${teamCount} teams, ${achievementCount} achievements`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
