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
	const [activeForm, setActiveForm] = useState<"material" | "fabrication" | "checkout" | null>(null);
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

	// Checkout Form State
	const [checkOutItem, setCheckOutItem] = useState("");
	const [checkOutQty, setCheckOutQty] = useState("1");
	const [checkOutReturnDate, setCheckOutReturnDate] = useState("");

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

	const handleCheckOut = async () => {
		if (!checkOutItem || !checkOutReturnDate) return;
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/checkout`, {
				method: "POST",
				body: JSON.stringify({
					itemName: checkOutItem,
					quantity: parseInt(checkOutQty),
					expectedReturnAt: checkOutReturnDate,
				}),
			});
			if (res.ok) {
				toast("Item checked out successfully!", "success");
				playSFX("achievement");
				setActiveForm(null);
				window.location.reload();
			}
		} catch (err) {
			toast("Failed to check out item", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCheckIn = async (checkoutId: string) => {
		setIsLoading(true);
		try {
			const res = await fetch(`/api/teams/${team.id}/checkout/${checkoutId}`, {
				method: "PATCH",
			});
			if (res.ok) {
				toast("Item checked back in!", "success");
				playSFX("achievement");
				window.location.reload();
			}
		} catch (err) {
			toast("Failed to return item", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const activeCheckouts = team.checkouts?.filter((c: any) => c.status === "OUT") || [];

	return (
		<div className="space-y-16">
			{/* Row 1: Library & Tools (Checkouts) */}
			<section className="space-y-8">
				<div className="flex items-center justify-between border-b border-white/5 pb-4">
					<div className="space-y-1">
						<h3 className="text-xl font-black text-text-primary tracking-tight">Library & Hardware</h3>
						<p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">Tooling • Sensors • Reusable Components</p>
					</div>
					<Button size="sm" variant="primary" onClick={() => setActiveForm("checkout")} className="bg-emerald-500 hover:bg-emerald-400 text-background">
						+ Check Out Tool
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{activeCheckouts.length === 0 ? (
						<div className="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-white/5 bg-panel-2/10">
							<p className="text-sm text-text-muted italic opacity-50 font-medium">No active hardware loans.</p>
						</div>
					) : (
						activeCheckouts.map((checkout: any) => (
							<Card key={checkout.id} className="p-6 space-y-4 bg-panel-2/30 border-white/5 hover:border-emerald-500/30 transition-all group">
								<div className="flex justify-between items-start">
									<div className="space-y-1">
										<p className="text-lg font-black text-text-primary group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{checkout.itemName}</p>
										<p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Quantity: {checkout.quantity}</p>
									</div>
									<div className="text-right">
										<p className="text-[9px] font-black text-accent-urgency uppercase tracking-widest">Due by</p>
										<p className="text-xs font-black text-text-primary">
											{new Date(checkout.expectedReturnAt).toLocaleDateString()}
										</p>
									</div>
								</div>

								<div className="flex items-center gap-2 pt-2 border-t border-white/5">
									<div className="h-6 w-6 rounded-full overflow-hidden border border-white/10">
										<img src={checkout.user?.image || `https://ui-avatars.com/api/?name=${checkout.user?.login}`} alt="" className="h-full w-full object-cover" />
									</div>
									<p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
										Held by <span className="text-text-primary">{checkout.user?.login}</span>
									</p>
								</div>

								<Button 
									variant="ghost" 
									size="sm" 
									className="w-full text-[10px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10"
									onClick={() => handleCheckIn(checkout.id)}
									disabled={isLoading}
								>
									{isLoading ? "PROCESING..." : "Check Back In"}
								</Button>
							</Card>
						))
					)}
				</div>
			</section>

			{/* Row 2: Material Requests & Fabrication */}
			<div className="flex flex-col xl:flex-row gap-12">
				{/* Inventory & Requests */}
				<div className="flex-1 space-y-8">
					<div className="flex items-center justify-between border-b border-white/5 pb-4">
						<div className="space-y-1">
							<h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Mission Consumables</h3>
							<p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Resistors • Filaments • Raw Materials</p>
						</div>
						<Button size="sm" variant="ghost" onClick={() => setActiveForm("material")} className="text-[10px] font-black uppercase tracking-widest">+ Allocate</Button>
					</div>
					
					<div className="space-y-3">
						{team.materialRequests?.length === 0 ? (
							<p className="text-xs text-text-muted italic opacity-50 p-4 rounded-xl border border-white/5 bg-panel-2/10">No consumables requested.</p>
						) : (
							team.materialRequests.map((req: any) => (
								<Card key={req.id} className="p-4 flex items-center justify-between bg-panel-2/30 border-white/5 hover:bg-panel-2/50 transition-colors">
									<div>
										<p className="text-sm font-black text-text-primary uppercase tracking-tight">{req.itemName}</p>
										<p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Qty: {req.quantity} • {req.estimatedCost ? `$${req.estimatedCost}` : 'Free'}</p>
									</div>
									<span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
										req.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
										req.status === "REJECTED" ? "bg-accent-urgency/10 text-accent-urgency border-accent-urgency/20" :
										"bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
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
					<div className="flex items-center justify-between border-b border-white/5 pb-4">
						<div className="space-y-1">
							<h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Forge / Fabrication</h3>
							<p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">3D Printing • Laser • CNC</p>
						</div>
						<Button size="sm" variant="ghost" onClick={() => setActiveForm("fabrication")} className="text-[10px] font-black uppercase tracking-widest">+ New Job</Button>
					</div>

					<div className="space-y-3">
						{team.fabricationRequests?.length === 0 ? (
							<p className="text-xs text-text-muted italic opacity-50 p-4 rounded-xl border border-white/5 bg-panel-2/10">No active forge sequences.</p>
						) : (
							team.fabricationRequests.map((job: any) => (
								<Card key={job.id} className="p-4 flex items-center justify-between bg-panel-2/30 border-white/5 hover:bg-panel-2/50 transition-colors">
									<div>
										<p className="text-sm font-black text-text-primary uppercase tracking-tight">{job.machineType.replace('PRINTER_', '')}</p>
										<p className="text-[9px] text-text-muted font-bold uppercase tracking-widest truncate max-w-[200px]">{job.modelFileUrl?.split('/').pop()}</p>
									</div>
									<span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
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
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setActiveForm(null)}>
					<Card className="w-full max-w-lg p-10 space-y-8 bg-panel border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
						<div className="space-y-1">
							<h3 className="text-2xl font-black text-text-primary tracking-tighter uppercase">Allocate Consumables</h3>
							<p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Permanent Mission Assets</p>
						</div>
						<div className="space-y-5">
							<div className="space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Component Name</label>
								<input placeholder="e.g. ESP32-WROOM-32" value={matName} onChange={(e) => setMatName(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none transition-all" />
							</div>
							<div className="flex gap-5">
								<div className="w-32 space-y-1.5">
									<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Quantity</label>
									<input type="number" placeholder="1" value={matQty} onChange={(e) => setMatQty(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none" />
								</div>
								<div className="flex-1 space-y-1.5">
									<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Estimated Unit Cost ($)</label>
									<input type="number" placeholder="0.00" value={matCost} onChange={(e) => setMatCost(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none" />
								</div>
							</div>
							<div className="space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Justification</label>
								<textarea placeholder="Why does the mission require this?" value={matJustification} onChange={(e) => setMatJustification(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none h-28 resize-none" />
							</div>
						</div>
						<div className="flex justify-end gap-4 pt-4">
							<Button variant="ghost" onClick={() => setActiveForm(null)} className="text-[10px] font-black uppercase tracking-widest px-8">Abort</Button>
							<Button disabled={isLoading || !matName} onClick={() => submitMaterial()} className="text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded-2xl">Confirm Req</Button>
						</div>
					</Card>
				</div>
			)}

			{activeForm === "checkout" && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setActiveForm(null)}>
					<Card className="w-full max-w-lg p-10 space-y-8 bg-panel border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
						<div className="space-y-1">
							<h3 className="text-2xl font-black text-text-primary tracking-tighter uppercase">Hardware Loan Init</h3>
							<p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Temporary Field Equipment</p>
						</div>
						<div className="space-y-5">
							<div className="space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Item Name / ID</label>
								<input 
									placeholder="e.g. Digital Multimeter X-200" 
									value={checkOutItem} 
									onChange={(e) => setCheckOutItem(e.target.value)} 
									className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none transition-all" 
								/>
							</div>
							<div className="flex gap-5">
								<div className="w-32 space-y-1.5">
									<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Quantity</label>
									<input type="number" placeholder="1" value={checkOutQty} onChange={(e) => setCheckOutQty(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none" />
								</div>
								<div className="flex-1 space-y-1.5">
									<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Expected Return Date</label>
									<input 
										type="date" 
										value={checkOutReturnDate} 
										onChange={(e) => setCheckOutReturnDate(e.target.value)} 
										className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none text-text-primary" 
									/>
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-4 pt-4">
							<Button variant="ghost" onClick={() => setActiveForm(null)} className="text-[10px] font-black uppercase tracking-widest px-8">Cancel</Button>
							<Button 
								disabled={isLoading || !checkOutItem || !checkOutReturnDate} 
								onClick={() => handleCheckOut()} 
								className="text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded-2xl bg-emerald-500 text-background hover:bg-emerald-400"
							>
								{isLoading ? "AUTHORIZING..." : "Check Out"}
							</Button>
						</div>
					</Card>
				</div>
			)}

			{activeForm === "fabrication" && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={() => setActiveForm(null)}>
					<Card className="w-full max-w-lg p-10 space-y-8 bg-panel border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
						<div className="space-y-1">
							<h3 className="text-2xl font-black text-text-primary tracking-tighter uppercase">Forge Sequence</h3>
							<p className="text-[10px] text-text-muted font-black uppercase tracking-widest">New Fabrication Job</p>
						</div>
						<div className="space-y-6">
							<div className="space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Fabrication Type</label>
								<select value={fabType} onChange={(e) => setFabType(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none">
									<option value="PRINTER_FDM">FDM 3D Printer</option>
									<option value="PRINTER_RESIN">Resin 3D Printer</option>
									<option value="CNC">CNC Router</option>
								</select>
							</div>
							
							<div className="space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Technical Specification</label>
								<FileUpload 
									teamId={team.id} 
									uploadType="fabrication" 
									accept=".stl,.dxf,.svg,.pdf"
									label={fabUrl ? "SPECIFICATION LOCKED" : "Upload CAD/Vector Model"}
									onUploadComplete={(data) => setFabUrl(data.url)}
								/>
							</div>
							
							<div className="space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-1">Component Purpose</label>
								<textarea placeholder="Describe the component's role in the mission..." value={fabPurpose} onChange={(e) => setFabPurpose(e.target.value)} className="w-full bg-background/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-accent/20 outline-none h-24 resize-none" />
							</div>
						</div>
						<div className="flex justify-end gap-4 pt-4">
							<Button variant="ghost" onClick={() => setActiveForm(null)} className="text-[10px] font-black uppercase tracking-widest px-8">Abort</Button>
							<Button disabled={isLoading || !fabUrl} onClick={() => submitFabrication()} className="text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded-2xl">
								{isLoading ? "TRANSMITTING..." : "Send to Forge"}
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
