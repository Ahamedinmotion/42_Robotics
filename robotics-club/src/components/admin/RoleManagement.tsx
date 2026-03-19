"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";
import { useSession } from "next-auth/react";

// ── Master Permission Keys ─────────────────────
const ALL_PERMISSIONS = [
	"CAN_SEND_ANNOUNCEMENTS", "CAN_MANAGE_MEMBERS", "CAN_MANAGE_WAITLIST",
	"CAN_EXTEND_DEADLINES", "CAN_APPROVE_FABRICATION", "CAN_APPROVE_MATERIALS",
	"CAN_APPROVE_PROPOSALS", "CAN_RESOLVE_CONFLICTS", "CAN_MANAGE_DAMAGE",
	"CAN_MANAGE_PROJECTS", "CAN_MANAGE_LAB_ACCESS", "CAN_VIEW_ANALYTICS",
	"CAN_EDIT_CONTENT", "CAN_MANAGE_ROLES", "CAN_MANAGE_CLUB_SETTINGS",
	"CAN_MANAGE_ANNOUNCEMENTS",
];

function permLabel(key: string) {
	return key.replace(/^CAN_/, "").replace(/_/g, " ");
}

// ── Types ──────────────────────────────────────
interface DynamicRoleItem {
	name: string;
	displayName: string;
	isSystem: boolean;
	isAdmin: boolean;
	permissions: string[];
	_count: { users: number };
}

interface UserItem {
	id: string;
	login: string;
	name: string;
	image: string | null;
	role: string;
}

