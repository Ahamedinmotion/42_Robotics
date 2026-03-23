"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";

interface Photo {
	url: string;
	weekNumber: number;
	milestoneTitle?: string;
}

interface PhotoTimelineProps {
	reports: any[];
}

export function PhotoTimeline({ reports }: PhotoTimelineProps) {
	const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

	const allPhotos: Photo[] = reports
		.filter(r => r.photoUrls && r.photoUrls.length > 0)
		.flatMap(r => r.photoUrls.map((url: string) => ({
			url,
			weekNumber: r.weekNumber,
			milestoneTitle: r.milestoneTitle
		})));

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") setSelectedPhoto(null);
		if (e.key === "ArrowLeft") {
			setSelectedPhoto(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
		}
		if (e.key === "ArrowRight") {
			setSelectedPhoto(prev => (prev !== null && prev < allPhotos.length - 1 ? prev + 1 : prev));
		}
	};

	useEffect(() => {
		if (selectedPhoto !== null) {
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [selectedPhoto, handleKeyDown]); // Added handleKeyDown to deps

	if (allPhotos.length === 0) return null;

	// Cloudinary transformation for thumbnails
	const getThumb = (url: string) => {
		if (!url.includes("cloudinary.com")) return url;
		return url.replace("/upload/", "/upload/w_200,h_150,c_fill,g_auto/");
	};

	return (
		<div className="space-y-6">
			<h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Mission Archives / Photo Timeline</h3>
			
			<div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
				{allPhotos.map((photo, idx) => (
					<div 
						key={`${photo.url}-${idx}`}
						onClick={() => setSelectedPhoto(idx)}
						className="relative h-[120px] w-[160px] shrink-0 rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-accent/40 transition-all snap-start group"
					>
						<Image 
							src={getThumb(photo.url)} 
							alt={`Week ${photo.weekNumber}`} 
							fill 
							className="object-cover group-hover:scale-110 transition-transform duration-500" 
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
							<p className="text-[8px] font-black uppercase tracking-widest text-accent">Week {photo.weekNumber}</p>
							{photo.milestoneTitle && (
								<p className="text-[10px] font-bold text-white truncate">{photo.milestoneTitle}</p>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Lightbox */}
			{selectedPhoto !== null && (
				<div 
					className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
					onClick={() => setSelectedPhoto(null)}
				>
					<button className="absolute top-8 right-8 text-white/40 hover:text-white text-3xl transition-colors">✕</button>
					
					<div 
						className="relative w-full max-w-5xl aspect-video"
						onClick={(e) => e.stopPropagation()}
					>
						<Image 
							src={allPhotos[selectedPhoto].url} 
							alt="Evidence" 
							fill 
							className="object-contain" 
						/>

						{/* Navigation */}
						{selectedPhoto > 0 && (
							<button 
								onClick={() => setSelectedPhoto(selectedPhoto - 1)}
								className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
							>
								←
							</button>
						)}
						{selectedPhoto < allPhotos.length - 1 && (
							<button 
								onClick={() => setSelectedPhoto(selectedPhoto + 1)}
								className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
							>
								→
							</button>
						)}
					</div>

					<div className="mt-8 text-center space-y-2">
						<p className="text-xs font-black uppercase tracking-[0.3em] text-accent">Week {allPhotos[selectedPhoto].weekNumber}</p>
						{allPhotos[selectedPhoto].milestoneTitle && (
							<h4 className="text-xl font-black text-white">{allPhotos[selectedPhoto].milestoneTitle}</h4>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
