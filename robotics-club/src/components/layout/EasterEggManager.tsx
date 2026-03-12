"use client";

import { useEffect, useState, useRef } from "react";
import { useSound } from "@/components/providers/SoundProvider";

const PROMPT_KONAMI = [
	"ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
	"ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"
];

export function EasterEggManager() {
	const [isRetro, setIsRetro] = useState(false);
	const [isMidnight, setIsMidnight] = useState(false);
	const konamiIdx = useRef(0);
	const { playSFX } = useSound();

	// 1. Konami Code Detection
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === PROMPT_KONAMI[konamiIdx.current]) {
				konamiIdx.current++;
				if (konamiIdx.current === PROMPT_KONAMI.length) {
					triggerRetro();
					konamiIdx.current = 0;
				}
			} else {
				konamiIdx.current = 0;
			}
		};

		const triggerRetro = () => {
			playSFX("konami");
			setIsRetro(true);
			setTimeout(() => setIsRetro(false), 30000); // 30 seconds
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [playSFX]);

	// 2. Midnight Color Inversion
	useEffect(() => {
		const checkMidnight = () => {
			const now = new Date();
			const h = now.getHours();
			const m = now.getMinutes();
			
			// Exactly between 00:00 and 00:01
			const midnight = h === 0 && m === 0;
			setIsMidnight(midnight);
		};

		checkMidnight(); // Initial check
		const interval = setInterval(checkMidnight, 10000); // 10 second interval
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			{isRetro && (
				<>
					<div className="crt-overlay fixed inset-0 pointer-events-none z-[9999]" />
					<div className="crt-vignette fixed inset-0 pointer-events-none z-[9998]" />
					<div className="retro-insert-coin fixed bottom-8 right-8 z-[9999] text-[#0f0] font-['Press_Start_2P'] pointer-events-none">
						INSERT COIN
					</div>
					<style dangerouslySetInnerHTML={{ __html: `
						@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
						
						:root {
							--background: #1a1a1a !important;
							--panel: #222 !important;
							--panel2: #2a2a2a !important;
							--accent: #2e7d32 !important;
							--text-primary: #4caf50 !important;
							--text-muted: #1b5e20 !important;
							--border-color: #333 !important;
							font-family: 'Press Start 2P', cursive !important;
						}

						* {
							image-rendering: pixelated !important;
							border-radius: 0 !important;
							box-shadow: none !important;
							text-transform: uppercase !important;
						}

						h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea {
							font-family: 'Press Start 2P', cursive !important;
							letter-spacing: -2px;
							text-shadow: 2px 2px #000;
						}

						body {
							background-color: #000 !important;
							animation: flicker 0.15s infinite;
						}

						.crt-overlay {
							background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
										linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
							background-size: 100% 2px, 3px 100%;
						}

						.crt-vignette {
							background: radial-gradient(circle, transparent 60%, rgba(0,0,0,0.5) 100%);
						}

						.retro-insert-coin {
							animation: blink 1s step-start infinite;
						}

						@keyframes flicker {
							0% { opacity: 0.98; }
							50% { opacity: 1; }
							100% { opacity: 0.99; }
						}

						@keyframes blink {
							50% { opacity: 0; }
						}

						button {
							border: 4px double #4caf50 !important;
							background: #1a1a1a !important;
							color: #4caf50 !important;
						}

						button:hover {
							background: #4caf50 !important;
							color: #000 !important;
						}

						/* Distort slightly */
						html {
							filter: contrast(1.2) brightness(1.1) sepia(0.2) hue-rotate(-10deg);
						}
					` }} />
				</>
			)}

			{isMidnight && (
				<style dangerouslySetInnerHTML={{ __html: `
					html {
						filter: invert(1) hue-rotate(180deg);
					}
					img, video, canvas {
						filter: invert(1) hue-rotate(180deg);
					}
				` }} />
			)}
		</>
	);
}
