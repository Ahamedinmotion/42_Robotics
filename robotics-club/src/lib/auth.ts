import { NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
	// We remove the adapter and handle user creation manually in the signIn callback.
	// This gives us complete control over the 'login' field and avoids adapter-related schema errors.
	providers: [
		{
			id: "42-school",
			name: "42",
			type: "oauth",
			authorization: "https://api.intra.42.fr/oauth/authorize?scope=public",
			token: "https://api.intra.42.fr/oauth/token",
			userinfo: "https://api.intra.42.fr/v2/me",
			clientId: process.env.FORTYTWO_CLIENT_ID as string,
			clientSecret: process.env.FORTYTWO_CLIENT_SECRET as string,
			profile(profile) {
				return {
					id: profile.id.toString(),
					login: profile.login,
					name: profile.usual_full_name || profile.displayname || profile.login,
					email: profile.email,
					image: profile.image?.versions?.medium || profile.image?.link,
				};
			},
			allowDangerousEmailAccountLinking: true,
		},
	],
	session: {
		strategy: "jwt",
	},
	pages: {
		signIn: "/login",
		error: "/login",
	},
	callbacks: {
		async signIn({ user, account, profile }) {
			console.log("NextAuth SignIn Callback:", { user, account, profile });
			if (!account || !profile) return false;

			try {
				const p = profile as any;

				// Manually upsert the user to ensure 'login' and 'fortyTwoId' are set.
				const dbUser = await prisma.user.upsert({
					where: {
						fortyTwoId: account.providerAccountId
					},
					update: {
						name: p.usual_full_name || p.displayname || p.login,
						email: p.email,
						image: p.image?.versions?.medium || p.image?.link || null,
						login: p.login,
					},
					create: {
						fortyTwoId: account.providerAccountId,
						login: p.login,
						name: p.usual_full_name || p.displayname || p.login,
						email: p.email,
						image: p.image?.versions?.medium || p.image?.link || null,
						status: "WAITLIST",
						role: "STUDENT",
					}
				});

				console.log("Manual User Upsert Success:", dbUser.id);

				if (dbUser.status === "BLACKHOLED") return "/blackholed";

				// Explicitly link the database ID to the NextAuth user object
				// so the JWT callback can use it.
				(user as any).id = dbUser.id;

				return true;
			} catch (error) {
				console.error("Manual SignIn Error:", error);
				return false;
			}
		},
		async jwt({ token, user }) {
			// 'user' is only available on the first call (sign in)
			if (user) {
				const dbUser = await prisma.user.findUnique({
					where: { id: (user as any).id },
					select: {
						id: true,
						login: true,
						role: true,
						status: true,
						currentRank: true,
						activeTheme: true,
					},
				});
				if (dbUser) {
					token.id = dbUser.id;
					token.login = dbUser.login;
					token.role = dbUser.role;
					token.status = dbUser.status;
					token.currentRank = dbUser.currentRank;
					token.activeTheme = dbUser.activeTheme;
				}
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.id as string;
				session.user.login = token.login as string;
				session.user.role = token.role as any;
				session.user.status = token.status as any;
				session.user.currentRank = token.currentRank as any;
				session.user.activeTheme = token.activeTheme as any;
			}
			return session;
		},
	},
};
