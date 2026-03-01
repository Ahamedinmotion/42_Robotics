"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen bg-background">
			{/* Left decorative panel — hidden on mobile */}
			<div className="hidden flex-col items-center justify-center gap-8 bg-panel p-12 md:flex md:w-1/2">
				<p className="text-8xl font-black text-accent">RC</p>

				<p className="max-w-xs text-center text-lg font-semibold text-text-primary">
					Build things. Evaluate honestly. Improve together.
				</p>

				<p className="max-w-xs text-center text-sm text-text-muted">
					A ranked engineering curriculum for makers at 42.
				</p>

				{/* Rank progression decoration */}
				<svg viewBox="0 0 320 40" className="w-64">
					{["E", "D", "C", "B", "A", "S"].map((rank, i) => {
						const x = 20 + i * 56;
						const colours: Record<string, string> = {
							E: "#888888", D: "#44AAFF", C: "#44FF88",
							B: "#FFD700", A: "#FF6B00", S: "#CC44FF",
						};
						return (
							<g key={rank}>
								{i > 0 && (
									<line
										x1={x - 56 + 8} y1={20} x2={x - 8} y2={20}
										stroke={colours[rank]} strokeWidth={1} opacity={0.4}
									/>
								)}
								<circle cx={x} cy={20} r={8} fill={colours[rank]} opacity={0.6} />
								<text x={x} y={24} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
									{rank}
								</text>
							</g>
						);
					})}
				</svg>
			</div>

			{/* Right login panel */}
			<div className="flex w-full flex-col items-center justify-center p-8 md:w-1/2">
				<div className="w-full max-w-sm space-y-6">
					{/* Mobile-only logo */}
					<p className="text-center text-5xl font-black text-accent md:hidden">RC</p>

					<h1 className="text-2xl font-bold text-text-primary">Sign in</h1>
					<p className="text-sm text-text-muted">Use your 42 account to continue.</p>

					<button
						onClick={() => signIn("42-school", { callbackUrl: "/home" })}
						className="w-full rounded-xl bg-accent px-6 py-3 text-lg font-bold text-background transition-opacity hover:opacity-90"
					>
						Sign in with 42
					</button>

					<p className="text-center text-xs text-text-muted">
						By signing in you agree to abide by the Robotics Club code of conduct.
					</p>
				</div>
			</div>
		</div>
	);
}
