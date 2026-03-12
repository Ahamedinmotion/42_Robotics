import prisma from "@/lib/prisma";
import { BirthdayConfetti } from "@/components/home/BirthdayConfetti";

export async function BirthdaySection({ userId }: { userId: string }) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { birthday: true },
	});

	if (!(user as any)?.birthday) return null;

	return <BirthdayConfetti birthday={(user as any).birthday.toISOString()} />;
}
