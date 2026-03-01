"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
	return (
		<button
			onClick={() => signOut({ callbackUrl: "/login" })}
			className="text-xs text-text-muted transition-colors hover:text-accent"
		>
			Sign out
		</button>
	);
}
