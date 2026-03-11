"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/Button";

interface ProfileCardProps {
	user: {
		id: string;
		name: string;
		login: string;
		avatar: string | null;
		currentRank: string;
		joinedAt: string | Date;
		skillProgress: { skillTag: string; projectsCompleted: number }[];
		completedProjects: number;
	};
}

const RANK_COLOURS: Record<string, string> = {
	E: "#888888", D: "#44AAFF", C: "#44FF88",
	B: "#FFD700", A: "#FF6B00", S: "#CC44FF",
};

function formatSince(date: Date | string) {
	const d = new Date(date);
	const month = d.toLocaleString("en-US", { month: "short" });
	const year = d.getFullYear();
	return `Since ${month} ${year}`;
}

export function ProfileCard({ user }: ProfileCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/profile/${user.id}` : "";

	const handleDownload = async () => {
		if (!cardRef.current) return;
		try {
			const canvas = await html2canvas(cardRef.current, {
				scale: 2,
				backgroundColor: "#0A0806",
				useCORS: true,
			});
			const link = document.createElement("a");
			link.download = `rc-card-${user.login}.png`;
			link.href = canvas.toDataURL("image/png");
			link.click();
		} catch (err) {
			console.error("Failed to generate card:", err);
		}
	};

	const topSkills = user.skillProgress.slice(0, 3);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="group flex h-8 w-8 items-center justify-center rounded-lg border border-border-color bg-panel2/50 transition-all hover:border-accent hover:bg-accent/10 active:scale-95"
				title="Digital ID Card"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="h-4 w-4 text-text-muted transition-colors group-hover:text-accent"
				>
					<rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
					<line x1="2" y1="10" x2="22" y2="10" />
					<line x1="7" y1="15" x2="7.01" y2="15" />
					<line x1="11" y1="15" x2="13" y2="15" />
				</svg>
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
					<div className="w-full max-w-[420px] rounded-2xl border border-border-color bg-panel p-6 shadow-2xl">
						<h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-text-muted">
							Profile Card
						</h3>

						{/* THE CARD */}
						<div className="flex justify-center overflow-auto">
							<div
								ref={cardRef}
								style={{
									width: "380px",
									height: "220px",
									backgroundColor: "#0A0806",
									border: "1px solid #2A2218",
									borderRadius: "12px",
									padding: "24px",
									fontFamily: "system-ui, -apple-system, sans-serif",
									display: "flex",
									flexDirection: "column",
									position: "relative",
								}}
							>
								<div className="flex flex-1 gap-4">
									{/* Left Column */}
									<div className="flex flex-1 flex-col">
										<span style={{ color: "#FF6B00", fontSize: "11px", fontWeight: "bold", letterSpacing: "2px" }}>RC</span>
										<h2 style={{ color: "#F5EDE0", fontSize: "18px", fontWeight: "bold", marginTop: "8px", lineHeight: "1.2" }}>{user.name}</h2>
										<span style={{ color: "#5C4A38", fontSize: "11px" }}>@{user.login}</span>

										<div
											style={{
												marginTop: "12px",
												padding: "3px 8px",
												border: `1px solid ${RANK_COLOURS[user.currentRank] || "#888"}`,
												color: RANK_COLOURS[user.currentRank] || "#888",
												fontSize: "10px",
												fontWeight: "bold",
												borderRadius: "4px",
												width: "fit-content",
												textTransform: "uppercase",
											}}
										>
											RANK {user.currentRank}
										</div>

										<div className="mt-2 flex flex-wrap gap-1">
											{topSkills.map((s) => (
												<span
													key={s.skillTag}
													style={{
														fontSize: "9px",
														color: "#5C4A38",
														backgroundColor: "#1A1612",
														padding: "2px 4px",
														borderRadius: "2px",
													}}
												>
													{s.skillTag}
												</span>
											))}
										</div>
									</div>

									{/* Center Column */}
									<div className="flex flex-1 flex-col items-end justify-end pb-1">
										<span style={{ color: "#5C4A38", fontSize: "9px" }}>robotics.club</span>
										<span style={{ color: "#F5EDE0", fontSize: "11px", fontWeight: "bold" }}>{user.completedProjects} projects</span>
										<span style={{ color: "#5C4A38", fontSize: "9px" }}>{formatSince(user.joinedAt)}</span>
									</div>

									{/* Right Column */}
									<div className="flex flex-none items-start" style={{ width: "80px" }}>
										<div className="rounded-lg bg-[#0A0806] p-1 border border-[#2A2218]">
											<QRCode
												value={profileUrl}
												size={72}
												bgColor="#0A0806"
												fgColor="#FF6B00"
												level="H"
											/>
										</div>
									</div>
								</div>

								{/* Bottom Strip */}
								<div className="mt-auto pt-3">
									<div style={{ height: "1px", backgroundColor: "#2A2218", width: "100%" }} />
									<p style={{ color: "#5C4A38", fontSize: "8px", textAlign: "center", marginTop: "4px", letterSpacing: "0.5px" }}>
										Robotics Club — 42
									</p>
								</div>
							</div>
						</div>

						<div className="mt-6 flex flex-col gap-2">
							<Button variant="primary" className="w-full" onClick={handleDownload}>
								Download PNG
							</Button>
							<Button variant="ghost" className="w-full" onClick={() => setIsOpen(false)}>
								Close
							</Button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
