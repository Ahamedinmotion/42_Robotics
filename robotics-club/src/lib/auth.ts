import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma) as any,
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
					name: profile.usual_full_name || profile.displayname || profile.login,
					email: profile.email || `${profile.login}@42.placeholder`,
					image: profile.image?.versions?.medium || profile.image?.link,
					login: profile.login,
				};
			},
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
			if (!account || !profile) return true;

			// Update login and fortyTwoId after adapter creates the user
			try {
				await prisma.user.update({
					where: { id: user.id },
					data: {
						login: (profile as any).login,
						fortyTwoId: account.providerAccountId,
						avatar: (profile as any).image?.versions?.medium || (profile as any).image?.link || null,
					},
				});
			} catch {
				// First sign-in — user might just have been created,
				// login/fortyTwoId may already be set by defaults.
			}

			// Check blackhole status
			const dbUser = await prisma.user.findUnique({
				where: { id: user.id },
				select: { status: true },
			});

			if (dbUser?.status === "BLACKHOLED") {
				return "/blackholed";
			}

			return true;
		},
		async jwt({ token, user }) {
			if (user) {
				// First sign in — fetch custom fields
				const dbUser = await prisma.user.findUnique({
					where: { id: user.id },
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
