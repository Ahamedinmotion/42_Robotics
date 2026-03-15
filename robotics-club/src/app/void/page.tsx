"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VoidPage() {
	const [stage, setStage] = useState(0);
	const router = useRouter();

	useEffect(() => {
		const timers: NodeJS.Timeout[] = [];

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
				await fetch("/api/user/achievements/unlock", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ key: "STARED_INTO_VOID" }),
				});
				// Set flag
				await fetch("/api/user/flags", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ visitedVoid: true }),
				});
			} catch (e) {
				console.error("Failed to trigger void updates:", e);
			}
			router.push("/cursus");
		}, 36000));

		return () => timers.forEach(clearTimeout);
	}, [router]);

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black font-mono text-white transition-opacity duration-1000">
			<style jsx global>{`
				body { background: black !important; }
				* { cursor: crosshair !important; }
			`}</style>

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
				
				<p className={`absolute text-[10px] opacity-40 transition-opacity duration-500 ${stage === 5 ? "opacity-40" : "opacity-0"}`}>
					Not everything on the wall is what it seems.
				</p>
			</div>
		</div>
	);
}
