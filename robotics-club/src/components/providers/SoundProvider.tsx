"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface SoundContextType {
	playSFX: (type: "unlock" | "claim" | "achievement" | "button") => void;
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

	const playSFX = (type: "unlock" | "claim" | "achievement" | "button") => {
		if (!soundsEnabled) return;

		const ctx = initAudio();
		if (ctx.state === "suspended") ctx.resume();

		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.connect(gain);
		gain.connect(ctx.destination);

		switch (type) {
			case "button":
				osc.type = "sine";
				osc.frequency.setValueAtTime(800, now);
				osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
				gain.gain.setValueAtTime(0.1, now);
				gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
				osc.start(now);
				osc.stop(now + 0.1);
				break;
			case "claim":
				osc.type = "triangle";
				osc.frequency.setValueAtTime(440, now);
				osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
				gain.gain.setValueAtTime(0.1, now);
				gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
				osc.start(now);
				osc.stop(now + 0.2);
				break;
			case "unlock":
				// Arpeggio chime
				[523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
					const o = ctx.createOscillator();
					const g = ctx.createGain();
					o.connect(g);
					g.connect(ctx.destination);
					o.type = "sine";
					o.frequency.setValueAtTime(freq, now + i * 0.1);
					g.gain.setValueAtTime(0, now + i * 0.1);
					g.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
					g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
					o.start(now + i * 0.1);
					o.stop(now + i * 0.1 + 0.3);
				});
				break;
			case "achievement":
				// Radiant chime
				osc.type = "sine";
				osc.frequency.setValueAtTime(880, now);
				osc.frequency.exponentialRampToValueAtTime(1760, now + 0.5);
				gain.gain.setValueAtTime(0.1, now);
				gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
				gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
				osc.start(now);
				osc.stop(now + 0.5);
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
