"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";

interface CalibrationSession {
	id: string;
	title: string;
	description: string;
	projectId: string;
	sheetId: string;
	isActive: boolean;
	responses: any[];
	createdAt: string;
}

export function CalibrationPortal() {
	const { toast } = useToast();
	const [sessions, setSessions] = useState<CalibrationSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [form, setForm] = useState({ title: "", description: "", projectId: "", sheetId: "", dummyUrl: "" });

	useEffect(() => {
		fetchSessions();
	}, []);

	const fetchSessions = async () => {
		try {
			const res = await fetch("/api/admin/evaluations/calibration");
			const json = await res.json();
			if (json.success) setSessions(json.data);
		} catch (err) {
			toast("Failed to load sessions", "error");
		} finally {
			setLoading(false);
		}
	};

	const createSession = async () => {
		try {
			const res = await fetch("/api/admin/evaluations/calibration", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...form,
					dummySubmission: { githubUrl: form.dummyUrl, photos: [] }
				})
			});
			if (res.ok) {
				toast("Calibration session created");
				setShowCreate(false);
				fetchSessions();
			}
		} catch (err) {
			toast("Failed to create session", "error");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-2 h-2 rounded-full bg-accent animate-ping" />
					<h3 className="text-xs font-black uppercase tracking-[0.3em] text-text-muted italic">Calibration Matrix</h3>
				</div>
				<Button size="sm" variant="primary" onClick={() => setShowCreate(!showCreate)}>
					{showCreate ? "Cancel" : "Initiate Calibration Cycle"}
				</Button>
			</div>

			{showCreate && (
				<Card className="p-6 border-accent/20 bg-accent/5 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<input 
							placeholder="Session Title (e.g. Rank C Calibration - Line Follower)" 
							className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm"
							value={form.title}
							onChange={e => setForm({ ...form, title: e.target.value })}
						/>
						<input 
							placeholder="Project ID" 
							className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm"
							value={form.projectId}
							onChange={e => setForm({ ...form, projectId: e.target.value })}
						/>
					</div>
					<textarea 
						placeholder="Mission Briefing / Instructions for participants" 
						className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm min-h-[100px]"
						value={form.description}
						onChange={e => setForm({ ...form, description: e.target.value })}
					/>
					<input 
						placeholder="Dummy Submission GitHub URL" 
						className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm"
						value={form.dummyUrl}
						onChange={e => setForm({ ...form, dummyUrl: e.target.value })}
					/>
					<Button size="sm" variant="primary" onClick={createSession} disabled={!form.title || !form.projectId}>Launch Cycle</Button>
				</Card>
			)}

			<div className="grid grid-cols-1 gap-4">
				{sessions.map(session => (
					<Card key={session.id} className="p-6 border-white/5 bg-panel/20 hover:border-white/10 transition-all group">
						<div className="flex items-start justify-between mb-4">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<h4 className="text-sm font-black uppercase tracking-widest text-text-primary group-hover:text-accent transition-colors">{session.title}</h4>
									<Badge rank="C" size="sm" />
								</div>
								<p className="text-[10px] text-text-muted uppercase tracking-wider">{session.responses.length} Participants • Active Cycle</p>
							</div>
							<div className="text-[10px] font-mono text-text-muted">
								{new Date(session.createdAt).toLocaleDateString()}
							</div>
						</div>

						{session.responses.length > 0 ? (
							<div className="mt-6 border-t border-white/5 pt-4">
								<h5 className="text-[8px] font-black uppercase tracking-[0.2em] text-accent mb-4">Side-by-Side Comparison</h5>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
									{session.responses.map((resp: any) => (
										<div key={resp.id} className="p-3 rounded-lg bg-black/40 border border-white/5">
											<div className="flex justify-between items-center mb-2">
												<span className="text-[10px] font-bold text-text-primary">Assessor {resp.evaluatorId.slice(-4).toUpperCase()}</span>
												<span className="text-[10px] font-black text-accent">{resp.score}%</span>
											</div>
											<p className="text-[9px] text-text-muted italic line-clamp-2 leading-tight">"{resp.feedback}"</p>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
								<p className="text-[10px] text-text-muted uppercase tracking-widest">Awaiting participants to synchronize standards.</p>
							</div>
						)}
					</Card>
				))}
				{sessions.length === 0 && (
					<p className="text-[10px] py-12 text-center text-text-muted uppercase tracking-widest border border-dashed border-white/10 rounded-xl">No calibration cycles recorded in history.</p>
				)}
			</div>
		</div>
	);
}
