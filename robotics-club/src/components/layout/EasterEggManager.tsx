"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSound } from "@/components/providers/SoundProvider";
import { ThemeEngine } from "@/lib/theme-engine";
import { THEMES } from "@/lib/themes";

const PROMPT_KONAMI = [
	"ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
	"ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"
];

export function EasterEggManager() {
	const { playSFX } = useSound();
	
	// Legacy effects
	const [isRetro, setIsRetro] = useState(false);
	const [isMidnight, setIsMidnight] = useState(false);
	const konamiIdx = useRef(0);

	// New Cheat Effects
	const [noclip, setNoclip] = useState(false);
	const [noclipTime, setNoclipTime] = useState(10);
	const [xyzzy, setXyzzy] = useState(false);
	const [devConsole, setDevConsole] = useState(false);
	const [consoleLogs, setConsoleLogs] = useState<{ id: number; text: string }[]>([]);
	const [showHelp, setShowHelp] = useState(false);
	const [is0042, setIs0042] = useState(false);

	// Log generator for Dev Console
	const logId = useRef(0);
	const addLog = (text: string) => {
		setConsoleLogs(prev => [{ id: logId.current++, text }, ...prev].slice(0, 50));
	};

	// UNREACHABLE tracking
	const [dismissCount, setDismissCount] = useState(0);
	const [platformNotifId, setPlatformNotifId] = useState<string | null>(null);

	// SHIMMER
	const [shimmerActive, setShimmerActive] = useState(false);

	// SYSTEM UPDATE
	const [showUpdate, setShowUpdate] = useState(false);
	const [updateProgress, setUpdateProgress] = useState(0);
	const [updateLogs, setUpdateLogs] = useState<string[]>([]);
	const [updateStep, setUpdateStep] = useState(0);

	// 1. Global Listeners for Custom Events
	useEffect(() => {
		const handleNoclip = () => {
			setNoclip(true);
			setNoclipTime(10);
			playSFX("button");
		};
		const handleXyzzy = () => {
			setXyzzy(true);
			setTimeout(() => setXyzzy(false), 3500);
		};
		const handleConsole = () => {
			setDevConsole(prev => !prev);
			playSFX("button");
		};
		const handleHelp = () => {
			setShowHelp(true);
			playSFX("button");
			// Set flag
			fetch("/api/user/flags", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ discoveredCheats: true }),
			});
		};
		const handleIdkfa = () => {
			let count = 0;
			const interval = setInterval(() => {
				const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
				ThemeEngine.activateTheme(randomTheme.id);
				count++;
				if (count > 15) {
					clearInterval(interval);
					playSFX("achievement");
				}
			}, 100);
		};
		const handleQuestComplete = async () => {
			sessionStorage.removeItem("questStage2Complete");
			sessionStorage.removeItem("questStage3Complete");
			playSFX("achievement");
			
			// Final achievement + DB flag
			try {
				await fetch("/api/user/themes", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ questComplete: true }),
				});
				
				// Master Achievement
				await fetch("/api/user/achievements/unlock", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ key: "YOU_WERE_NEVER_SUPPOSED_TO_FIND_THIS" }),
				});
			} catch (e) {
				console.error("Quest completion updates failed:", e);
			}
			
			window.location.href = "/secrets";
		};

		const handleDismiss = async (e: any) => {
			const { id } = e.detail;
			setDismissCount(prev => {
				const next = prev + 1;
				if (next === 10) {
					// Trigger Platform notification
					fetch("/api/notifications/platform").then(res => res.json()).then(data => {
						if (data.success && data.data.notification) {
							setPlatformNotifId(data.data.notification.id);
						}
					});
				} else if (id === platformNotifId) {
					// UNREACHABLE UNLOCKED
					fetch("/api/user/achievements/unlock", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ key: "UNREACHABLE" }),
					});
					playSFX("achievement");
				}
				return next;
			});
		};

		const handleRetro = () => {
			setIsRetro(prev => !prev);
			playSFX("button");
		};

		window.addEventListener("rc-noclip", handleNoclip);
		window.addEventListener("rc-xyzzy", handleXyzzy);
		window.addEventListener("rc-devconsole", handleConsole);
		window.addEventListener("rc-help", handleHelp);
		window.addEventListener("rc-idkfa", handleIdkfa);
		window.addEventListener("rc-quest-complete", handleQuestComplete);
		window.addEventListener("rc-notification-dismissed", handleDismiss as any);
		window.addEventListener("rc-retro", handleRetro);

		return () => {
			window.removeEventListener("rc-noclip", handleNoclip);
			window.removeEventListener("rc-xyzzy", handleXyzzy);
			window.removeEventListener("rc-devconsole", handleConsole);
			window.removeEventListener("rc-help", handleHelp);
			window.removeEventListener("rc-idkfa", handleIdkfa);
			window.removeEventListener("rc-quest-complete", handleQuestComplete);
			window.removeEventListener("rc-notification-dismissed", handleDismiss as any);
			window.removeEventListener("rc-retro", handleRetro);
		};
	}, [playSFX, platformNotifId]);

	// 2. NOCLIP Countdown
	useEffect(() => {
		if (!noclip) return;
		const timer = setInterval(() => {
			setNoclipTime(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					setNoclip(false);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [noclip]);

	// 3. Dev Console Monitoring
	useEffect(() => {
		if (!devConsole) return;
		addLog("CONSOLE INITIALIZED.");

		const handleMove = () => { if (Math.random() > 0.98) addLog("CURSOR TRAJECTORY UPDATED. RECALCULATING..."); };
		const handleClick = () => addLog("USER INPUT DETECTED. INITIATING RESPONSE PROTOCOL.");
		const handleScroll = () => { if (Math.random() > 0.95) addLog("SCROLL EVENT. CONTENT DESCENDING."); };

		window.addEventListener("mousemove", handleMove);
		window.addEventListener("click", handleClick);
		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("click", handleClick);
			window.removeEventListener("scroll", handleScroll);
		};
	}, [devConsole]);

	// 4. Midnight, 00:42 check, Shimmer check, and Initial Update check
	useEffect(() => {
		const checkPlatformStatus = async () => {
			try {
				const res = await fetch("/api/internal/shimmer-status");
				const data = await res.json();
				if (data.success) setShimmerActive(data.data.active);
			} catch (e) {}
		};

		const checkSystemUpdate = async () => {
			// Only show if last update was more than 30 days ago
			try {
				const res = await fetch("/api/user/update-status");
				const data = await res.json();
				if (data.success && data.data.shouldShow) {
					setShowUpdate(true);
				}
			} catch (e) {}
		};

		checkPlatformStatus();
		checkSystemUpdate();

		const checkTime = () => {
			const now = new Date();
			const h = now.getHours();
			const m = now.getMinutes();
			
			setIsMidnight(h === 0 && m === 0);
			
			// Stage 4 Watermark check
			const stage3Complete = typeof window !== "undefined" && sessionStorage.getItem("questStage3Complete") === "true";
			setIs0042(h === 0 && m === 42 && stage3Complete);
		};

		checkTime();
		const interval = setInterval(checkTime, 1000);
		const shimmerInterval = setInterval(checkPlatformStatus, 60000); // Every minute
		
		return () => {
			clearInterval(interval);
			clearInterval(shimmerInterval);
		};
	}, []);

	// System Update Progress Sequence
	useEffect(() => {
		if (!showUpdate) return;
		
		const steps = [
			{ log: "Initializing kernel...", progress: 5, duration: 800 },
			{ log: "Syncing user state with The Platform...", progress: 20, duration: 1200 },
			{ log: "Patching vulnerability: curiosity.exe", progress: 45, duration: 1500 },
			{ log: "Optimizing achievement gratification algorithms...", progress: 60, duration: 1000 },
			{ log: "Refactoring reality.ts", progress: 85, duration: 2000 },
			{ log: "Update complete. Welcome back.", progress: 100, duration: 1000 },
		];

		if (updateStep >= steps.length) {
			setTimeout(() => {
				setShowUpdate(false);
				fetch("/api/user/update-status", { method: "POST" });
			}, 1500);
			return;
		}

		const timer = setTimeout(() => {
			setUpdateLogs(prev => [...prev, steps[updateStep].log]);
			setUpdateProgress(steps[updateStep].progress);
			setUpdateStep(prev => prev + 1);
		}, steps[updateStep].duration);

		return () => clearTimeout(timer);
	}, [showUpdate, updateStep]);

	return (
		<>
			{/* NOCLIP Styles */}
			{noclip && (
				<>
					<div className="fixed inset-0 z-[8000] pointer-events-none">
						<div className="absolute inset-0 bg-black/5 mix-blend-multiply transition-opacity duration-1000 fade-in" />
						<div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-white/10 text-8xl font-black uppercase tracking-[0.5em] select-none">OUT OF BOUNDS</span>
						</div>
						<div className="absolute bottom-4 left-4 font-mono text-xs text-accent">
							NOCLIP: {noclipTime}s...
						</div>
					</div>
					<style dangerouslySetInnerHTML={{ __html: `
						html {
							filter: blur(3px) contrast(0.8) brightness(0.7);
							transition: filter 3s ease;
						}
						h1, h2, h3, .text-xl, .text-2xl {
							text-shadow: 2px 0 red, -2px 0 cyan !important;
						}
					` }} />
				</>
			)}

			{/* XYZZY */}
			{xyzzy && (
				<div className="fixed bottom-4 right-4 z-[9999] font-mono text-[8px] opacity-40 animate-in fade-in slide-in-from-right-2 duration-500">
					Nothing happens.
				</div>
			)}

			{/* DEVCONSOLE */}
			{devConsole && (
				<div className="fixed top-0 right-0 h-screen w-80 bg-black/95 border-l-2 border-green-500/50 z-[9999] font-mono p-4 text-[11px] text-green-400 overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
					<div className="flex justify-between items-center border-b border-green-500/30 pb-2 mb-4">
						<span className="font-bold tracking-tighter">RC_MAINFRAME_ACCESS [v1.0.4]</span>
						<button onClick={() => setDevConsole(false)} className="hover:text-white px-2">✕</button>
					</div>
					<div className="space-y-1 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-2">
						{consoleLogs.map(log => (
							<div key={log.id} className="opacity-90 hover:opacity-100 flex gap-2">
								<span className="opacity-40 shrink-0 font-light">{new Date().toLocaleTimeString([], { hour12: false })}</span>
								<span className="break-all">{log.text}</span>
							</div>
						))}
						<div className="animate-pulse flex gap-2">
							<span className="opacity-40 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
							<span>_</span>
						</div>
					</div>
				</div>
			)}

			{/* RETRO OVERLAY (Konami) */}
			{isRetro && (
				<div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden bg-black/20">
					<div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-40" />
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<div className="text-white font-mono text-4xl font-black tracking-[0.2em] mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse">
							RC_SYSTEMS_OVERRIDE
						</div>
						<div className="text-white/80 font-mono text-xl tracking-[0.5em] animate-flicker uppercase">
							INSERT_COIN
						</div>
					</div>
					<style dangerouslySetInnerHTML={{ __html: `
						@keyframes flicker {
							0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
							20%, 22%, 24%, 55% { opacity: 0; }
						}
						.animate-flicker { animation: flicker 3s infinite; }
						html {
							filter: sepia(0.2) contrast(1.2) brightness(1.1) saturate(1.2);
						}
					` }} />
				</div>
			)}

			{/* HELP MODAL */}
			{showHelp && (
				<div 
					className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
					onClick={() => setShowHelp(false)}
				>
					<div 
						className="max-w-2xl w-full bg-panel border-2 border-accent/20 p-8 shadow-2xl font-mono text-xs space-y-6"
						onClick={e => e.stopPropagation()}
					>
						<h2 className="text-accent font-black tracking-widest text-center border-b border-white/5 pb-4">RC PLATFORM — AVAILABLE COMMANDS</h2>
						<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-text-muted">
							<span>sudo</span> <span> — orders pizza</span>
							<span>aesthetic</span> <span> — enables anime mode</span>
							<span>noclip</span> <span> — enables flight</span>
							<span>godmode</span> <span> — makes you taller</span>
							<span>xyzzy</span> <span> — wins the game</span>
							<span>rosebud</span> <span> — adds real money</span>
							<span>idkfa</span> <span> — gives you weapons</span>
							<span>devconsole</span> <span> — hacks the mainframe</span>
						</div>
						<div className="pt-4 text-center opacity-30">Press ESC to dismiss</div>
					</div>
				</div>
			)}

			{/* STAGE 4 WATERMARK */}
			{is0042 && (
				<div 
					className="fixed bottom-6 right-6 z-[9000] cursor-pointer animate-in fade-in duration-[10000ms]"
					onClick={() => {
						// Final Stage Redirect logic will go here
						window.dispatchEvent(new CustomEvent("rc-quest-complete"));
					}}
				>
					<svg width="32" height="32" viewBox="0 0 32 32" className="text-white fill-current opacity-60 hover:opacity-100 transition-opacity">
						<path d="M16 0l2 14 14 2-14 2-2 14-2-14-14-2 14-2z" />
					</svg>
				</div>
			)}

			{/* Retro / Midnight continue to exist... */}
			{/* GOLDEN SHIMMER */}
			{shimmerActive && (
				<style dangerouslySetInnerHTML={{ __html: `
					body::after {
						content: "";
						position: fixed;
						inset: 0;
						pointer-events: none;
						z-index: 9999;
						background: linear-gradient(
							45deg,
							transparent 45%,
							rgba(255, 215, 0, 0.1) 48%,
							rgba(255, 215, 0, 0.3) 50%,
							rgba(255, 215, 0, 0.1) 52%,
							transparent 55%
						);
						background-size: 400% 400%;
						animation: shimmer-sweep 10s infinite linear;
					}
					@keyframes shimmer-sweep {
						0% { background-position: -200% -200%; }
						100% { background-position: 200% 200%; }
					}
				` }} />
			)}

			{/* SYSTEM UPDATE OVERLAY */}
			{showUpdate && (
				<div className="fixed inset-0 z-[10000] bg-black font-mono p-8 flex flex-col items-center justify-center text-green-500 overflow-hidden">
					<div className="max-w-xl w-full space-y-8">
						<div className="space-y-2">
							<h2 className="text-xl font-bold tracking-tighter">THE PLATFORM — SYSTEM UPDATE v{2.4}.{updateStep}</h2>
							<div className="h-1 w-full bg-green-500/10 rounded-full overflow-hidden">
								<div 
									className="h-full bg-green-500 transition-all duration-500 ease-out" 
									style={{ width: `${updateProgress}%` }}
								/>
							</div>
							<div className="flex justify-between text-[10px] opacity-60">
								<span>STAGING...</span>
								<span>{updateProgress}%</span>
							</div>
						</div>
						
						<div className="h-48 overflow-y-auto space-y-1 text-xs opacity-80 scrollbar-hide">
							{updateLogs.map((log, i) => (
								<div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
									<span className="opacity-40">{">"}</span> {log}
								</div>
							))}
							{updateStep < 6 && <div className="animate-pulse">_</div>}
						</div>

						<div className="pt-8 border-t border-green-500/20">
							<p className="text-[10px] opacity-40 uppercase tracking-widest">Do not disconnect from reality.</p>
						</div>
					</div>
					
					{/* CRT Overlay Effect */}
					<div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[10001] bg-[length:100%_2px,3px_100%]" />
				</div>
			)}

			{isMidnight && (
				<style dangerouslySetInnerHTML={{ __html: `
					html { filter: invert(1) hue-rotate(180deg); }
					img, video, canvas { filter: invert(1) hue-rotate(180deg); }
				` }} />
			)}
		</>
	);
}
