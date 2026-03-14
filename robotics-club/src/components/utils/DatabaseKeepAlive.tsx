"use client";

import { useEffect } from "react";

/**
 * DatabaseKeepAlive
 * This component pings the keepalive API route every 4 minutes
 * to prevent the Neon database from entering a cold sleep while
 * users are active on the platform.
 */
export function DatabaseKeepAlive() {
	useEffect(() => {
		// Only run in production-like environments or if explicitly needed
		// For the user's dev environment, it's very useful to prevent cold starts.
		
		const ping = async () => {
			try {
				await fetch("/api/cron/keepalive");
			} catch (err) {
				// Silently fail, it's just a keepalive
			}
		};

		// Initial ping
		ping();

		// Ping every 4 minutes (240,000 ms)
		const interval = setInterval(ping, 240000);

		return () => clearInterval(interval);
	}, []);

	return null;
}