// ── Component ──────────────────────────────────
export function RoleManagement({ currentUserId }: { currentUserId?: string }) {
	const router = useRouter();
	const { toast } = useToast();
	const { playSFX } = useSound();
	const { data: session, update } = useSession();
	const currentUserRole = (session?.user as any)?.role;

	const [roles, setRoles] = useState<DynamicRoleItem[]>([]);
	const [users, setUsers] = useState<UserItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// New role form
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDisplay, setNewDisplay] = useState("");
	const [newPerms, setNewPerms] = useState<string[]>([]);
	const [newIsAdmin, setNewIsAdmin] = useState(true);

	// Editing
	const [editingRole, setEditingRole] = useState<string | null>(null);
	const [editPerms, setEditPerms] = useState<string[]>([]);

	useEffect(() => { fetchAll(); }, []);

	async function fetchAll() {
		setLoading(true);
		const [rolesRes, usersRes] = await Promise.all([
			fetch("/api/admin/dynamic-roles"),
			fetch("/api/admin/roles"),
		]);
		if (rolesRes.ok) {
			const j = await rolesRes.json();
			setRoles(j.data || []);
		}
		if (usersRes.ok) {
			const j = await usersRes.json();
			setUsers(j.data || []);
		}
		setLoading(false);
	}

	const createRole = async () => {
		if (!newName || !newDisplay) return;
		setSubmitting(true);
		const res = await fetch("/api/admin/dynamic-roles", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newName.toUpperCase().replace(/\s+/g, "_"), displayName: newDisplay, isAdmin: newIsAdmin, permissions: newPerms }),
		});
		if (res.ok) {
			toast("Role created");
			setShowCreate(false);
			setNewName(""); setNewDisplay(""); setNewPerms([]); setNewIsAdmin(true);
			fetchAll();
		} else {
			const j = await res.json();
			toast(j.error || "Failed", "error");
		}
		setSubmitting(false);
	};

	const updateRolePerms = async (roleName: string, perms: string[]) => {
		setSubmitting(true);
		const res = await fetch(`/api/admin/dynamic-roles/${roleName}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ permissions: perms }),
		});
		if (res.ok) { toast("Permissions updated"); fetchAll(); }
		else { toast("Failed to update", "error"); }
		setSubmitting(false);
	};

	const deleteRole = async (roleName: string) => {
		if (!confirm(`Delete role "${roleName}"? Users will be reassigned to STUDENT.`)) return;
		setSubmitting(true);
		const res = await fetch(`/api/admin/dynamic-roles/${roleName}`, { method: "DELETE" });
		if (res.ok) { toast("Role deleted"); fetchAll(); }
		else { toast("Failed to delete", "error"); }
		setSubmitting(false);
	};

	const changeUserRole = async (userId: string, newRole: string) => {
		setSubmitting(true);
		const res = await fetch("/api/admin/roles", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ targetUserId: userId, newRole }),
		});
		if (res.ok) { toast("Role assigned"); fetchAll(); router.refresh(); }
		else { const j = await res.json(); toast(j.error || "Failed", "error"); }
		setSubmitting(false);
	};
	
	const impersonateUser = async (userId: string) => {
		if (userId === currentUserId) return;
		setSubmitting(true);
		playSFX("button");
		try {
			const res = await fetch("/api/admin/impersonate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUserId: userId }),
			});
			if (res.ok) {
				toast("Impersonation started. Redirecting...");
				await update();
				window.location.href = "/home";
			} else {
				const j = await res.json();
				toast(j.error || "Failed to impersonate", "error");
			}
		} catch {
			toast("Network error", "error");
		}
		setSubmitting(false);
	};

	if (loading) return <div className="py-12 text-center text-text-muted">Loading roles...</div>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-8">
			{/* ── Role Definitions ─────────────────── */}
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Role Definitions</h3>
				<Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>
					{showCreate ? "Cancel" : "+ New Role"}
				</Button>
			</div>

			{showCreate && (
				<Card className="space-y-3">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-muted">Internal Name</label>
							<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. LAB_MODERATOR" className={inputCls} />
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-muted">Display Name</label>
							<input value={newDisplay} onChange={(e) => setNewDisplay(e.target.value)} placeholder="e.g. Lab Moderator" className={inputCls} />
						</div>
					</div>
					<label className="flex items-center gap-2 text-xs text-text-muted">
						<input type="checkbox" checked={newIsAdmin} onChange={(e) => setNewIsAdmin(e.target.checked)} className="accent-accent" />
						Has admin dashboard access
					</label>
					<div>
						<label className="mb-2 block text-xs font-medium text-text-muted">Permissions</label>
						<div className="grid grid-cols-2 gap-1 md:grid-cols-3">
							{ALL_PERMISSIONS.map((p) => (
								<label key={p} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-text-muted hover:text-text-primary">
									<input
										type="checkbox"
										checked={newPerms.includes(p)}
										onChange={(e) => setNewPerms(e.target.checked ? [...newPerms, p] : newPerms.filter((x) => x !== p))}
										className="accent-accent"
									/>
									{permLabel(p)}
								</label>
							))}
						</div>
					</div>
					<Button variant="primary" size="sm" disabled={submitting || !newName || !newDisplay} onClick={createRole}>Create Role</Button>
				</Card>
			)}

			{/* ── Existing Roles ─────────────────── */}
			<div className="space-y-3">
				{roles.map((r) => (
					<Card key={r.name} className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${r.isSystem ? "bg-accent-urgency/20 text-accent-urgency" : "bg-accent/20 text-accent"}`}>
									{r.displayName}
								</span>
								<span className="text-[10px] text-text-muted">{r.name}</span>
								{r.isSystem && <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider bg-panel2 px-1.5 py-0.5 rounded">SYSTEM</span>}
								<span className="text-[10px] text-text-muted">{r._count.users} user{r._count.users !== 1 ? "s" : ""}</span>
							</div>
							<div className="flex gap-2">
								{editingRole !== r.name && r.name !== "PRESIDENT" && (!r.isSystem || currentUserRole === "PRESIDENT") && (
									<>
										<Button variant="ghost" size="sm" onClick={() => { setEditingRole(r.name); setEditPerms([...r.permissions]); }}>Edit</Button>
										<Button variant="ghost" size="sm" className="text-accent-urgency" onClick={() => deleteRole(r.name)} disabled={submitting}>Delete</Button>
									</>
								)}
								{editingRole === r.name && (
									<>
										<Button variant="primary" size="sm" disabled={submitting} onClick={() => { updateRolePerms(r.name, editPerms); setEditingRole(null); }}>Save</Button>
										<Button variant="ghost" size="sm" onClick={() => setEditingRole(null)}>Cancel</Button>
									</>
								)}
							</div>
						</div>

						{/* Show permissions (read-only for system, editable when editing) */}
						{editingRole === r.name ? (
							<div className="grid grid-cols-2 gap-1 md:grid-cols-3 border-t border-border-color/50 pt-3">
								{ALL_PERMISSIONS.map((p) => (
									<label key={p} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-text-muted hover:text-text-primary">
										<input
											type="checkbox"
											checked={editPerms.includes(p)}
											onChange={(e) => setEditPerms(e.target.checked ? [...editPerms, p] : editPerms.filter((x) => x !== p))}
											className="accent-accent"
										/>
										{permLabel(p)}
									</label>
								))}
							</div>
						) : (
							<div className="flex flex-wrap gap-1">
								{r.name === "PRESIDENT" ? (
									<span className="text-[10px] rounded bg-accent/10 px-1.5 py-0.5 text-accent font-semibold">ALL PERMISSIONS</span>
								) : r.permissions.length === 0 ? (
									<span className="text-[10px] text-text-muted italic">No permissions</span>
								) : (
									r.permissions.map((p) => (
										<span key={p} className="text-[10px] rounded bg-panel2 px-1.5 py-0.5 text-text-muted">{permLabel(p)}</span>
									))
								)}
							</div>
						)}
					</Card>
				))}
			</div>

			{/* ── User Role Assignment ────────────── */}
			<Card className="space-y-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Assign Roles to Members</h3>
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border-color text-left text-xs text-text-muted">
							<th className="py-2">Member</th>
							<th>Current Role</th>
							<th>Change</th>
							<th className="text-right">Action</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.id} className="border-b border-border-color">
								<td className="py-2">
									<div className="flex items-center gap-2">
										{u.image ? (
											<Image src={u.image} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
										) : (
											<div className="flex h-6 w-6 items-center justify-center rounded-full bg-panel2 text-[9px] font-bold text-text-muted">
												{u.login[0].toUpperCase()}
											</div>
										)}
										<div>
											<p className="font-medium text-text-primary">{u.name}</p>
											<p className="text-[10px] text-text-muted">@{u.login}</p>
										</div>
									</div>
								</td>
								<td>
									<span className={`text-xs font-semibold uppercase ${u.role === "PRESIDENT" ? "text-accent-urgency" : u.role === "STUDENT" ? "text-text-muted" : "text-accent"}`}>
										{u.role.replace(/_/g, " ")}
									</span>
								</td>
								<td>
									<select
										value={u.role}
										disabled={u.role === "PRESIDENT" || submitting}
										onChange={(e) => changeUserRole(u.id, e.target.value)}
										className="rounded-md border border-border-color bg-background p-1 text-xs text-text-primary disabled:opacity-50"
									>
										{roles.map((r) => (
											<option key={r.name} value={r.name}>{r.displayName}</option>
										))}
									</select>
								</td>
								<td className="text-right">
									{u.id !== currentUserId && (
										<Button 
											variant="ghost" 
											size="sm" 
											className="text-[10px] uppercase tracking-wider text-accent hover:bg-accent/10"
											disabled={submitting}
											onClick={() => impersonateUser(u.id)}
										>
											🕵️ Impersonate
										</Button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</Card>
		</div>
	);
}
