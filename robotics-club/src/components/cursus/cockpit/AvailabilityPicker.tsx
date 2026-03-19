"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSound } from "@/components/providers/SoundProvider";

interface AvailabilityWindow {
	startTime: Date;
	endTime: Date;
}

interface AvailabilityPickerProps {
	teamId: string;
	onSuccess: () => void;
}

export function AvailabilityPicker({ teamId, onSuccess }: AvailabilityPickerProps) {
	const { toast } = useToast();
	const { playSFX } = useSound();
	
	// Core state
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [pendingWindows, setPendingWindows] = useState<AvailabilityWindow[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Dragging state
	const [dragRange, setDragRange] = useState<{ dayIdx: number, startH: number, endH: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Precision inputs (synced with drag or manual)
	const [manualStart, setManualStart] = useState("09:00");
	const [manualEnd, setManualEnd] = useState("11:00");

	// Get current week dates (Mon-Sun)
	const getWeekDates = (baseDate: Date) => {
		const date = new Date(baseDate);
		const day = (date.getDay() + 6) % 7; // 0=Mon, 6=Sun
		const mon = new Date(date);
		mon.setDate(date.getDate() - day);
		
		return Array.from({ length: 7 }).map((_, i) => {
			const d = new Date(mon);
			d.setDate(mon.getDate() + i);
			return d;
		});
	};

	const weekDates = getWeekDates(selectedDate);
	const weekRangeHeader = `${weekDates[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })} — ${weekDates[6].toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;

	// Mouse handlers for Grid
	const handleMouseDown = (dayIdx: number, hour: number) => {
		setIsDragging(true);
		setDragRange({ dayIdx, startH: hour, endH: hour + 1 });
		// Sync manual selectedDate to the day clicked in matrix for better manual override flow
		setSelectedDate(weekDates[dayIdx]);
		playSFX("button");
	};

	const handleMouseMove = (hour: number) => {
		if (!isDragging || !dragRange) return;
		const newEnd = Math.max(dragRange.startH + 0.5, hour + 0.5);
		setDragRange({ ...dragRange, endH: newEnd });
	};

	const handleMouseUp = () => {
		if (!isDragging || !dragRange) return;
		setIsDragging(false);
		
		const targetDate = weekDates[dragRange.dayIdx];
		const start = new Date(targetDate);
		start.setHours(Math.floor(dragRange.startH), (dragRange.startH % 1) * 60, 0, 0);
		
		const end = new Date(targetDate);
		end.setHours(Math.floor(dragRange.endH), (dragRange.endH % 1) * 60, 0, 0);

		// Validation
		const now = new Date();
		if (start < now) {
			setDragRange(null);
			return toast("Cannot add windows in the past", "error");
		}
		if (end.getTime() - start.getTime() < 1 * 60 * 60 * 1000) {
			setDragRange(null);
			return toast("Minimum window is 1 hour", "error");
		}

		const overlap = pendingWindows.some(w => (start < w.endTime && end > w.startTime));
		if (overlap) {
			setDragRange(null);
			return toast("Window overlaps with existing draft", "error");
		}

		setPendingWindows([...pendingWindows, { startTime: start, endTime: end }]);
		setDragRange(null);
		playSFX("achievement");
	};

	const addManualWindow = () => {
		const start = new Date(selectedDate);
		const [sH, sM] = manualStart.split(":").map(Number);
		start.setHours(sH, sM, 0, 0);

		const end = new Date(selectedDate);
		const [eH, eM] = manualEnd.split(":").map(Number);
		end.setHours(eH, eM, 0, 0);

		const now = new Date();
		if (start < now) return toast("Cannot add windows in the past", "error");
		if (end <= start) return toast("End time must be after start time", "error");
		if (end.getTime() - start.getTime() < 1 * 60 * 60 * 1000) return toast("Minimum window is 1 hour", "error");

		const overlap = pendingWindows.some(w => (start < w.endTime && end > w.startTime));
		if (overlap) return toast("Window overlaps", "error");

		setPendingWindows([...pendingWindows, { startTime: start, endTime: end }]);
		playSFX("achievement");
	};

	const removeWindow = (idx: number) => {
		setPendingWindows(pendingWindows.filter((_, i) => i !== idx));
	};

	const submitAvailability = async () => {
		if (pendingWindows.length === 0) return;
		setIsSubmitting(true);
		try {
			const res = await fetch("/api/evaluations/availability", {
				method: "POST",
				body: JSON.stringify({ teamId, windows: pendingWindows.map(w => ({ startTime: w.startTime.toISOString(), endTime: w.endTime.toISOString() })) })
			});

			if (res.ok) {
				toast("Availability broadcasted!", "success");
				playSFX("achievement");
				setPendingWindows([]);
				onSuccess();
			} else {
				const data = await res.json();
				toast(data.error || "Failed to set availability", "error");
			}
		} catch (err) {
			toast("Network error", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const timeOptions = Array.from({ length: 48 }, (_, i) => {
		const h = Math.floor(i / 2).toString().padStart(2, '0');
		const m = (i % 2 === 0 ? "00" : "30");
		return `${h}:${m}`;
	});

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto" onMouseLeave={handleMouseUp}>
			
			{/* TOP BAR: PRECISION CONTROLS */}
			<Card className="p-4 bg-panel/60 border-accent/20 flex flex-wrap items-center justify-between gap-6">
				<div className="flex items-center gap-6">
					<div className="space-y-1">
						<h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Active Week</h4>
						<p className="text-sm font-bold text-white">{weekRangeHeader}</p>
					</div>
					<div className="flex border border-white/5 rounded-lg overflow-hidden">
						<button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); }} className="px-3 py-1 bg-panel2 hover:bg-panel transition-colors border-r border-white/5">←</button>
						<button onClick={() => setSelectedDate(new Date())} className="px-3 py-1 bg-panel2 hover:bg-panel text-[10px] font-bold uppercase tracking-widest">Today</button>
						<button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); }} className="px-3 py-1 bg-panel2 hover:bg-panel transition-colors border-l border-white/5">→</button>
					</div>
				</div>

				<div className="flex items-center gap-4 bg-panel-2/50 p-2 rounded-xl border border-white/5">
					<div className="flex items-center gap-2">
						<span className="text-[9px] font-bold text-text-muted uppercase">From</span>
						<select value={manualStart} onChange={e => setManualStart(e.target.value)} className="bg-background border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 ring-accent">
							{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
						</select>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-[9px] font-bold text-text-muted uppercase">To</span>
						<select value={manualEnd} onChange={e => setManualEnd(e.target.value)} className="bg-background border border-white/10 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 ring-accent">
							{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
						</select>
					</div>
					<Button variant="primary" size="sm" onClick={addManualWindow} className="px-4">Add Manual</Button>
				</div>
			</Card>

			<div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
				
				{/* MAIN INTERACTIVE MATRIX */}
				<Card className="relative overflow-hidden border-white/5 bg-panel-2/30">
					<div className="p-4 border-b border-white/5 flex items-center justify-between bg-panel/40">
						<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Drag to set availability (1h Min)</h4>
						<p className="text-[9px] font-black uppercase tracking-widest opacity-50">Local: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
					</div>

					<div className="relative overflow-hidden select-none">
						{/* Grid Header */}
						<div className="grid grid-cols-[60px_repeat(7,1fr)] bg-panel/30 border-b border-white/5">
							<div className="p-2" />
							{weekDates.map((date, idx) => (
								<div key={idx} className={`p-3 text-center border-l border-white/5 transition-colors ${date.toDateString() === new Date().toDateString() ? 'bg-accent/5' : ''}`}>
									<p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
										{date.toLocaleDateString('default', { weekday: 'short' })}
									</p>
									<p className={`text-sm font-bold mt-1 ${date.toDateString() === new Date().toDateString() ? 'text-accent' : 'text-white'}`}>
										{date.getDate()}
									</p>
								</div>
							))}
						</div>

						{/* Scrollable Grid Body */}
						<div className="relative h-[600px] overflow-y-auto no-scrollbar" onMouseUp={handleMouseUp}>
							<div className="grid grid-cols-[60px_repeat(7,1fr)] min-h-full">
								{/* Time Labels */}
								<div className="border-r border-white/5 bg-panel/30 sticky left-0 z-20">
									{Array.from({ length: 24 }).map((_, h) => (
										<div key={h} className="h-[50px] px-2 text-[9px] font-mono text-text-muted/60 flex items-start pt-1 border-b border-white/5 relative">
											{h.toString().padStart(2, '0')}:00
										</div>
									))}
								</div>

								{/* Day Columns */}
								{Array.from({ length: 7 }).map((_, dayIdx) => (
									<div key={dayIdx} className="relative border-r border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group">
										{/* Internal Hour Slots (Clickable) */}
										{Array.from({ length: 24 }).map((_, h) => (
											<div 
												key={h} 
												className="h-[50px] border-b border-white/5 last:border-0 cursor-crosshair active:bg-accent/5" 
												onMouseDown={() => handleMouseDown(dayIdx, h)}
												onMouseMove={() => handleMouseMove(h)}
											/>
										))}

										{/* Active Drag Preview */}
										{dragRange && dragRange.dayIdx === dayIdx && (
											<div 
												className="absolute left-1 right-1 rounded-lg bg-accent/40 border-2 border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] z-10 flex flex-col items-center justify-center p-2 pointer-events-none animate-in fade-in zoom-in-95 duration-75"
												style={{ top: `${dragRange.startH * 50}px`, height: `${(dragRange.endH - dragRange.startH) * 50}px` }}
											>
												<span className="text-[10px] font-black text-white uppercase drop-shadow-md">
													{dragRange.endH - dragRange.startH}H Selection
												</span>
											</div>
										)}

										{/* Saved Drafts */}
										{pendingWindows.filter(w => w.startTime.toDateString() === weekDates[dayIdx].toDateString())
										.map((w, bi) => {
											const start = w.startTime.getHours() + w.startTime.getMinutes() / 60;
											const end = w.endTime.getHours() + w.endTime.getMinutes() / 60;
											return (
												<div 
													key={bi}
													className="absolute left-1 right-1 rounded-lg bg-accent/20 border border-accent/40 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] flex flex-col items-center justify-center p-1 group overflow-hidden hover:bg-accent/30 transition-all z-0"
													style={{ top: `${start * 50}px`, height: `${(end - start) * 50}px` }}
												>
													<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
														<button onClick={(e) => { e.stopPropagation(); removeWindow(pendingWindows.indexOf(w)); }} className="text-accent hover:text-white drop-shadow-md">✕</button>
													</div>
													<span className="text-[8px] font-black text-accent uppercase">{w.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
													<div className="h-px w-2 bg-accent/40 my-0.5" />
													<span className="text-[8px] font-black text-accent uppercase">{w.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
												</div>
											);
										})}
									</div>
								))}
							</div>
						</div>
					</div>
				</Card>

				{/* SIDEBAR: DRAFT LIST & SUBMIT */}
				<div className="space-y-6">
					<Card className="p-6 bg-panel/40 border-white/5 space-y-4">
						<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Squad Draft</h4>
						<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
							{pendingWindows.length === 0 ? (
								<p className="text-xs text-text-muted italic opacity-40 text-center py-8">Drag on the matrix to draft availability ranges.</p>
							) : (
								pendingWindows.sort((a,b) => a.startTime.getTime() - b.startTime.getTime()).map((w, idx) => (
									<div key={idx} className="bg-panel2 p-3 rounded-xl border border-white/5 group hover:border-accent/30 transition-all">
										<div className="flex items-center justify-between mb-1">
											<span className="text-[10px] font-black text-accent uppercase tracking-widest">
												{w.startTime.toLocaleDateString('default', { weekday: 'short', day: 'numeric' })}
											</span>
											<button onClick={() => removeWindow(idx)} className="text-[10px] text-text-muted hover:text-accent-urgency opacity-0 group-hover:opacity-100 transition-all">✕</button>
										</div>
										<p className="text-xs font-bold text-white">
											{w.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} — {w.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
										</p>
									</div>
								))
							)}
						</div>
						<Button className="w-full mt-4" size="lg" disabled={pendingWindows.length === 0 || isSubmitting} onClick={submitAvailability}>
							{isSubmitting ? "Broadcasting..." : "Broadcast Selection"}
						</Button>
					</Card>

					<div className="p-4 bg-accent/5 rounded-2xl border border-accent/20">
						<div className="flex gap-3 items-start">
							<div className="mt-1 h-3 w-3 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
							<div className="space-y-1">
								<p className="text-[10px] font-black text-accent uppercase tracking-widest">Evaluator Visibility</p>
								<p className="text-[9px] text-text-muted leading-tight">These windows will be immediately visible to available evaluators once broadcasted.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
