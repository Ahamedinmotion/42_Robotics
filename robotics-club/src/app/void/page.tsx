"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VoidPage() {
	const [stage, setStage] = useState(0);
	const router = useRouter();

	useEffect(() => {
		const timers: NodeJS.Timeout[] = [];
		
		// Visit tracking
		const visits = Number(localStorage.getItem("void_visits") || "0") + 1;
		localStorage.setItem("void_visits", String(visits));
		const isSpecialVisit = visits === 7;

		if (isSpecialVisit) {
			// Stop any background ambient (simulated by state)
			// On 7th visit, we stay longer and have special lines
			timers.push(setTimeout(() => setStage(1), 12000));
			timers.push(setTimeout(() => setStage(2), 24000));
			timers.push(setTimeout(() => setStage(6), 36000)); // "Why do you keep coming back?"
			
			// The silence and low tone
			timers.push(setTimeout(() => {
				setStage(7); // SILENCE
				// Here we would stop actual <audio> elements if they existed
			}, 40000));
			
			timers.push(setTimeout(() => {
				setStage(8); // LOW TONE
				const audio = new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_f3299c5c7d.mp3"); // A low thud/drone
				audio.volume = 0.5;
				audio.play().catch(() => {});
			}, 44000));

			timers.push(setTimeout(() => setStage(5), 50000));
			timers.push(setTimeout(() => router.push("/cursus"), 54000));
		} else {
			// Normal logic
			// 10s: "You're still here."
			timers.push(setTimeout(() => setStage(1), 10000));
			
			// 20s: "Interesting."
			timers.push(setTimeout(() => setStage(2), 20000));
			
			// 30s: "Go build something."
			timers.push(setTimeout(() => setStage(3), 30000));
			
			// 32s: Clear all
			timers.push(setTimeout(() => setStage(4), 32000));
			
			// 34s: Final line
			timers.push(setTimeout(() => setStage(5), 34000));
			
			// 36s: Redirect and Achievement
			timers.push(setTimeout(async () => {
				try {
					await fetch("/api/user/achievements/unlock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "STARED_INTO_VOID" }) });
					await fetch("/api/user/flags", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitedVoid: true }) });
				} catch (e) {
					console.error("Failed to trigger void updates:", e);
				}
				router.push("/cursus");
			}, 36000));
		}

		return () => timers.forEach(clearTimeout);
	}, [router]);

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black font-mono text-white transition-opacity duration-1000 overflow-hidden">
			<style jsx global>{`
				body { background: black !important; }
				* { cursor: crosshair !important; }
				@keyframes subtle-flicker {
					0% { opacity: 0.2; }
					50% { opacity: 0.4; }
					100% { opacity: 0.2; }
				}
				.creepy-vignette {
					box-shadow: inset 0 0 100px #000, inset 0 0 200px #000;
				}
			`}</style>

			<div className="absolute inset-0 pointer-events-none creepy-vignette" />
			
			<div className="relative flex h-32 w-full flex-col items-center justify-center text-center">
				<p className={`absolute transition-opacity duration-1000 ${stage === 1 || stage === 2 || stage === 3 ? "opacity-100" : "opacity-0"}`}>
					You're still here.
				</p>
				<p className={`absolute translate-y-8 transition-opacity duration-1000 ${stage === 2 || stage === 3 ? "opacity-100" : "opacity-0"}`}>
					Interesting.
				</p>
				<p className={`absolute translate-y-16 transition-opacity duration-1000 ${stage === 3 ? "opacity-100" : "opacity-0"}`}>
					Go build something.
				</p>
				
				<p className={`absolute text-lg font-bold tracking-tighter text-red-500/50 transition-opacity duration-[3000ms] ${stage === 6 ? "opacity-100" : "opacity-0"}`}>
					Why do you keep coming back here?
				</p>

				<div className={`absolute inset-0 bg-black transition-all duration-[5000ms] ${stage === 7 ? "opacity-100" : "opacity-0 invisible"}`}>
					{/* Total Silence */}
				</div>

				<div className={`absolute inset-0 flex items-center justify-center transition-all duration-[200ms] ${stage === 8 ? "opacity-100 scale-110" : "opacity-0 scale-100"}`}>
					<div className="h-px w-32 bg-white/20 blur-sm animate-pulse" />
				</div>
				
				<p className={`absolute text-[10px] tracking-[0.2em] font-mono transition-opacity duration-1000 ${stage === 5 ? "opacity-30 animate-[subtle-flicker_8s_infinite]" : "opacity-0"}`}>
					Not everything on the wall is what it seems.
				</p>
			</div>
		</div>
	);
}
