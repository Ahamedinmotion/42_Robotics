"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface AdminPermissions {
	canManageMembers: boolean;
	canManageContent: boolean;
	canManageAccess: boolean;
	canViewAnalytics: boolean;
	customTitle: string | null;
}

interface UserWithPerms {
	id: string;
	login: string;
	name: string;
	image: string | null;
	role: string;
	adminPermissions: AdminPermissions | null;
}

interface RoleManagementProps {
	initialUsers?: UserWithPerms[];
}

export function RoleManagement({ initialUsers = [] }: RoleManagementProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [users, setUsers] = useState<UserWithPerms[]>(initialUsers);
	const [loading, setLoading] = useState(initialUsers.length === 0);
	const [submitting, setSubmitting] = useState<string | null>(null);

	const availableRoles = [
		"STUDENT",
		"SECRETARY",
		"PROJECT_MANAGER",
		"SOCIAL_MEDIA_MANAGER",
		"VP",
		"PRESIDENT"
	];

	useEffect(() => {
		fetchUsers();
	}, []);

	async function fetchUsers() {
		try {
			const res = await fetch("/api/admin/roles");
			if (res.ok) {
				const raw = await res.json();
				setUsers(Array.isArray(raw) ? raw : raw.data || []);
			}
		} finally {
			setLoading(false);
		}
	}

	const updatePerms = async (userId: string, updates: Partial<AdminPermissions>) => {
		const user = users.find(u => u.id === userId);
		if (!user) return;

		const currentPerms = user.adminPermissions || {
			canManageMembers: false,
			canManageContent: false,
			canManageAccess: false,
			canViewAnalytics: false,
			customTitle: null
		};

		const newPerms = { ...currentPerms, ...updates };

		setSubmitting(userId);
		try {
			const res = await fetch("/api/admin/roles", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: userId, permissions: newPerms }),
			});
			if (res.ok) {
				toast("Permissions updated");
				fetchUsers();
			} else {
				const data = await res.json();
				toast(data.error || "Failed", "error");
			}
		} catch {
			toast("Network error", "error");
		} finally {
			setSubmitting(userId);
		}
	};

	const handleRoleChange = async (userId: string, newRole: string) => {
		setSubmitting(userId);
		try {
			const res = await fetch("/api/admin/roles", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: userId, newRole }),
			});
			if (res.ok) {
				toast("Role updated");
				fetchUsers();
			}
		} finally {
			setSubmitting(null);
		}
	};

	const handleImpersonate = async (targetUserId: string) => {
		try {
			const res = await fetch("/api/admin/impersonate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId }),
			});
			if (res.ok) {
				toast("Impersonation active. Refreshing...");
				window.location.href = "/home";
			} else {
				const data = await res.json();
				toast(data.error || "Failed to impersonate", "error");
			}
		} catch {
			toast("Network error", "error");
		}
	};

	if (loading) return <div className="py-12 text-center text-text-muted">Verifying credentials...</div>;

	return (
		<Card glowing className="space-y-6">
			<div>
				<h2 className="text-lg font-bold text-accent-urgency text-forge-purple">Presidential Directive: Granular Authority</h2>
				<p className="text-sm text-text-muted">
					Establish new administrative positions by moderating specific abilities and custom titles.
				</p>
			</div>

			<div className="space-y-4">
				{users.map((u) => (
					<div key={u.id} className="rounded-lg border border-border-color bg-panel2/30 p-4 space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								{u.image ? (
									<Image src={u.image} alt={u.login} width={40} height={40} className="h-10 w-10 rounded-full border border-border-color object-cover" />
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-color bg-panel font-bold text-text-muted">
										{u.login.charAt(0).toUpperCase()}
									</div>
								)}
								<div>
									<p className="text-sm font-semibold text-text-primary">@{u.login}</p>
									<p className="text-xs text-text-muted">{u.name}</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<select
									value={u.role}
									onChange={(e) => handleRoleChange(u.id, e.target.value)}
									disabled={u.role === "PRESIDENT"}
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

								{u.id !== initialUsers.find(iu => iu.role === "PRESIDENT")?.id && (
									<Button 
										variant="secondary" 
										size="sm" 
										className="h-8 text-[10px] font-bold uppercase tracking-wider text-forge-purple border-forge-purple hover:bg-forge-purple/10"
										onClick={() => handleImpersonate(u.id)}
									>
										Impersonate
									</Button>
								)}
							</div>
						</div>

						{u.role !== "STUDENT" && u.role !== "PRESIDENT" && (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border-color/50 pt-4">
								<div className="space-y-2">
									<label className="text-[10px] font-bold uppercase text-text-muted">Custom Position Title</label>
									<input
										type="text"
										placeholder="e.g. Lab Overseer"
										value={u.adminPermissions?.customTitle || ""}
										onChange={(e) => updatePerms(u.id, { customTitle: e.target.value })}
										className="w-full rounded-md border border-border-color bg-background p-2 text-xs"
									/>
								</div>
								
								<div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 items-center">
									<PermToggle
										label="Members"
										active={u.adminPermissions?.canManageMembers || false}
										onChange={(val) => updatePerms(u.id, { canManageMembers: val })}
									/>
									<PermToggle
										label="Content"
										active={u.adminPermissions?.canManageContent || false}
										onChange={(val) => updatePerms(u.id, { canManageContent: val })}
									/>
									<PermToggle
										label="Access"
										active={u.adminPermissions?.canManageAccess || false}
										onChange={(val) => updatePerms(u.id, { canManageAccess: val })}
									/>
									<PermToggle
										label="Analytics"
										active={u.adminPermissions?.canViewAnalytics || false}
										onChange={(val) => updatePerms(u.id, { canViewAnalytics: val })}
									/>
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</Card>
	);
}

function PermToggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
	return (
		<label className="flex items-center gap-2 cursor-pointer group">
			<div 
				onClick={() => onChange(!active)}
				className={`w-8 h-4 rounded-full relative transition-colors ${active ? "bg-accent" : "bg-gray-700"}`}
			>
				<div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${active ? "translate-x-4" : ""}`} />
			</div>
			<span className="text-xs text-text-muted group-hover:text-text-primary transition-colors">{label}</span>
		</label>
	);
}
