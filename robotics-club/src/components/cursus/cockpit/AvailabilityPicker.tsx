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
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [startTime, setStartTime] = useState("09:00");
	const [endTime, setEndTime] = useState("11:00");
	const [pendingWindows, setPendingWindows] = useState<AvailabilityWindow[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Get current month dates
	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		
		const days = [];
		// Padding for start of month
		for (let i = 0; i < firstDay; i++) days.push(null);
		for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
		
		return days;
	};

	const addWindow = () => {
		const start = new Date(selectedDate);
		const [sH, sM] = startTime.split(":").map(Number);
		start.setHours(sH, sM, 0, 0);

		const end = new Date(selectedDate);
		const [eH, eM] = endTime.split(":").map(Number);
		end.setHours(eH, eM, 0, 0);

		const now = new Date();
		if (start < now) {
			return toast("Cannot add windows in the past", "error");
		}

		if (end.getTime() - start.getTime() < 2 * 60 * 60 * 1000) {
			return toast("Minimum window is 2 hours", "error");
		}

		// Check for local overlap
		const overlap = pendingWindows.some(w => 
			(start < w.endTime && end > w.startTime)
		);
		if (overlap) return toast("Window overlaps with a pending range", "error");

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
				body: JSON.stringify({
					teamId,
					windows: pendingWindows.map(w => ({
						startTime: w.startTime.toISOString(),
						endTime: w.endTime.toISOString(),
					}))
				})
			});

			if (res.ok) {
				toast("Availability ranges broadcasted!", "success");
				playSFX("achievement");
				setPendingWindows([]);
				onSuccess();
			} else {
				const data = await res.json();
				toast(data.message || "Failed to set availability", "error");
			}
		} catch (err) {
			toast("Network error", "error");
		} finally {
			setIsSubmitting(false);
		}
	};

	const days = getDaysInMonth(selectedDate);
	const timeOptions = Array.from({ length: 48 }, (_, i) => {
		const h = Math.floor(i / 2).toString().padStart(2, '0');
		const m = (i % 2 === 0 ? "00" : "30");
		return `${h}:${m}`;
	});

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* 1. DATE SELECTOR */}
				<Card className="p-6 bg-panel/40 border-white/5 space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Phase 1: Select Dates</h4>
						<p className="text-xs font-bold">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
					</div>

					<div className="grid grid-cols-7 gap-1">
						{['S','M','T','W','T','F','S'].map(d => (
							<div key={d} className="text-center text-[10px] font-black opacity-30 h-8 flex items-center justify-center">{d}</div>
						))}
						{days.map((day, i) => {
							if (!day) return <div key={`empty-${i}`} className="h-10" />;
							const isToday = day.toDateString() === new Date().toDateString();
							const isSelected = day.toDateString() === selectedDate.toDateString();
							const isPast = day < new Date(new Date().setHours(0,0,0,0));

							return (
								<button
									key={day.toISOString()}
									disabled={isPast}
									onClick={() => setSelectedDate(day)}
									className={`h-10 w-full rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center relative overflow-hidden group
										${isSelected ? 'bg-accent text-black scale-105 shadow-lg shadow-accent/20' : 
										  isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5'}
										${isToday && !isSelected ? 'border border-accent/40' : ''}
									`}
								>
									{day.getDate()}
									{isToday && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
								</button>
							);
						})}
					</div>
				</Card>

				{/* 2. TIME RANGE SELECTOR */}
				<Card className="p-6 bg-panel/40 border-white/5 space-y-6">
					<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Phase 2: Define Range</h4>
					
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<div className="flex-1 space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Start Time</label>
								<select 
									value={startTime} 
									onChange={(e) => setStartTime(e.target.value)}
									className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none"
								>
									{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
								</select>
							</div>
							<div className="flex-1 space-y-1.5">
								<label className="text-[9px] font-black uppercase tracking-widest text-text-muted">End Time</label>
								<select 
									value={endTime} 
									onChange={(e) => setEndTime(e.target.value)}
									className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-accent/20 outline-none"
								>
									{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
								</select>
							</div>
						</div>

						<div className="h-12 w-full bg-panel-2 rounded-xl border border-white/5 relative overflow-hidden">
							{/* Visual Progress Bar for Day */}
							<div className="absolute inset-0 bg-white/5 grid grid-cols-24 divide-x divide-white/5" />
							{(() => {
								const [sH, sM] = startTime.split(":").map(Number);
								const [eH, eM] = endTime.split(":").map(Number);
								const sPos = ((sH + sM / 60) / 24) * 100;
								const ePos = ((eH + eM / 60) / 24) * 100;
								return (
									<div 
										className="absolute inset-y-0 bg-accent/20 border-x border-accent/40 flex items-center justify-center"
										style={{ left: `${sPos}%`, right: `${100 - ePos}%` }}
									>
										<span className="text-[8px] font-black uppercase text-accent truncate px-2">Preview</span>
									</div>
								);
							})()}
						</div>

						<Button className="w-full" onClick={addWindow}>
							Add Range to Draft
						</Button>
					</div>
				</Card>
			</div>

			{/* 3. PENDING RANGES */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Squad Draft / Availability Windows</h4>
					<p className="text-[9px] font-black uppercase tracking-widest opacity-50">Local Time: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
				</div>

				<div className="flex flex-wrap gap-3">
					{pendingWindows.length === 0 ? (
						<p className="text-xs text-text-muted italic opacity-40 py-4">No ranges drafted yet. Select dates and times above.</p>
					) : (
						pendingWindows.map((w, idx) => (
							<div 
								key={idx}
								className="bg-panel px-4 py-3 rounded-2xl border border-accent/20 flex items-center gap-4 animate-in zoom-in-95 duration-200"
							>
								<div className="space-y-0.5">
									<p className="text-[10px] font-black uppercase tracking-widest text-accent">
										{w.startTime.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
									</p>
									<p className="text-xs font-bold text-white">
										{w.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} 
										— 
										{w.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
									</p>
								</div>
								<button 
									onClick={() => removeWindow(idx)}
									className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors"
								>
									✕
								</button>
							</div>
						))
					)}
				</div>

				{pendingWindows.length > 0 && (
					<div className="pt-8 border-t border-white/5 flex justify-end">
						<Button size="lg" disabled={isSubmitting} onClick={submitAvailability}>
							{isSubmitting ? "Broadcasting..." : "Confirm & Open for Evaluation"}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
