"use client";

import React, { useEffect, useRef } from "react";

export function MatrixRain() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		const columns = Math.floor(canvas.width / 20);
		const drops: number[] = new Array(columns).fill(0);

		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アカサタナハマヤラワ".split("");

		function draw() {
			if (!ctx) return;
			ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
			ctx.fillRect(0, 0, canvas?.width || 0, canvas?.height || 0);

			ctx.fillStyle = "#0F0";
			ctx.font = "15px Share Tech Mono";

			for (let i = 0; i < drops.length; i++) {
				const text = chars[Math.floor(Math.random() * chars.length)];
				ctx.fillText(text, i * 20, drops[i] * 20);

				if (drops[i] * 20 > (canvas?.height || 0) && Math.random() > 0.975) {
					drops[i] = 0;
				}
				drops[i]++;
			}
		}

		const interval = setInterval(draw, 50);

		const handleResize = () => {
			if (!canvas) return;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		window.addEventListener("resize", handleResize);

		return () => {
			clearInterval(interval);
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 z-[9999] pointer-events-none opacity-50"
		/>
	);
}
