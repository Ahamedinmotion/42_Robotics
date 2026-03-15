"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface MaterialReq {
	id: string;
	itemName: string;
	quantity: number;
	estimatedCost: number;
	category: string;
	status: string;
	createdAt: string;
	justification: string;
	team?: { name: string; project: { title: string } };
}

const CAT_CHIP: Record<string, string> = {
	ELECTRONICS: "bg-blue-900/40 text-blue-400",
	HARDWARE: "bg-orange-900/40 text-orange-400",
	CONSUMABLE: "bg-green-900/40 text-green-400",
	OTHER: "bg-gray-800/40 text-gray-400",
};

export function MaterialRequestList() {
	const [requests, setRequests] = useState<MaterialReq[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAdd, setShowAdd] = useState(false);
	const [form, setForm] = useState({ itemName: "", quantity: 1, estimatedCost: 0, category: "ELECTRONICS", justification: "" });
	const { toast } = useToast();

	const fetchRequests = async () => {
		try {
			const res = await fetch("/api/requests/materials");
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
		const res = await fetch("/api/requests/materials", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(form),
		});
		if (res.ok) {
			toast("Material request submitted!");
			setShowAdd(false);
			setForm({ itemName: "", quantity: 1, estimatedCost: 0, category: "ELECTRONICS", justification: "" });
			fetchRequests();
		}
	};

	if (loading) return <p className="py-8 text-center text-sm text-text-muted">Loading requests...</p>;

	const inputCls = "w-full rounded-md border border-border-color bg-background p-2 text-sm text-text-primary placeholder:text-text-muted";

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-bold text-text-primary">Material Procurement</h2>
				<Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
					{showAdd ? "Cancel" : "New Request"}
				</Button>
			</div>

			{showAdd && (
				<Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Item Name</label>
						<input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} className={inputCls} placeholder="e.g. Raspberry Pi 5" />
					</div>
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Category</label>
						<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
							<option value="ELECTRONICS">Electronics</option>
							<option value="HARDWARE">Hardware</option>
							<option value="CONSUMABLE">Consumable</option>
							<option value="OTHER">Other</option>
						</select>
					</div>
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Quantity</label>
						<input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })} className={inputCls} />
					</div>
					<div className="space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Est. Cost ($)</label>
						<input type="number" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: parseFloat(e.target.value) })} className={inputCls} />
					</div>
					<div className="col-span-full space-y-1">
						<label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Justification</label>
						<textarea value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} className={inputCls} rows={3} placeholder="Why does the club need this?" />
					</div>
					<div className="col-span-full">
						<Button variant="primary" size="sm" className="w-full" onClick={submit} disabled={!form.itemName || !form.justification}>Submit Request</Button>
					</div>
				</Card>
			)}

			<div className="space-y-3">
				{requests.map((r) => (
					<Card key={r.id} className="flex items-center justify-between gap-4">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<h3 className="font-semibold text-text-primary">{r.itemName}</h3>
								<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CAT_CHIP[r.category] || ""}`}>
									{r.category}
								</span>
							</div>
							<p className="text-xs text-text-muted line-clamp-1">{r.justification}</p>
							<div className="mt-1 flex items-center gap-3 text-[10px] text-text-muted">
								<span>Qty: {r.quantity}</span>
								<span>Est: ${r.estimatedCost}</span>
								{r.team && <span className="text-accent">For Team: {r.team.name}</span>}
							</div>
						</div>
						<div className="text-right">
							<span className="text-xs font-bold text-text-muted">{r.status}</span>
							<p className="text-[10px] text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
						</div>
					</Card>
				))}
				{requests.length === 0 && !loading && (
					<p className="py-12 text-center text-sm italic text-text-muted">No material requests yet.</p>
				)}
			</div>
		</div>
	);
}
