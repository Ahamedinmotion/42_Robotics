"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

interface ToastData {
	id: number;
	message: string;
	type: "success" | "error";
}

interface ToastContextType {
	toast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => { } });

export function useToast() {
	return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	let counter = 0;

	const toast = useCallback((message: string, type: "success" | "error" = "success") => {
		const id = Date.now() + counter++;
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
	}, []);

	return (
		<ToastContext.Provider value={{ toast }}>
			{children}
			<div className="fixed bottom-16 right-4 z-[60] flex flex-col gap-2">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={`animate-slide-in rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${t.type === "success"
								? "border border-green-800/40 bg-green-950/90 text-green-300"
								: "border border-red-800/40 bg-red-950/90 text-red-300"
							}`}
					>
						{t.message}
					</div>
				))}
			</div>
			<style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
      `}</style>
		</ToastContext.Provider>
	);
}
