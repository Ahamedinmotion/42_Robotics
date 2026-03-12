import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
	async function middleware(req) {
		const { token } = req.nextauth;
		const path = req.nextUrl.pathname;

		if (!token) {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		// ── Maintenance mode check ──────────────────────
		const bypassPaths = ["/maintenance", "/login", "/api"];
		const isBypass = bypassPaths.some((p) => path.startsWith(p));

		if (!isBypass) {
			try {
				const settingsRes = await fetch(new URL("/api/admin/settings", req.url));
				const settingsJson = await settingsRes.json();
				if (settingsJson?.success && settingsJson.data?.maintenanceMode) {
					// Use isAdmin from token instead of hardcoded role names
					if (!token.isAdmin) {
						return NextResponse.redirect(new URL("/maintenance", req.url));
					}
				}
			} catch {
				// If settings fetch fails, allow through
			}
		}

		// ── Status-based redirects ──────────────────────
		const isWaitlistOrBlackholedOrLoginRoute = ["/waitlist", "/blackholed", "/login", "/maintenance"].includes(path);

		if (token.status === "WAITLIST" && !isWaitlistOrBlackholedOrLoginRoute) {
			return NextResponse.redirect(new URL("/waitlist", req.url));
		}

		if (token.status === "BLACKHOLED" && !["/blackholed", "/login"].includes(path)) {
			return NextResponse.redirect(new URL("/blackholed", req.url));
		}

		// ── Admin route protection ─────────────────────
		if (path.startsWith("/admin")) {
			// Use isAdmin flag from JWT instead of hardcoded role names
			if (!token.isAdmin) {
				return NextResponse.redirect(new URL("/home", req.url));
			}
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
		pages: {
			signIn: "/login",
		},
	}
);

export const config = {
	matcher: ["/home/:path*", "/cursus/:path*", "/profile/:path*", "/admin/:path*", "/maintenance"],
};
