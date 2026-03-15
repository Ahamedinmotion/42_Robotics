"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface FabReq {
	id: string;
	machineType: string;
	modelFileUrl: string;
	estimatedMinutes: number;
	estimatedMaterialGrams: number;
	status: string;
	createdAt: string;
	purpose: string;
	team?: { name: string; project: { title: string } };
}

const MACHINE_CHIP: Record<string, string> = {
	FDM_3D_PRINTER: "bg-orange-900/40 text-orange-400",
	RESIN_3D_PRINTER: "bg-purple-900/40 text-purple-400",
	CNC_ROUTER: "bg-blue-900/40 text-blue-400",
	LASER_CUTTER: "bg-red-900/40 text-red-400",
};

export function FabricationRequestList() {
	const [requests, setRequests] = useState<FabReq[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [form, setForm] = useState({ machineType: "FDM_3D_PRINTER", modelFileUrl: "", estimatedMinutes: 0, estimatedMaterialGrams: 0, purpose: "" });
	const { toast } = useToast();

	const fetchRequests = async () => {
		try {
			const res = await fetch("/api/requests/fabrication");
			if (res.ok) {
				const json = await res.json();
				setRequests(json.data || []);
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchRequests(); }, []);

	const submit = async () => {
		const res = await fetch("/api/requests/fabrication", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		if (res.ok) {
			toast("Fabrication request submitted!");
			setShowAdd(false);
			setForm({ machineType: "FDM_3D_PRINTER", modelFileUrl: "", estimatedMinutes: 0, estimatedMaterialGrams: 0, purpose: "" });
			fetchRequests();
		}
	};

	if (loading) return <p className="py-8 text-center text-sm text-text-muted">Loading requests...</p>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold text-text-primary">3D Print & CNC Jobs</h2>
				<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? "Cancel" : "New Job"}
				</Button>
			</div>

			{showAdd && (
				<Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Machine Type</label>
						<select value={form.machineType} onChange={e => setForm({ ...form, machineType: e.target.value })} className={inputCls}>
							<option value="FDM_3D_PRINTER">FDM 3D Printer</option>
							<option value="RESIN_3D_PRINTER">Resin 3D Printer</option>
							<option value="CNC_ROUTER">CNC Router</option>
							<option value="LASER_CUTTER">Laser Cutter</option>
						</select>
					</div>
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Model File URL</label>
						<input value={form.modelFileUrl} onChange={e => setForm({ ...form, modelFileUrl: e.target.value })} className={inputCls} placeholder="Link to .stl or design" />
					</div>
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Est. Minutes</label>
						<input type="number" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: parseInt(e.target.value) })} className={inputCls} />
					</div>
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Est. Material (g)</label>
						<input type="number" value={form.estimatedMaterialGrams} onChange={e => setForm({ ...form, estimatedMaterialGrams: parseFloat(e.target.value) })} className={inputCls} />
					</div>
					<div className="col-span-full space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Purpose</label>
						<textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className={inputCls} rows={3} placeholder="What is this part for?" />
					</div>
					<div className="col-span-full">
						<Button variant="primary" size="sm" className="w-full" onClick={submit} disabled={!form.modelFileUrl || !form.purpose}>Submit Job</Button>
					</div>
				</Card>
			)}

			<div className="space-y-3">
				{requests.map((r) => (
					<Card key={r.id} className="flex items-center justify-between gap-4">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-text-primary text-sm truncate">{r.modelFileUrl.split('/').pop()}</h3>
								<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${MACHINE_CHIP[r.machineType] || ""}`}>
									{r.machineType.replace(/_/g, ' ')}
								</span>
							</div>
							<p className="text-xs text-text-muted line-clamp-1">{r.purpose}</p>
							<div className="mt-1 flex items-center gap-3 text-[10px] text-text-muted">
								<span>Time: {r.estimatedMinutes}m</span>
								<span>Material: {r.estimatedMaterialGrams}g</span>
								{r.team && <span className="text-accent">Team: {r.team.name}</span>}
							</div>
						</div>
						<div className="text-right">
							<span className="text-xs font-bold text-text-muted">{r.status}</span>
							<p className="text-[10px] text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
						</div>
					</Card>
				))}
				{requests.length === 0 && !loading && (
					<p className="py-12 text-center text-sm italic text-text-muted">No fabrication jobs yet.</p>
				)}
			</div>
		</div>
	);
}
