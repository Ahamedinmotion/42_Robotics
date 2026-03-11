"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface FeatureReq {
	id: string;
	title: string;
	description: string;
	status: string;
	createdAt: string;
	authorLogin: string;
	authorName: string;
	voteCount: number;
	hasVoted: boolean;
	isOwner: boolean;
}

const STATUS_CHIP: Record<string, string> = {
	OPEN: "bg-blue-900/40 text-blue-400",
	PLANNED: "bg-yellow-900/40 text-yellow-400",
	DONE: "bg-green-900/40 text-green-400",
	DISMISSED: "bg-gray-800/40 text-gray-400",
};

export function FeatureRequestList({ isAdmin = false }: { isAdmin?: boolean }) {
	const [requests, setRequests] = useState<FeatureReq[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const { toast } = useToast();

	const fetchRequests = async () => {
		try {
			const res = await fetch("/api/feature-requests");
			if (res.ok) {
				const data = await res.json();
				// Sort by vote count descending
				data.sort((a: FeatureReq, b: FeatureReq) => b.voteCount - a.voteCount);
				setRequests(data);
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchRequests(); }, []);

	const submit = async () => {
		if (!title.trim() || !description.trim()) return;
		const res = await fetch("/api/feature-requests", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title, description }),
		});
		if (res.ok) {
			toast("Request submitted!");
			setTitle("");
			setDescription("");
			setShowAdd(false);
			fetchRequests();
		} else {
			toast("Failed to submit", "error");
		}
	};

	const vote = async (requestId: string) => {
		const res = await fetch("/api/feature-requests", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "vote", requestId }),
		});
		if (res.ok) fetchRequests();
	};

	const updateStatus = async (requestId: string, status: string) => {
		const res = await fetch("/api/feature-requests", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "status", requestId, status }),
		});
		if (res.ok) {
			toast("Status updated");
			fetchRequests();
		}
	};

	if (loading) return <p className="py-8 text-center text-sm text-text-muted">Loading requests...</p>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-bold text-text-primary">Feature Requests</h2>
					<p className="text-sm text-text-muted">Suggest and vote on new features for the club platform</p>
				</div>
				<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? "Cancel" : "New Request"}
				</Button>
			</div>

			{showAdd && (
				<Card className="space-y-3">
					<input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Feature title"
						maxLength={200}
						className={inputCls}
					/>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Describe the feature you'd like to see..."
						rows={4}
						maxLength={2000}
						className={inputCls}
					/>
					<Button variant="primary" size="sm" onClick={submit} disabled={!title.trim() || !description.trim()}>
						Submit Request
					</Button>
				</Card>
			)}

			{requests.length === 0 ? (
				<p className="py-12 text-center text-sm italic text-text-muted">No feature requests yet. Be the first to suggest one!</p>
			) : (
				<div className="space-y-3">
					{requests.map((r) => (
						<Card key={r.id} className="flex items-start gap-4">
							{/* Vote button */}
							<button
								onClick={() => vote(r.id)}
								className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors ${r.hasVoted ? "bg-accent/20 text-accent" : "bg-panel2 text-text-muted hover:bg-accent/10 hover:text-accent"}`}
							>
								<span className="text-lg">▲</span>
								<span className="text-xs font-bold">{r.voteCount}</span>
							</button>

							{/* Content */}
							<div className="min-w-0 flex-1">
								<div className="mb-1 flex items-center gap-2">
									<h3 className="font-semibold text-text-primary">{r.title}</h3>
									<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[r.status] || ""}`}>
										{r.status}
									</span>
								</div>
								<p className="mb-2 text-sm text-text-muted line-clamp-2">{r.description}</p>
								<div className="flex items-center gap-3">
									<span className="text-[10px] text-text-muted">
										by @{r.authorLogin} · {new Date(r.createdAt).toLocaleDateString()}
									</span>
									{isAdmin && r.status === "OPEN" && (
										<div className="flex gap-1">
											<button onClick={() => updateStatus(r.id, "PLANNED")} className="text-[10px] text-yellow-400 hover:underline">Plan</button>
											<button onClick={() => updateStatus(r.id, "DONE")} className="text-[10px] text-green-400 hover:underline">Done</button>
											<button onClick={() => updateStatus(r.id, "DISMISSED")} className="text-[10px] text-text-muted hover:underline">Dismiss</button>
										</div>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
