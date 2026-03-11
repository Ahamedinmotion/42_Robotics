"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface MinimalUser {
	id: string;
	login: string;
	name: string;
	image: string | null;
	role: string;
}

interface RoleManagementProps {
	users: MinimalUser[];
}

export function RoleManagement({ users }: RoleManagementProps) {
	const router = useRouter();
	const [submitting, setSubmitting] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const availableRoles = [
		"STUDENT",
		"SECRETARY",
		"PROJECT_MANAGER",
		"SOCIAL_MEDIA_MANAGER",
		"VP",
		"PRESIDENT"
	];

	const handleRoleChange = async (userId: string, newRole: string) => {
		setSubmitting(userId);
		setError(null);
		try {
			const res = await fetch("/api/admin/roles", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: userId, newRole }),
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error || "Failed to update role");
			}
			router.refresh();
		} catch (e: any) {
			setError(e.message);
		} finally {
			setSubmitting(null);
		}
	};

	return (
		<Card glowing className="space-y-6">
			<div>
				<h2 className="text-lg font-bold text-accent-urgency">Presidential Directive: Role Assignments</h2>
				<p className="text-sm text-text-muted">
					Only you have the clearance to elevate students to administrative roles.
				</p>
			</div>

			{error && (
				<div className="rounded border border-red-500/50 bg-red-500/10 p-2 text-sm text-red-400">
					{error}
				</div>
			)}

			<div className="divide-y divide-border-color rounded-lg border border-border-color bg-panel2/50">
				{users.map((u) => (
					<div key={u.id} className="flex items-center justify-between p-3">
						<div className="flex items-center gap-3">
							{u.image ? (
								<Image src={u.image} alt={u.login} width={32} height={32} className="h-8 w-8 rounded-full border border-border-color object-cover" />
							) : (
								<div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-color bg-panel font-bold text-text-muted text-xs">
									{u.login.charAt(0).toUpperCase()}
								</div>
							)}
							<div>
								<p className="text-sm font-semibold text-text-primary">{u.login}</p>
								<p className="text-xs text-text-muted">{u.name}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<select
								value={u.role}
								onChange={(e) => handleRoleChange(u.id, e.target.value)}
								disabled={submitting === u.id || u.role === "PRESIDENT"}
								className={`rounded-md border p-1 text-xs font-semibold uppercase ${
									u.role === "PRESIDENT" ? "border-accent-urgency text-accent-urgency bg-panel" :
									u.role === "STUDENT" ? "border-border-color text-text-muted bg-background" :
									"border-accent text-accent bg-panel"
								}`}
							>
								{availableRoles.map(r => (
									<option key={r} value={r}>{r.replace(/_/g, " ")}</option>
								))}
							</select>
							{submitting === u.id && <span className="animate-pulse text-xs text-text-muted">Updating...</span>}
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
