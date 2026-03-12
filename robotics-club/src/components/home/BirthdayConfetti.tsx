"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function BirthdayConfetti({ birthday }: { birthday: string | null }) {
	useEffect(() => {
		if (!birthday) return;

		const dob = new Date(birthday);
		const today = new Date();
		
		const isBirthday = 
			dob.getDate() === today.getDate() && 
			dob.getMonth() === today.getMonth();

		if (isBirthday) {
			const duration = 15 * 1000;
			const animationEnd = Date.now() + duration;
			const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

			const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

			const interval: any = setInterval(function() {
				const timeLeft = animationEnd - Date.now();

				if (timeLeft <= 0) {
					return clearInterval(interval);
				}

				const particleCount = 50 * (timeLeft / duration);
				// since particles fall down, start a bit higher than random
				confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
				confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
			}, 250);

			return () => clearInterval(interval);
		}
	}, [birthday]);

	return null;
}
