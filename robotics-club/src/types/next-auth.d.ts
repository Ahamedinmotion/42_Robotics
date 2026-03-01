import "next-auth";
import { DefaultSession } from "next-auth";
import { Role, Status, Rank, Theme } from "@prisma/client";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			login: string;
			role: Role;
			status: Status;
			currentRank: Rank;
			activeTheme: Theme;
		} & DefaultSession["user"];
	}

	interface JWT {
		id: string;
		login: string;
		role: Role;
		status: Status;
		currentRank: Rank;
		activeTheme: Theme;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id: string;
		login: string;
		role: Role;
		status: Status;
		currentRank: Rank;
		activeTheme: Theme;
	}
}
