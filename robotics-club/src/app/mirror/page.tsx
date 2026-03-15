import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClientPage from "../(student)/profile/[id]/page";

export default async function MirrorPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) redirect("/api/auth/signin");

	// Update discovery flag
	try {
		await prisma.user.update({
			where: { id: session.user.id },
			data: { visitedMirror: true }
		});
	} catch (e) {
		console.error("Failed to set visitedMirror flag:", e);
	}

	// Re-use the public profile page logic
	return (
		<div className="relative">
			<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl animate-pulse">
				Mirror Mode Active
			</div>
			<ProfileClientPage params={{ id: session.user.id }} />
			
			<style dangerouslySetInnerHTML={{ __html: `
				html {
					filter: grayscale(0.5) contrast(1.2);
				}
			` }} />
		</div>
	);
}
