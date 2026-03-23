import { NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";
import { getRolePermissions, isRoleAdmin } from "@/lib/permissions";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
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
		CredentialsProvider({
			id: "credentials",
			name: "Developer Access",
			credentials: {},
			async authorize() {
				// Only allow bypass in development
				if (process.env.NODE_ENV !== "development") return null;

				const user = await prisma.user.findUnique({
					where: { login: "sshameer" },
				});

				if (!user) return null;

				return {
					id: user.id,
					login: user.login,
					name: user.name,
					email: user.email,
					image: user.image,
				};
			},
		}),
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

				const dbUser = await prisma.user.upsert({
					where: {
						fortyTwoId: account.providerAccountId
					},
					update: {
						name: p.usual_full_name || p.displayname || p.login,
						email: p.email,
						image: p.image?.versions?.medium || p.image?.link || null,
						login: p.login,
						birthday: p.birthday ? new Date(p.birthday) : null,
					} as any,
					create: {
						fortyTwoId: account.providerAccountId,
						login: p.login,
						name: p.usual_full_name || p.displayname || p.login,
						email: p.email,
						image: p.image?.versions?.medium || p.image?.link || null,
						birthday: p.birthday ? new Date(p.birthday) : null,
						status: "WAITLIST",
						role: "STUDENT",
					} as any
				});

				console.log("Manual User Upsert Success:", dbUser.id);

				if (dbUser.status === "BLACKHOLED") return "/blackholed";

				(user as any).id = dbUser.id;

				return true;
			} catch (error) {
				console.error("Manual SignIn Error:", error);
				return false;
			}
		},
		async jwt({ token, user, trigger, session }) {
			// 1. Initial sign-in or explicit update
			if (user || trigger === "update") {
				const userId = user?.id || (token as any).realAdminId || token.id;
				const dbUser = (await prisma.user.findUnique({
					where: { id: userId as string },
					select: {
						id: true,
						login: true,
						role: true,
						status: true,
						currentRank: true,
						activeTheme: true,
						hasSeenIntro: true,
						hasSeenWaitlistModal: true,
						impersonatorId: true,
						unlockedThemes: true,
					} as any,
				})) as any;

				if (dbUser) {
					token.id = dbUser.id;
					token.login = dbUser.login;
					token.role = dbUser.role;
					token.status = dbUser.status;
					token.currentRank = dbUser.currentRank;
					token.activeTheme = dbUser.activeTheme;
					token.hasSeenIntro = dbUser.hasSeenIntro;
					token.hasSeenWaitlistModal = dbUser.hasSeenWaitlistModal;
					token.unlockedThemes = dbUser.unlockedThemes;
					token.realAdminId = (token as any).realAdminId || dbUser.id;

					// Permissions (memoized by role if possible, but here we just fetch)
					token.permissions = (await getRolePermissions(dbUser.role)) as string[];
					token.isAdmin = (dbUser.role === "PRESIDENT") || token.permissions.includes("ALL") || (await isRoleAdmin(dbUser.role));

					// Impersonation logic
					// Allow if user is President OR has explicit permission
					const hasImpersonatePerm = (dbUser.role === "PRESIDENT") || token.permissions.includes("ALL") || token.permissions.includes("CAN_IMPERSONATE");

					if (hasImpersonatePerm && dbUser.impersonatorId) {
						const targetUser = (await prisma.user.findUnique({
							where: { id: dbUser.impersonatorId },
						})) as any;

						if (targetUser) {
							token.id = targetUser.id;
							token.login = targetUser.login;
							token.role = targetUser.role;
							token.status = targetUser.status;
							token.currentRank = targetUser.currentRank;
							token.activeTheme = targetUser.activeTheme;
							token.hasSeenIntro = targetUser.hasSeenIntro;
							token.unlockedThemes = targetUser.unlockedThemes;
							token.isImpersonating = true;
						}
					} else {
						token.isImpersonating = false;
					}
				}
			}

			// 2. For every other request, the token remains as is. 
			// We only re-fetch if the user explicitly triggers an update or signs in.
			// This drastically reduces DB load.

			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				(session.user as any).id = token.id as string;
				(session.user as any).login = token.login as string;
				(session.user as any).role = token.role as any;
				(session.user as any).status = token.status as any;
				(session.user as any).currentRank = token.currentRank as any;
				(session.user as any).activeTheme = token.activeTheme as any;
				(session.user as any).hasSeenIntro = token.hasSeenIntro as boolean;
				(session.user as any).hasSeenWaitlistModal = token.hasSeenWaitlistModal as boolean;
				(session.user as any).permissions = token.permissions as string[];
				(session.user as any).isAdmin = token.isAdmin as boolean;
				(session.user as any).isImpersonating = !!token.isImpersonating;
				(session.user as any).unlockedThemes = token.unlockedThemes as string[];
				(session.user as any).realAdminId = token.realAdminId as string;
			}
			return session;
		},

	},
};
