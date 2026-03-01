import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
	function middleware(req) {
		const { token } = req.nextauth;
		const path = req.nextUrl.pathname;

		if (!token) {
			return NextResponse.redirect(new URL("/login", req.url));
		}

		const isWaitlistOrBlackholedOrLoginRoute = ["/waitlist", "/blackholed", "/login"].includes(path);

		if (token.status === "WAITLIST" && !isWaitlistOrBlackholedOrLoginRoute) {
			return NextResponse.redirect(new URL("/waitlist", req.url));
		}

		if (token.status === "BLACKHOLED" && !["/blackholed", "/login"].includes(path)) {
			return NextResponse.redirect(new URL("/blackholed", req.url));
		}

		if (path.startsWith("/admin")) {
			const adminRoles = [
				"SECRETARY",
				"PROJECT_MANAGER",
				"SOCIAL_MEDIA_MANAGER",
				"VP",
				"PRESIDENT",
			];
			if (!adminRoles.includes(token.role as string)) {
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
	matcher: ["/home/:path*", "/cursus/:path*", "/profile/:path*", "/admin/:path*"],
};
