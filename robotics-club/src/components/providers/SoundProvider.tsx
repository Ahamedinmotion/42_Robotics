"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SoundContextType {
	playSFX: (type: "unlock" | "claim" | "achievement" | "button" | "konami") => void;
	soundsEnabled: boolean;
	setSoundsEnabled: (enabled: boolean) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
	const [soundsEnabled, setSoundsEnabled] = useState(true);
	const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

	useEffect(() => {
		// Load preference
		const saved = localStorage.getItem("rc_sounds_enabled");
		if (saved !== null) setSoundsEnabled(saved === "true");
	}, []);

	useEffect(() => {
		localStorage.setItem("rc_sounds_enabled", soundsEnabled.toString());
	}, [soundsEnabled]);

	const initAudio = () => {
		if (!audioCtx) {
			const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			setAudioCtx(ctx);
			return ctx;
		}
		return audioCtx;
	};

	const playSFX = (type: "unlock" | "claim" | "achievement" | "button" | "konami") => {
		if (!soundsEnabled) return;

		const ctx = initAudio();
		if (ctx.state === "suspended") ctx.resume();

		const now = ctx.currentTime;

		const createPing = (freq: number, startTime: number, duration: number, volume: number = 0.1) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.type = "sine";
			osc.frequency.setValueAtTime(freq, startTime);
			gain.gain.setValueAtTime(0, startTime);
			gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
			gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
			osc.start(startTime);
			osc.stop(startTime + duration);
		};

		switch (type) {
			case "button":
				createPing(880, now, 0.2, 0.05);
				break;
			case "claim":
				createPing(440, now, 0.4, 0.08);
				createPing(880, now + 0.1, 0.3, 0.05);
				break;
			case "unlock":
				[523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
					createPing(freq, now + i * 0.08, 0.5, 0.06);
				});
				break;
			case "achievement":
				[880, 1108.73, 1318.51, 1760.00].forEach((freq, i) => {
					createPing(freq, now + i * 0.1, 0.8, 0.07);
				});
				break;
			case "konami":
				// More musical/ethereal konami sequence
				[261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
					createPing(freq, now + i * 0.08, 0.4, 0.05);
				});
				break;
		}
	};

	return (
		<SoundContext.Provider value={{ playSFX, soundsEnabled, setSoundsEnabled }}>
			{children}
		</SoundContext.Provider>
	);
}

export function useSound() {
	const context = useContext(SoundContext);
	if (!context) throw new Error("useSound must be used within SoundProvider");
	return context;
}
