import type { Metadata } from "next";
import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Robotics Club",
  description: "A ranked engineering curriculum for makers at 42.",
};

import { Providers } from "@/components/providers/Providers";
import { EasterEggManager } from "@/components/layout/EasterEggManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClubSettings } from "@/lib/club-settings";
import { FirstLoginIntro } from "@/components/onboarding/FirstLoginIntro";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const settings = await getClubSettings();
  const showIntro = session?.user && !(session.user as any).hasSeenIntro;

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <Providers session={session}>
          {children}
          {showIntro && <FirstLoginIntro tagline={settings.clubTagline} />}
          <EasterEggManager />
        </Providers>
      </body>
    </html>
  );
}
