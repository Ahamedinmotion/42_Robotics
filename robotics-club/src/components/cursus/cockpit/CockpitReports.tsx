"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";
import { FileUpload } from "@/components/ui/FileUpload";
import Image from "next/image";

interface CockpitReportsProps {
	team: any;
	isAdmin: boolean;
}

export function CockpitReports({ team, isAdmin }: CockpitReportsProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [showForm, setShowForm] = useState(false);
	const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Form State
	const [summary, setSummary] = useState("");
	const [isMilestone, setIsMilestone] = useState(false);
	const [milestoneTitle, setMilestoneTitle] = useState("");
	const [hoursLogged, setHoursLogged] = useState("");
	const [mood, setMood] = useState("🙂");
	const [nextWeekPlan, setNextWeekPlan] = useState("");
	const [blockers, setBlockers] = useState("");
	const [photos, setPhotos] = useState<string[]>([]);

	const nextWeek = (team.weeklyReports?.length > 0 
		? Math.max(...team.weeklyReports.map((r: any) => r.weekNumber)) 
		: 0) + 1;

	const handleSubmit = async () => {
		if (!summary) return toast("Report summary is required", "error");
		if (photos.length < 5) return toast("At least 5 build photos are required", "error");
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/reports`, {
				method: "POST",
				body: JSON.stringify({
					weekNumber: nextWeek,
					summary,
					isMilestone,
					milestoneTitle,
					hoursLogged: parseFloat(hoursLogged),
					mood,
					nextWeekPlan,
					blockersNotes: blockers,
					photoUrls: photos,
				}),
			});
			if (!res.ok) throw new Error("Failed to submit report");
			toast("Report submitted successfully!", "success");
			playSFX("achievement");
			setShowForm(false);
			// In a real app, you'd trigger a refresh or update parent state
			window.location.reload();
		} catch (err) {
			toast("Failed to submit report", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const moods = ["🔥", "😎", "🙂", "😐", "😰", "💀"];

	const removePhoto = (url: string) => {
		setPhotos(prev => prev.filter(p => p !== url));
	};

	const getThumb = (url: string) => {
		if (!url.includes("cloudinary.com")) return url;
		return url.replace("/upload/", "/upload/w_200,h_150,c_fill,g_auto/");
	};

	// Biweekly report enforcement
	const lastReportDate = team.weeklyReports?.length > 0
		? new Date(Math.max(...team.weeklyReports.map((r: any) => new Date(r.createdAt).getTime())))
		: team.createdAt ? new Date(team.createdAt) : null;
	const daysSinceLastReport = lastReportDate
		? Math.floor((Date.now() - lastReportDate.getTime()) / 86400000)
		: 0;
	const isReportOverdue = daysSinceLastReport >= 14;
	const daysUntilDue = Math.max(0, 14 - daysSinceLastReport);

	return (
		<div className="max-w-4xl mx-auto space-y-12">
			{/* Overdue Report Warning */}
			{!showForm && team.status === "ACTIVE" && isReportOverdue && (
				<div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 animate-pulse-slow space-y-3">
					<div className="flex items-center gap-3">
						<div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
						<h4 className="text-sm font-black uppercase tracking-widest text-red-400">Report Overdue</h4>
					</div>
					<p className="text-xs text-red-400/70 leading-relaxed">
						Your last report was <span className="font-bold text-red-400">{daysSinceLastReport} days ago</span>. 
						Reports are required every 2 weeks. Submit one now to stay on track.
					</p>
				</div>
			)}

			{/* Due Soon Warning */}
			{!showForm && team.status === "ACTIVE" && !isReportOverdue && daysUntilDue <= 3 && daysUntilDue > 0 && (
				<div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
					<span className="text-amber-400 text-sm">⚠️</span>
					<p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
						Report due in {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""}
					</p>
				</div>
			)}

			{/* Submission Area */}
			{!showForm && team.status === "ACTIVE" && (
				<div className="flex justify-center">
					<Button 
						size="lg" 
						onClick={() => setShowForm(true)}
						className={`h-16 px-12 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.05)] ${isReportOverdue ? "animate-pulse ring-2 ring-red-500/30" : ""}`}
					>
						{isReportOverdue ? "⚠️ Submit Overdue Report — Week " + nextWeek : "✨ Submit Week " + nextWeek + " Report"}
					</Button>
				</div>

			)}

			{showForm && (
				<Card className="p-8 space-y-8 bg-panel-2 border-accent/20 shadow-[0_0_50px_rgba(var(--accent-rgb),0.1)]">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-black tracking-tight text-text-primary">New Weekly Report — Week {nextWeek}</h3>
						<button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary">✕</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="space-y-4">
							<label className="text-xs font-black uppercase tracking-widest text-text-muted">Summary of Progress</label>
							<textarea 
								value={summary}
								onChange={(e) => setSummary(e.target.value)}
								placeholder="What did the squad achieve this week?"
								className="w-full h-40 bg-background border border-border rounded-2xl p-6 text-sm outline-none focus:ring-2 ring-accent/20 resize-none"
							/>
							
							<div className="space-y-4 pt-4">
								<div className="flex items-center justify-between">
									<label className="text-xs font-black uppercase tracking-widest text-text-muted">Build Photos <span className="text-accent-urgency">*</span></label>
									<span className={`text-[10px] font-black uppercase tracking-widest ${photos.length >= 5 ? "text-emerald-400" : "text-red-400"}`}>{photos.length}/5 minimum</span>
								</div>
								<div className="grid grid-cols-3 gap-4">
									{photos.map((url) => (
										<div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group/img">
											<Image src={url} alt="Report preview" fill className="object-cover" />
											<button 
												onClick={() => removePhoto(url)}
												className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white text-[10px] opacity-0 group-hover/img:opacity-100 transition-opacity"
											>
												✕
											</button>
										</div>
									))}
									{photos.length < 5 && (
										<FileUpload 
											teamId={team.id} 
											uploadType="reports" 
											onUploadComplete={(data) => setPhotos(prev => [...prev, data.url])}
										/>
									)}
								</div>
							</div>
						</div>

						<div className="space-y-8">
							<div className="space-y-4">
								<label className="text-xs font-black uppercase tracking-widest text-text-muted">Squad Mood</label>
								<div className="flex gap-2">
									{moods.map((m) => (
										<button
											key={m}
											onClick={() => setMood(m)}
											className={`h-12 w-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
												mood === m ? "bg-accent/20 scale-110 border border-accent/50" : "bg-background border border-border grayscale hover:grayscale-0"
											}`}
										>
											{m}
										</button>
									))}
								</div>
							</div>

							<div className="space-y-4">
								<label className="text-xs font-black uppercase tracking-widest text-text-muted">Total Lab Hours</label>
								<input 
									type="number"
									value={hoursLogged}
									onChange={(e) => setHoursLogged(e.target.value)}
									placeholder="e.g. 42"
									className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20"
								/>
							</div>

							<div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
								<input 
									type="checkbox"
									checked={isMilestone}
									onChange={(e) => setIsMilestone(e.target.checked)}
									className="h-5 w-5 accent-accent"
								/>
								<div className="flex-1">
									<p className="text-xs font-bold text-text-primary">Major Milestone reached?</p>
									{isMilestone && (
										<input 
											placeholder="Milestone Title"
											value={milestoneTitle}
											onChange={(e) => setMilestoneTitle(e.target.value)}
											className="mt-2 w-full bg-panel border-b border-accent/30 py-1 text-xs outline-none text-accent"
										/>
									)}
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="space-y-4">
							<label className="text-xs font-black uppercase tracking-widest text-text-muted">Plan for Next Week</label>
							<textarea 
								value={nextWeekPlan}
								onChange={(e) => setNextWeekPlan(e.target.value)}
								className="w-full h-24 bg-background border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-accent/20 resize-none"
							/>
						</div>
						<div className="space-y-4">
							<label className="text-xs font-black uppercase tracking-widest text-text-muted">Blockers & Hurdles</label>
							<textarea 
								value={blockers}
								onChange={(e) => setBlockers(e.target.value)}
								className="w-full h-24 bg-background border border-border rounded-xl p-4 text-sm outline-none focus:ring-2 ring-accent/20 resize-none"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-4 mt-8">
						<Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
						<Button disabled={isLoading || photos.length < 5} onClick={handleSubmit}>
							{isLoading ? "Broadcasting..." : photos.length < 5 ? `📸 ${5 - photos.length} more photo(s) required` : "🚀 Broadcast Report"}
						</Button>
					</div>
				</Card>
			)}

			{/* Timeline View */}
			<div className="space-y-8 relative">
				<div className="absolute left-[27px] top-6 bottom-6 w-px bg-white/5" />
				
				{team.weeklyReports?.length === 0 ? (
					<div className="text-center py-20 opacity-30">
						<p className="text-sm font-black uppercase tracking-[0.3em]">No Mission Data Logged</p>
					</div>
				) : (
					team.weeklyReports.map((report: any, idx: number) => (
						<div key={report.id} className="flex gap-8 group">
							<div className="relative z-10 h-14 w-14 shrink-0 rounded-2xl bg-panel flex items-center justify-center border border-white/5 text-xl font-black shadow-xl group-hover:border-accent/30 transition-colors">
								{report.mood || "📊"}
							</div>
							<Card className="flex-1 p-8 space-y-6 hover:border-white/10 transition-colors">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<p className="text-[10px] font-black uppercase tracking-widest text-accent">Week {report.weekNumber}</p>
										{report.isMilestone && (
											<span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
												Milestone: {report.milestoneTitle}
											</span>
										)}
									</div>
									<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
										{new Date(report.createdAt).toLocaleDateString()}
									</p>
								</div>

								<div className="space-y-4">
									<p className="text-base font-medium leading-relaxed text-text-primary">
										{report.summary}
									</p>
									{report.nextWeekPlan && (
										<div className="p-4 rounded-xl bg-background/50 border border-border/50">
											<p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Next Targets</p>
											<p className="text-sm text-text-muted-more">{report.nextWeekPlan}</p>
										</div>
									)}
								</div>

								{/* Report Photos */}
								{report.photoUrls?.length > 0 && (
									<div className="space-y-2 pt-2">
										<p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Build Photos ({report.photoUrls.length})</p>
										<div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
											{report.photoUrls.map((url: string, pIdx: number) => (
												<div
													key={`${url}-${pIdx}`}
													onClick={() => setLightboxUrl(url)}
													className="relative h-[80px] w-[110px] shrink-0 rounded-lg overflow-hidden border border-white/5 cursor-pointer hover:border-accent/40 transition-all group/thumb"
												>
													<Image src={getThumb(url)} alt={`Week ${report.weekNumber} photo`} fill className="object-cover group-hover/thumb:scale-110 transition-transform duration-500" />
												</div>
											))}
										</div>
									</div>
								)}

								<div className="flex items-center gap-6 pt-4 border-t border-white/5">
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Hours</span>
										<span className="text-xs font-bold text-text-primary">{report.hoursLogged || "—"}</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">By</span>
										<span className="text-xs font-bold text-accent">{report.submittedBy?.login}</span>
									</div>
									{report.photoUrls?.length > 0 && (
										<div className="flex items-center gap-2">
											<span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Photos</span>
											<span className="text-xs font-bold text-text-primary">{report.photoUrls.length}</span>
										</div>
									)}
								</div>
							</Card>
						</div>
					))
				)}
			</div>
			{/* Photo Lightbox */}
			{lightboxUrl && (
				<div
					className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
					onClick={() => setLightboxUrl(null)}
				>
					<button className="absolute top-8 right-8 text-white/40 hover:text-white text-3xl transition-colors">✕</button>
					<div className="relative w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
						<Image src={lightboxUrl} alt="Build photo" fill className="object-contain" />
					</div>
				</div>
			)}
		</div>
	);
}
