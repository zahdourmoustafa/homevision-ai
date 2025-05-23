# Grouple Project Theme Documentation

This document provides the core theming elements from the Grouple project, which you can use in your own project to achieve a similar look and feel. The design system uses Tailwind CSS with custom theme variables and components.

## Table of Contents

1. [Theme Provider](#1-theme-provider)
2. [Global CSS](#2-global-css)
3. [Tailwind Configuration](#3-tailwind-configuration)
4. [Application Layout](#4-application-layout)
5. [Utility Functions](#5-utility-functions)
6. [Implementation Guide](#implementation-guide)

## 1. Theme Provider

Create a custom theme provider component that uses `next-themes`:

```tsx
// components/theme/index.tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

## 2. Global CSS

The global CSS defines the theme variables for both light and dark modes, as well as custom utility classes for gradients and effects:

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  --scroll-behavior: smooth !important;
  scroll-behavior: smooth !important;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom gradient classes */
.radial {
  background-image: radial-gradient(
    ellipse farthest-side,
    white,
    #716768,
    black
  );
  background-size: 100% 90%;
  background-repeat: no-repeat;
}

.text-gradient {
  background: linear-gradient(to right, #4a4e58, white, #716768);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-radial {
  background-image: radial-gradient(
    ellipse farthest-side,
    rgba(113, 103, 104, 0.2) 30%,
    black 70%
  );
  background-size: 100% 50%;
  background-repeat: no-repeat;
}

.text-radial--circle {
  background-image: radial-gradient(
    circle farthest-side,
    rgba(113, 103, 104, 0.35) 20%,
    black 70%
  );
  background-size: 50% 70%;
  background-repeat: no-repeat;
  background-position: top center;
}

.backdrop--blur__safari {
  -webkit-backdrop-filter: blur(5px);
}

.radial--blur {
  -webkit-backdrop-filter: blur(100px);
  filter: blur(100px);
  background: #877874;
}

@media only screen and (max-width: 800px) {
  .text-radial--circle {
    background-image: radial-gradient(
      circle farthest-side,
      rgba(113, 103, 104, 0.2) 20%,
      black 70%
    );
    background-size: 100% 50%;
    background-repeat: no-repeat;
    background-position: top center;
  }
}

/* Image overlay effects */
.img--overlay {
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 1)
  );
}

.slider-overlay {
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 1),
    rgba(0, 0, 0, 0)
  );
}

.slider-overlay-rev {
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0.8),
    rgba(0, 0, 0, 1)
  );
}
```

## 3. Tailwind Configuration

The Tailwind configuration extends the default theme with custom colors and styling:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    backgroundImage: {
      "radial-gradient": "radial-gradient(circle at 50% 40%, white, black)",
    },
    extend: {
      colors: {
        themeBlack: "#09090B",
        themeGray: "#27272A",
        themeDarkGray: "#27272A",
        themeTextGray: "#B4B0AE",
        themeTextWhite: "#F7ECE9",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## 4. Application Layout

The application layout uses the `ThemeProvider` and sets up the base styles:

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme"
import { Plus_Jakarta_Sans } from "next/font/google" 
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.className} bg-black`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## 5. Utility Functions

The `cn` utility function is used for conditionally combining class names:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## 6. Sidebar Component

Here's a simplified version of the sidebar component used in the project:

```tsx
// components/Sidebar.tsx
"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Group, Plus } from "lucide-react"
import Link from "next/link"

// A simplified version of the sidebar component
const Sidebar = ({ mobile = false }) => {
  return (
    <div
      className={cn(
        "h-screen flex-col gap-y-10 sm:px-5",
        !mobile ? "hidden bg-black md:w-[300px] fixed md:flex" : "w-full flex",
      )}
    >
      {/* Dropdown/Group selector would go here */}
      <div className="w-full flex items-center justify-between text-themeTextGray md:border-[1px] border-themeGray p-3 rounded-xl">
        <div className="flex gap-x-3 items-center">
          <div className="w-10 h-10 rounded-lg bg-themeGray"></div>
          <p className="text-sm">Group Name</p>
        </div>
      </div>

      <div className="flex flex-col gap-y-5">
        <div className="flex justify-between items-center">
          <p className="text-xs text-themeTextWhite">CHANNELS</p>
          <Plus size={16} className="text-themeTextGray cursor-pointer" />
        </div>
        
        <div className="flex flex-col gap-y-2">
          {/* Example channel items */}
          <Link href="#">
            <Button
              variant="ghost"
              className="flex gap-2 w-full justify-start hover:bg-themeGray items-center"
            >
              <Group />
              General
            </Button>
          </Link>
          <Link href="#">
            <Button
              variant="ghost"
              className="flex gap-2 w-full justify-start hover:bg-themeGray items-center"
            >
              <Group />
              Announcements
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
```

## Implementation Guide

To use this theme in your own project, follow these steps:

1. **Install required dependencies:**

```bash
npm install next-themes clsx tailwind-merge tailwindcss-animate lucide-react
# or
yarn add next-themes clsx tailwind-merge tailwindcss-animate lucide-react
```

2. **Set up Tailwind CSS:**
   
Copy the `tailwind.config.ts` file to your project root and make sure your project is configured to use Tailwind CSS.

3. **Add the theme files:**

Create the following files in your project structure:
- `components/theme/index.tsx` - Theme provider
- `app/globals.css` - Global CSS with theme variables
- `lib/utils.ts` - Utility functions
- `app/layout.tsx` - Root layout with theme provider

4. **Add UI components:**

The project uses a combination of custom components and shadcn/ui components. For the full UI component library, you may want to install shadcn/ui:

```bash
npx shadcn-ui@latest init
```

5. **Use theme variables in your components:**

```tsx
<div className="bg-background text-foreground">
  <p className="text-themeTextGray">This text uses theme colors</p>
  <button className="bg-themeGray text-themeTextWhite hover:bg-themeDarkGray">
    Themed Button
  </button>
</div>
```

## Example Theme Usage

```tsx
// Example page component
export default function Page() {
  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-[300px]">
        <div className="bg-themeGray p-6 rounded-xl">
          <h1 className="text-themeTextWhite text-2xl font-bold">
            Welcome to Your Themed App
          </h1>
          <p className="text-themeTextGray mt-2">
            This content uses the custom theme colors and styling.
          </p>
          <div className="mt-4 p-4 rounded-md bg-black">
            <p className="text-themeTextWhite">
              This is a darker section with custom theming.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
```

By following this guide, you can implement the same theme styling as the Grouple project in your own application. 