"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";
import { FileUpload } from "@/components/ui/FileUpload";

interface CockpitMaterialsProps {
	team: any;
	isAdmin: boolean;
}

export function CockpitMaterials({ team, isAdmin }: CockpitMaterialsProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	const [activeForm, setActiveForm] = useState<"material" | "fabrication" | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Material Form State
	const [matName, setMatName] = useState("");
	const [matQty, setMatQty] = useState("1");
	const [matCost, setMatCost] = useState("");
	const [matJustification, setMatJustification] = useState("");

	// Fabrication Form State
	const [fabType, setFabType] = useState("PRINTER_FDM");
	const [fabUrl, setFabUrl] = useState("");
	const [fabPurpose, setFabPurpose] = useState("");

	const submitMaterial = async () => {
		if (!matName) return;
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/materials`, {
				method: "POST",
				body: JSON.stringify({
					itemName: matName,
					quantity: parseInt(matQty),
					estimatedCost: matCost,
					justification: matJustification,
				}),
			});
			if (res.ok) {
				toast("Material request submitted!", "success");
				playSFX("achievement");
				setActiveForm(null);
				window.location.reload();
			}
		} catch (err) {
			toast("Failed to submit request", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const submitFabrication = async () => {
		if (!fabUrl) return toast("Please upload a model file", "error");
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/fabrication`, {
				method: "POST",
				body: JSON.stringify({
					machineType: fabType,
					modelFileUrl: fabUrl,
					purpose: fabPurpose,
				}),
			});
			if (res.ok) {
				toast("Fabrication request submitted!", "success");
				playSFX("achievement");
				setActiveForm(null);
				window.location.reload();
			}
		} catch (err) {
			toast("Failed to submit request", "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-12">
			<div className="flex flex-col md:flex-row gap-8">
				{/* Inventory & Requests */}
				<div className="flex-1 space-y-8">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted">Allocated Materials</h3>
						<Button size="sm" variant="ghost" onClick={() => setActiveForm("material")}>+ Request</Button>
					</div>
					
					<div className="space-y-4">
						{team.materialRequests?.length === 0 ? (
							<p className="text-xs text-text-muted italic opacity-50">No material requests on record.</p>
						) : (
							team.materialRequests.map((req: any) => (
								<Card key={req.id} className="p-4 flex items-center justify-between bg-panel-2/30 border-white/5">
									<div>
										<p className="text-sm font-bold text-text-primary">{req.itemName}</p>
										<p className="text-[10px] text-text-muted uppercase tracking-widest">Qty: {req.quantity} • Est: ${req.estimatedCost}</p>
									</div>
									<span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
										req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
										req.status === "REJECTED" ? "bg-accent-urgency/10 text-accent-urgency border-accent-urgency/20" :
										"bg-amber-500/10 text-amber-500 border-amber-500/20"
									}`}>
										{req.status}
									</span>
								</Card>
							))
						)}
					</div>
				</div>

				{/* Fabrication */}
				<div className="flex-1 space-y-8">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted">Fabrication Jobs</h3>
						<Button size="sm" variant="ghost" onClick={() => setActiveForm("fabrication")}>+ New Job</Button>
					</div>

					<div className="space-y-4">
						{team.fabricationRequests?.length === 0 ? (
							<p className="text-xs text-text-muted italic opacity-50">No fabrication jobs active.</p>
						) : (
							team.fabricationRequests.map((job: any) => (
								<Card key={job.id} className="p-4 flex items-center justify-between bg-panel-2/30 border-white/5">
									<div>
										<p className="text-sm font-bold text-text-primary">{job.machineType.replace('PRINTER_', '')}</p>
										<p className="text-[10px] text-text-muted uppercase tracking-widest truncate max-w-[150px]">{job.modelFileUrl}</p>
									</div>
									<span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
										job.status === "APPROVED" || job.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
										job.status === "REJECTED" ? "bg-accent-urgency/10 text-accent-urgency border-accent-urgency/20" :
										"bg-blue-500/10 text-blue-400 border-blue-500/20"
									}`}>
										{job.status}
									</span>
								</Card>
							))
						)}
					</div>
				</div>
			</div>

			{/* Modal Overlays */}
			{activeForm === "material" && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<Card className="w-full max-w-lg p-8 space-y-6 bg-panel shadow-2xl">
						<h3 className="text-xl font-black">Request Materials</h3>
						<div className="space-y-4">
							<input placeholder="Item Name" value={matName} onChange={(e) => setMatName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none" />
							<div className="flex gap-4">
								<input type="number" placeholder="Qty" value={matQty} onChange={(e) => setMatQty(e.target.value)} className="w-24 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none" />
								<input type="number" placeholder="Est. Cost ($)" value={matCost} onChange={(e) => setMatCost(e.target.value)} className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none" />
							</div>
							<textarea placeholder="Justification / Link" value={matJustification} onChange={(e) => setMatJustification(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none h-24 resize-none" />
						</div>
						<div className="flex justify-end gap-4">
							<Button variant="ghost" onClick={() => setActiveForm(null)}>Cancel</Button>
							<Button disabled={isLoading} onClick={submitMaterial}>Submit Request</Button>
						</div>
					</Card>
				</div>
			)}

			{activeForm === "fabrication" && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<Card className="w-full max-w-lg p-8 space-y-6 bg-panel shadow-2xl">
						<h3 className="text-xl font-black">New Fabrication Job</h3>
						<div className="space-y-4">
							<select value={fabType} onChange={(e) => setFabType(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none">
								<option value="PRINTER_FDM">FDM 3D Printer</option>
								<option value="PRINTER_RESIN">Resin 3D Printer</option>
								<option value="CNC">CNC Router</option>
							</select>
							
							<FileUpload 
								teamId={team.id} 
								uploadType="fabrication" 
								accept=".stl,.dxf,.svg,.pdf"
								label={fabUrl ? "✅ File Ready" : "Upload Model (.stl, .dxf, .svg, .pdf)"}
								onUploadComplete={(data) => setFabUrl(data.url)}
							/>
							
							<textarea placeholder="Purpose / Component Name" value={fabPurpose} onChange={(e) => setFabPurpose(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none h-24 resize-none" />
						</div>
						<div className="flex justify-end gap-4">
							<Button variant="ghost" onClick={() => setActiveForm(null)}>Cancel</Button>
							<Button disabled={isLoading || !fabUrl} onClick={submitFabrication}>
								{isLoading ? "Transmitting..." : "Send to Lab"}
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
