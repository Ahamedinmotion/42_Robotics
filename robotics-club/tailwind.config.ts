import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        panel: "var(--panel)",
        panel2: "var(--panel-2)",
        "border-color": "var(--border)",
        accent: "var(--accent)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-urgency": "var(--accent-urgency)",
        "text-primary": "var(--text-primary)",
        "text-muted": "var(--text-muted)",
      },
    },
  },
  plugins: [],
};
export default config;
