import { NextAuthOptions } from "next-auth";
import prisma from "@/lib/prisma";
import { getRolePermissions, isRoleAdmin } from "@/lib/permissions";

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
					},
					create: {
						fortyTwoId: account.providerAccountId,
						login: p.login,
						name: p.usual_full_name || p.displayname || p.login,
						email: p.email,
						image: p.image?.versions?.medium || p.image?.link || null,
						birthday: p.birthday ? new Date(p.birthday) : null,
						status: "WAITLIST",
						role: "STUDENT",
					}
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
			// 1. Initial sign-in: set the token's ID and other basic fields from the user object.
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
						hasSeenIntro: true,
						hasSeenWaitlistModal: true,
					},
				});
				if (dbUser) {
					token.id = dbUser.id;
					token.login = dbUser.login;
					token.role = dbUser.role;
					token.status = dbUser.status;
					token.currentRank = dbUser.currentRank;
					token.activeTheme = dbUser.activeTheme;
					token.hasSeenIntro = dbUser.hasSeenIntro;
					token.hasSeenWaitlistModal = dbUser.hasSeenWaitlistModal;
					token.isImpersonating = false;
					token.realAdminId = dbUser.id;

					// Fetch permissions from the role
					const permissions = await getRolePermissions(dbUser.role);
					token.permissions = permissions;
					token.isAdmin = await isRoleAdmin(dbUser.role);
				}
			}

			// 2. Fetch/update current state for existing sessions
			if (token.id) {
				const realAdminId = (token as any).realAdminId || (token as any).id;
				
				const adminUser = await prisma.user.findUnique({
					where: { id: realAdminId as string },
					select: {
						id: true,
						login: true,
						role: true,
						impersonatorId: true,
						status: true,
						currentRank: true,
						activeTheme: true,
						hasSeenIntro: true,
						hasSeenWaitlistModal: true,
					},
				});

				if (adminUser && adminUser.role === "PRESIDENT" && adminUser.impersonatorId) {
					// Only fetch target user if it's different from the current token ID
					if (token.id !== adminUser.impersonatorId) {
						const targetUser = await prisma.user.findUnique({
							where: { id: adminUser.impersonatorId },
							select: {
								id: true,
								login: true,
								role: true,
								status: true,
								currentRank: true,
								activeTheme: true,
								hasSeenIntro: true,
								hasSeenWaitlistModal: true,
							},
						});

						if (targetUser) {
							token.id = targetUser.id;
							token.login = targetUser.login;
							token.role = targetUser.role;
							token.status = targetUser.status;
							token.currentRank = targetUser.currentRank;
							token.activeTheme = targetUser.activeTheme;
							token.hasSeenIntro = targetUser.hasSeenIntro;
							token.hasSeenWaitlistModal = targetUser.hasSeenWaitlistModal;
							token.isImpersonating = true;
							token.realAdminId = adminUser.id;
						}
					}
					
					// Always keep admin's permissions
					const permissions = await getRolePermissions(adminUser.role);
					token.permissions = permissions;
					token.isAdmin = await isRoleAdmin(adminUser.role);
				} else if (adminUser) {
					// RESTORE IDENTITY if not impersonating anymore
					token.id = adminUser.id;
					token.login = adminUser.login;
					token.role = adminUser.role;
					token.status = adminUser.status;
					token.currentRank = adminUser.currentRank;
					token.activeTheme = adminUser.activeTheme;
					token.hasSeenIntro = adminUser.hasSeenIntro;
					token.hasSeenWaitlistModal = adminUser.hasSeenWaitlistModal;
					token.isImpersonating = false;
					token.realAdminId = adminUser.id;

					const permissions = await getRolePermissions(adminUser.role);
					token.permissions = permissions;
					token.isAdmin = await isRoleAdmin(adminUser.role);
				}
			}

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
				(session.user as any).realAdminId = token.realAdminId as string;
			}
			return session;
		},

	},
};
