"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface AdminNote {
	id: string;
	author: { login: string };
	body: string;
	createdAt: string | Date;
}

export function AdminNotesSection({ userId }: { userId: string }) {
	const [notes, setNotes] = useState<AdminNote[]>([]);
	const [newNote, setNewNote] = useState("");
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const fetchNotes = async () => {
		try {
			const res = await fetch(`/api/admin/users/${userId}/notes`);
			const data = await res.json();
			if (data.ok) setNotes(data.data);
		} catch (e) {
			console.error("Failed to fetch notes", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchNotes();
	}, [userId]);

	const addNote = async () => {
		if (!newNote.trim()) return;
		setSubmitting(true);
		try {
			const res = await fetch(`/api/admin/users/${userId}/notes`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ body: newNote }),
			});
			const data = await res.json();
			if (data.ok) {
				setNotes([data.data, ...notes]);
				setNewNote("");
			}
		} catch (e) {
			console.error("Failed to add note", e);
		} finally {
			setSubmitting(false);
		}
	};

	const deleteNote = async (id: string) => {
		if (!confirm("Are you sure you want to delete this note?")) return;
		try {
			const res = await fetch(`/api/admin/users/${userId}/notes/${id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.ok) {
				setNotes(notes.filter(n => n.id !== id));
			}
		} catch (e) {
			console.error("Failed to delete note", e);
		}
	};

	return (
		<Card className="space-y-4 border-accent/20 bg-accent/5">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold uppercase tracking-wider text-accent">
					Admin Sticky Notes
				</h3>
				<span className="text-[10px] font-medium text-accent/60 uppercase">Private to Admins</span>
			</div>

			<div className="space-y-3">
				<div className="flex gap-2">
					<input 
						type="text" 
						value={newNote}
						onChange={e => setNewNote(e.target.value)}
						placeholder="Add a private note..."
						className="flex-1 rounded-md border border-border-color bg-panel px-3 py-1.5 text-sm outline-none focus:border-accent"
						onKeyDown={e => e.key === "Enter" && addNote()}
					/>
					<button 
						onClick={addNote}
						disabled={submitting || !newNote.trim()}
						className="rounded-md bg-accent px-4 py-1.5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						Add
					</button>
				</div>

				{loading ? (
					<p className="text-center text-xs text-text-muted">Loading notes...</p>
				) : notes.length === 0 ? (
					<p className="py-2 text-center text-xs text-text-muted italic">No notes for this member.</p>
				) : (
					<div className="space-y-2">
						{notes.map(note => (
							<div key={note.id} className="group relative rounded-lg border border-border-color bg-panel p-3">
								<div className="mb-1 flex items-center justify-between">
									<span className="text-[10px] font-bold text-accent">@{note.author.login}</span>
									<span className="text-[10px] text-text-muted">{new Date(note.createdAt).toLocaleString()}</span>
								</div>
								<p className="text-xs text-text-primary whitespace-pre-wrap">{note.body}</p>
								<button 
									onClick={() => deleteNote(note.id)}
									className="absolute right-2 top-2 hidden text-[10px] text-accent-urgency hover:underline group-hover:block"
								>
									Delete
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</Card>
	);
}
