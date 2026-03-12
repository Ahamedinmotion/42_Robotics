import "next-auth";
import { DefaultSession } from "next-auth";
import { Status, Rank, Theme } from "@prisma/client";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			login: string;
			role: string;
			status: Status;
			currentRank: Rank;
			activeTheme: Theme;
			hasSeenIntro: boolean;
			hasSeenWaitlistModal: boolean;
			permissions: string[];
			isAdmin: boolean;
			isImpersonating?: boolean;
			realAdminId?: string;
		} & DefaultSession["user"];
	}

	interface JWT {
		id: string;
		login: string;
		role: string;
		status: Status;
		currentRank: Rank;
		activeTheme: Theme;
		hasSeenIntro: boolean;
		hasSeenWaitlistModal: boolean;
		permissions: string[];
		isAdmin: boolean;
		isImpersonating?: boolean;
		realAdminId?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		login: string;
		role: string;
		status: Status;
		currentRank: Rank;
		activeTheme: Theme;
		hasSeenIntro: boolean;
		hasSeenWaitlistModal: boolean;
		permissions: string[];
		isAdmin: boolean;
		isImpersonating?: boolean;
		realAdminId?: string;
	}
}
