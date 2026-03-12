"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ShowcaseConfetti() {
	useEffect(() => {
		// Only trigger if the URL indicates a first-ever completion
		// This is a simple way to pass the flag from server to client via URL params
		// or we can use a cookie/localstorage. 
		// Actually, let's look for a specific param like ?confetti=true
		const params = new URLSearchParams(window.location.search);
		if (params.get("confetti") === "true") {
			const duration = 5 * 1000;
			const animationEnd = Date.now() + duration;
			const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

			const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

			const interval: any = setInterval(function() {
				const timeLeft = animationEnd - Date.now();

				if (timeLeft <= 0) {
					return clearInterval(interval);
				}

				const particleCount = 50 * (timeLeft / duration);
				confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
				confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
			}, 250);
			
			// Remove the param so it doesn't fire again on refresh
			const newParams = new URLSearchParams(window.location.search);
			newParams.delete("confetti");
			const newPath = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
			window.history.replaceState({}, "", newPath);
		}
	}, []);

	return null;
}
