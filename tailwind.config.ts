import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primárias — Encontro das Águas
        primary: {
          DEFAULT: "hsl(var(--primary))",
          mid: "hsl(var(--primary-mid))",
          light: "hsl(var(--primary-light))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Verde — Floresta Amazônica
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          dark: "hsl(var(--secondary-dark))",
          light: "hsl(var(--secondary-light))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Dourado — Pôr do Sol
        accent: {
          DEFAULT: "hsl(var(--accent))",
          light: "hsl(var(--accent-light))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // Status
        success: {
          DEFAULT: "hsl(var(--success))",
          bg: "hsl(var(--success-bg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          bg: "hsl(var(--warning-bg))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          bg: "hsl(var(--destructive-bg))",
          foreground: "hsl(var(--accent-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          bg: "hsl(var(--info-bg))",
        },
        // Base colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
