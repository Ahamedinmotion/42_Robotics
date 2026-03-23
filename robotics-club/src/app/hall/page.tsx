import prisma from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HallOfFamePage() {
	const session = await getServerSession(authOptions);
	if (session?.user?.id) {
		try {
			await prisma.user.update({
				where: { id: session.user.id },
				data: { visitedHall: true }
			});
		} catch (e) {}
	}
	const sRankUsers = await prisma.user.findMany({
		where: { 
			currentRank: "S",
			teams: {
				some: {
					team: {
						status: "COMPLETED",
						project: { rank: "S" }
					}
				}
			}
		},
		include: {
			teams: {
				where: {
					team: {
						status: "COMPLETED",
						project: { rank: "S" }
					}
				},
				include: {
					team: {
						include: {
							project: true
						}
					}
				},
				orderBy: { team: { createdAt: "asc" } },
				take: 1
			}
		},
		orderBy: { createdAt: "asc" }
	});

	return (
		<div className="min-h-screen bg-black text-white p-8 md:p-24 selection:bg-accent selection:text-black">
			<style dangerouslySetInnerHTML={{ __html: `
				body { background: black !important; color: white !important; }
			`}} />
			
			<div className="max-w-2xl mx-auto space-y-16">
				<div className="text-center space-y-2">
					<h1 className="text-8xl font-black text-accent opacity-90 tracking-tighter">S</h1>
					<p className="text-xs uppercase tracking-[0.4em] text-text-muted opacity-40 font-mono">The Hall</p>
				</div>

				{sRankUsers.length === 0 ? (
					<div className="text-center py-20 italic text-text-muted opacity-30 text-sm font-mono">
						No one has reached S rank yet.<br/>
						Be the first.
					</div>
				) : (
					<div className="space-y-12">
						{sRankUsers.map((user, idx) => {
							const team = user.teams[0]?.team;
							const project = team?.project;
							const isFirst = idx === 0;

							return (
								<div key={user.id} className="group relative">
									<div className="flex items-baseline justify-between gap-4">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												{isFirst && (
													<span title="First Ever" className="text-accent animate-pulse font-mono text-xl">✦</span>
												)}
												<Link 
													href={`/profile/${user.id}`}
													className="text-xl font-bold hover:text-accent transition-colors underline-offset-4 decoration-white/20 hover:decoration-accent"
												>
													{user.login}
												</Link>
											</div>
											<p className="text-sm font-medium text-text-muted">
												{project?.title || "Classified Project"}
											</p>
										</div>
										<div className="text-right space-y-1 opacity-40 group-hover:opacity-100 transition-opacity">
											<p className="text-[10px] font-mono">
												{team?.createdAt ? new Date(team.createdAt).toLocaleDateString() : "???"}
											</p>
											<p className="text-[9px] uppercase tracking-widest font-bold">
												{user.joinedAt ? `Arrived ${formatDistanceToNow(new Date(user.joinedAt))} ago` : ""}
											</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				<footer className="pt-32 text-center">
					<p className="text-[8px] uppercase tracking-widest text-text-muted opacity-20 hover:opacity-100 transition-opacity cursor-default font-mono">
						Persistence is the path to excellence.
					</p>
				</footer>
			</div>
		</div>
	);
}
