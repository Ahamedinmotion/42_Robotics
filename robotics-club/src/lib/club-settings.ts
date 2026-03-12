import prisma from "@/lib/prisma";

const SINGLETON_ID = "singleton";

export async function getClubSettings() {
	return prisma.clubSettings.upsert({
		where: { id: SINGLETON_ID },
		update: {},
		create: { id: SINGLETON_ID },
	});
}

export type ClubSettings = Awaited<ReturnType<typeof getClubSettings>>;
