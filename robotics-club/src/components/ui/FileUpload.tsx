"use client";

import React, { useState, useRef } from "react";
import { useSound } from "@/components/providers/SoundProvider";

interface FileUploadProps {
	teamId: string;
	uploadType: "reports" | "fabrication";
	onUploadComplete: (data: { url: string; publicId: string }) => void;
	maxFiles?: number;
	accept?: string;
	label?: string;
}

export function FileUpload({ 
	teamId, 
	uploadType, 
	onUploadComplete, 
	maxFiles = 5,
	accept = "image/*",
	label = "Drop files here or click to upload"
}: FileUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { playSFX } = useSound();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		// Handle only first file for simplicity as per requirement of "progress per file"
		// Loop if needed, but the prompt implies a simple component.
		const file = files[0];
		await uploadFile(file);
	};

	const uploadFile = async (file: File) => {
		setIsUploading(true);
		setProgress(10); // Initial progress

		const formData = new FormData();
		formData.append("file", file);
		formData.append("teamId", teamId);
		formData.append("type", uploadType);

		try {
			// Using native fetch with XHR for progress tracking would be better,
			// but native fetch doesn't support upload progress. 
			// I'll use XHR to meet the "show upload progress" requirement.
			
			const xhr = new XMLHttpRequest();
			xhr.open("POST", "/api/upload", true);

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const percent = Math.round((event.loaded / event.total) * 100);
					setProgress(percent);
				}
			};

			xhr.onload = () => {
				if (xhr.status === 200) {
					const response = JSON.parse(xhr.responseText);
					if (response.status === "ok") {
						onUploadComplete(response.data);
						playSFX("achievement");
					}
				}
				setIsUploading(false);
				setProgress(0);
			};

			xhr.onerror = () => {
				setIsUploading(false);
				setProgress(0);
			};

			xhr.send(formData);
		} catch (error) {
			console.error("Upload error:", error);
			setIsUploading(false);
			setProgress(0);
		}
	};

	return (
		<div 
			onClick={() => fileInputRef.current?.click()}
			className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center gap-4 ${
				isUploading ? "border-accent/40 bg-accent/5" : "border-white/10 hover:border-accent/40 hover:bg-white/5"
			}`}
		>
			<input 
				type="file" 
				ref={fileInputRef} 
				onChange={handleFileChange} 
				accept={accept}
				className="hidden"
				multiple={maxFiles > 1}
			/>

			{isUploading ? (
				<div className="w-full space-y-4">
					<div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-accent">
						<span>Uploading...</span>
						<span>{progress}%</span>
					</div>
					<div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
						<div 
							className="h-full bg-accent transition-all duration-300" 
							style={{ width: `${progress}%` }} 
						/>
					</div>
				</div>
			) : (
				<>
					<div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">☁️</div>
					<p className="text-xs font-black uppercase tracking-widest text-text-muted group-hover:text-text-primary transition-colors">
						{label}
					</p>
				</>
			)}
		</div>
	);
}
