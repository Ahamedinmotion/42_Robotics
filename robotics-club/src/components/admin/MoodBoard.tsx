"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Note {
	id: string;
	content: string;
	color: string;
	pinned: boolean;
	createdAt: string;
	author: { login: string; name: string };
}

const COLORS = ["#FFD700", "#FF6B00", "#CC44FF", "#44AAFF", "#44FF88", "#FF4466", "#88AADD"];

export function MoodBoard() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [newContent, setNewContent] = useState("");
	const [newColor, setNewColor] = useState(COLORS[0]);
	const { toast } = useToast();
	const router = useRouter();

	const fetchNotes = async () => {
		try {
			const res = await fetch("/api/admin/moodboard");
			if (res.ok) setNotes(await res.json());
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchNotes(); }, []);

	const addNote = async () => {
		if (!newContent.trim()) return;
		const res = await fetch("/api/admin/moodboard", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: newContent, color: newColor }),
		});
		if (res.ok) {
			toast("Note added");
			setNewContent("");
			setShowAdd(false);
			fetchNotes();
		} else {
			toast("Failed to add note", "error");
		}
	};

	const deleteNote = async (id: string) => {
		if (!confirm("Delete this note?")) return;
		const res = await fetch("/api/admin/moodboard", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		if (res.ok) {
			toast("Note removed");
			fetchNotes();
		}
	};

	const togglePin = async (id: string, current: boolean) => {
		await fetch("/api/admin/moodboard", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, pinned: !current }),
		});
		fetchNotes();
	};

	if (loading) return <p className="py-8 text-center text-sm text-text-muted">Loading board...</p>;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Mood Board</h3>
				<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? "Cancel" : "+ Add Note"}
				</Button>
			</div>

			{showAdd && (
				<Card className="space-y-3">
					<textarea
						value={newContent}
						onChange={(e) => setNewContent(e.target.value)}
						placeholder="What's on your mind?"
						rows={3}
						maxLength={500}
						className="w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted"
					/>
					<div className="flex items-center gap-2">
						<span className="text-xs text-text-muted">Color:</span>
						{COLORS.map((c) => (
							<button
								key={c}
								onClick={() => setNewColor(c)}
								className={`h-5 w-5 rounded-full border-2 transition-transform ${newColor === c ? "scale-125 border-white" : "border-transparent"}`}
								style={{ backgroundColor: c }}
							/>
						))}
					</div>
					<Button variant="primary" size="sm" onClick={addNote} disabled={!newContent.trim()}>
						Post Note
					</Button>
				</Card>
			)}

			{notes.length === 0 ? (
				<p className="py-8 text-center text-sm italic text-text-muted">No notes yet. Add the first one!</p>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{notes.map((note) => (
						<div
							key={note.id}
							className="relative rounded-lg p-4 shadow-md transition-transform hover:scale-[1.02]"
							style={{
								backgroundColor: `${note.color}15`,
								borderLeft: `3px solid ${note.color}`,
							}}
						>
							{note.pinned && (
								<span className="absolute right-2 top-2 text-xs">📌</span>
							)}
							<p className="mb-3 text-sm text-text-primary whitespace-pre-wrap">{note.content}</p>
							<div className="flex items-center justify-between">
								<span className="text-[10px] text-text-muted">
									@{note.author.login} · {new Date(note.createdAt).toLocaleDateString()}
								</span>
								<div className="flex items-center gap-1">
									<button
										onClick={() => togglePin(note.id, note.pinned)}
										className="text-[10px] text-text-muted hover:text-accent"
										title={note.pinned ? "Unpin" : "Pin"}
									>
										{note.pinned ? "📌" : "📍"}
									</button>
									<button
										onClick={() => deleteNote(note.id)}
										className="text-[10px] text-text-muted hover:text-accent-urgency"
										title="Delete"
									>
										✕
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
