"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface SendComplimentProps {
	toUserId: string;
	toUserLogin: string;
}

export function SendCompliment({ toUserId, toUserLogin }: SendComplimentProps) {
	const { toast } = useToast();
	const [isOpen, setIsOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);

	const handleSend = async () => {
		if (!message.trim()) return;
		setSending(true);
		try {
			const res = await fetch("/api/compliments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ toUserId, message }),
			});

			if (res.ok) {
				toast(`Compliment sent to @${toUserLogin}! ✨`);
				setMessage("");
				setIsOpen(false);
			} else {
				const data = await res.json();
				toast(data.error || "Failed to send compliment", "error");
			}
		} catch (error) {
			toast("Network error", "error");
		} finally {
			setSending(false);
		}
	};

	if (!isOpen) {
		return (
			<Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
				✨ Send Compliment
			</Button>
		);
	}

	return (
		<div className="mt-4 space-y-3 rounded-lg border border-border-color bg-panel2 p-4 shadow-inner">
			<div className="flex items-center justify-between">
				<h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
					Send Anonymous Compliment
				</h4>
				<button onClick={() => setIsOpen(false)} className="text-xs text-text-muted hover:text-text-primary">
					Cancel
				</button>
			</div>
			<textarea
				placeholder={`Say something nice about @${toUserLogin}...`}
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				className="w-full rounded-md border border-border-color bg-background p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
				rows={3}
				maxLength={500}
			/>
			<div className="flex items-center justify-between">
				<span className="text-[10px] text-text-muted">
					{message.length}/500 • Completely anonymous
				</span>
				<Button
					variant="primary"
					size="sm"
					onClick={handleSend}
					disabled={sending || !message.trim()}
				>
					{sending ? "Sending..." : "Send ✨"}
				</Button>
			</div>
		</div>
	);
}
