import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProjectFullDetail } from "@/lib/queries/projects";
import { getUserProfile, getUserActiveTeam } from "@/lib/queries/users";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProjectHero } from "@/components/cursus/project/ProjectHero";
import { ProjectBrief } from "@/components/cursus/project/ProjectBrief";
import { ProjectHistoryWall } from "@/components/cursus/project/ProjectHistoryWall";
import { ProjectCurrentActivity } from "@/components/cursus/project/ProjectCurrentActivity";
import { ProjectCommunityKnowledge } from "@/components/cursus/project/ProjectCommunityKnowledge";
import { PhotoTimeline } from "@/components/cursus/cockpit/PhotoTimeline";

const RANK_ORDER = ["E", "D", "C", "B", "A", "S"];

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const [projectData, user, activeTeam] = await Promise.all([
		getProjectFullDetail(params.id),
		getUserProfile(session.user.id),
		getUserActiveTeam(session.user.id),
	]);
	if (!projectData) notFound();

	const project = projectData as any;

	// Stats Calculation
	const allTeams = project.teams || [];
	const completedTeams = allTeams.filter((t: any) => t.status === "COMPLETED");
	const activeTeamsCount = allTeams.filter((t: any) => ["FORMING", "ACTIVE", "EVALUATING"].includes(t.status)).length;
	
	const completionRate = allTeams.length > 0 
		? Math.round((completedTeams.length / allTeams.length) * 100) 
		: 0;

	const completionTimes = completedTeams
		.filter((t: any) => t.activatedAt && t.updatedAt)
		.map((t: any) => (new Date(t.updatedAt).getTime() - new Date(t.activatedAt).getTime()) / (1000 * 60 * 60 * 24));
	
	const avgTime = completionTimes.length > 0
		? Math.round(completionTimes.reduce((a: number, b: number) => a + b, 0) / completionTimes.length)
		: null;

	// Eligibility Logic
	const userRankIndex = RANK_ORDER.indexOf(user?.currentRank || "E");
	const projectRankIndex = RANK_ORDER.indexOf(project.rank as string);
	
	const hasCompleted = allTeams.some((t: any) => 
		t.status === "COMPLETED" && 
		t.members.some((m: any) => m.userId === session.user.id)
	);

	const isCurrentlyActive = (activeTeam as any)?.team?.projectId === project.id;
	
	let eligibilityError = null;
	if (hasCompleted) {
		eligibilityError = "You have already completed this project.";
	} else if (userRankIndex < projectRankIndex) {
		eligibilityError = `You need Rank ${project.rank} to start this project. (Current: ${user?.currentRank})`;
	} else if (activeTeam && (activeTeam as any).team?.projectId !== project.id) {
		eligibilityError = "You already have an active project. Complete it first!";
	}

	const isEligible = !eligibilityError;

	// Collect all mission photos for global timeline
	const globalReports = allTeams.flatMap((t: any) => t.weeklyReports || []);

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Navigation */}
			<div className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
				<Link 
					href="/cursus"
					className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-accent"
				>
					<span className="transition-transform group-hover:-translate-x-1">←</span>
					Back to Cursus
				</Link>
			</div>

			<div className="mx-auto max-w-7xl space-y-12 px-4 py-8 md:px-8">
				{/* 1. HERO HEADER */}
				<ProjectHero 
					project={project} 
					isEligible={isEligible} 
					eligibilityError={eligibilityError}
					isCurrentlyActive={isCurrentlyActive}
					stats={{
						completionRate,
						avgTime,
						activeTeamsCount
					}}
				/>

				<div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
					{/* Left Column (2/3) */}
					<div className="space-y-12 lg:col-span-2">
						{/* 2. THE BRIEF */}
						<ProjectBrief project={project} />

						{/* 3. HISTORY WALL */}
						<ProjectHistoryWall project={project} />

						{/* 3.5 MISSION ARCHIVES (Photos) */}
						{globalReports.length > 0 && (
							<div className="pt-12 border-t border-white/5">
								<PhotoTimeline reports={globalReports} />
							</div>
						)}
					</div>

					{/* Right Column (1/3) */}
					<div className="space-y-12">
						{/* 4. CURRENT ACTIVITY */}
						<ProjectCurrentActivity project={project} />

						{/* 5. COMMUNITY KNOWLEDGE */}
						<ProjectCommunityKnowledge project={project} userId={session.user.id} />
					</div>
				</div>
			</div>
		</div>
	);
}
