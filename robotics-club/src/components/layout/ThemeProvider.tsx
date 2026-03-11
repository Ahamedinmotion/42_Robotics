"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Theme = "FORGE" | "FIELD";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState<Theme>("FORGE");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const applyTheme = (newTheme: Theme) => {
      setThemeState(newTheme);
      if (newTheme === "FIELD") {
        document.body.classList.add("theme-field");
      } else {
        document.body.classList.remove("theme-field");
      }
    };

    // If user has a preference in their session, use it.
    if (session?.user?.activeTheme) {
      applyTheme(session.user.activeTheme as Theme);
      return;
    }

    // Auto-switch based on local time.
    // Night mode (Forge) from 19:00 to 07:00
    // Day mode (Field) from 07:00 to 19:00
    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 7 && currentHour < 19;
    
    applyTheme(isDayTime ? "FIELD" : "FORGE");
  }, [session?.user?.activeTheme, isClient]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (newTheme === "FIELD") {
      document.body.classList.add("theme-field");
    } else {
      document.body.classList.remove("theme-field");
    }
    // Ideally this would also make an API call to update the user's preference in DB
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
