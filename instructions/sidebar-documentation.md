# Grouple Project Sidebar - Implementation Guide

This document provides detailed instructions on implementing the sidebar component from the Grouple project in your own application.

## Table of Contents

1. [Overview](#overview)
2. [Required Dependencies](#required-dependencies)
3. [Theme Configuration](#theme-configuration)
4. [Utility Functions](#utility-functions)
5. [Component Structure](#component-structure)
   - [Base Button Component](#base-button-component)
   - [Sidebar Component](#sidebar-component)
   - [Mobile Layout](#mobile-layout)
6. [Styling Details](#styling-details)
7. [Customization Options](#customization-options)
8. [Implementation Example](#implementation-example)

## Overview

The Grouple sidebar is a clean, dark-themed side navigation component featuring:
- Responsive design (mobile/desktop)
- Group selector with dropdown
- Channels list with icons
- Members section
- Settings button
- Clean, minimalist design language

![Sidebar Preview](https://via.placeholder.com/300x600/000000/FFFFFF?text=Sidebar+Preview)

## Required Dependencies

```bash
# Install required packages
npm install next-themes clsx tailwind-merge tailwindcss-animate lucide-react @radix-ui/react-slot class-variance-authority
# or with yarn
yarn add next-themes clsx tailwind-merge tailwindcss-animate lucide-react @radix-ui/react-slot class-variance-authority
```

## Theme Configuration

Add these color definitions to your Tailwind configuration:

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
      // Add animation keyframes if needed
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

## Utility Functions

Create the utility function for combining class names:

```ts
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Component Structure

### Base Button Component

```tsx
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Sidebar Component

```tsx
// components/Sidebar.tsx
"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, Group, Plus, Settings, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Channel type for structured data
type Channel = {
  id: string
  name: string
  icon: React.ReactNode
  href: string
}

// Props interface for the sidebar
interface SidebarProps {
  mobile?: boolean
  groupName?: string
  groupId?: string
  channels?: Channel[]
}

const Sidebar = ({ 
  mobile = false, 
  groupName = "Your Group", 
  groupId = "default",
  channels = [
    { id: "general", name: "General", icon: <Group size={18} />, href: "/channels/general" },
    { id: "announcements", name: "Announcements", icon: <Group size={18} />, href: "/channels/announcements" }
  ]
}: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div
      className={cn(
        "h-screen flex-col gap-y-10 sm:px-5 py-6",
        !mobile 
          ? "hidden bg-black md:w-[300px] fixed md:flex border-r border-themeGray/20" 
          : "w-full flex"
      )}
    >
      {/* Group selector with dropdown */}
      <div className="w-full flex items-center justify-between text-themeTextGray md:border-[1px] border-themeGray p-3 rounded-xl">
        <div className="flex gap-x-3 items-center">
          <div className="w-10 h-10 rounded-lg bg-themeGray flex items-center justify-center">
            {groupName.charAt(0)}
          </div>
          <p className="text-sm font-medium text-themeTextWhite">{groupName}</p>
        </div>
        <ChevronDown 
          size={18} 
          className="text-themeTextGray cursor-pointer hover:text-themeTextWhite transition-colors" 
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Channel section */}
      <div className="flex flex-col gap-y-5">
        <div className="flex justify-between items-center">
          <p className="text-xs text-themeTextWhite font-medium tracking-wider">CHANNELS</p>
          <Plus 
            size={16} 
            className="text-themeTextGray cursor-pointer hover:text-themeTextWhite transition-colors" 
          />
        </div>
        
        <div className="flex flex-col gap-y-1">
          {/* Map through channel items */}
          {channels.map((channel) => (
            <Link href={channel.href} key={channel.id}>
              <Button
                variant="ghost"
                className="flex gap-2 w-full justify-start hover:bg-themeGray items-center text-themeTextGray hover:text-themeTextWhite transition-colors py-2"
              >
                {channel.icon}
                <span className="truncate">{channel.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Members section */}
      <div className="flex flex-col gap-y-5 mt-4">
        <div className="flex justify-between items-center">
          <p className="text-xs text-themeTextWhite font-medium tracking-wider">MEMBERS</p>
          <Users 
            size={16} 
            className="text-themeTextGray cursor-pointer hover:text-themeTextWhite transition-colors" 
          />
        </div>
        
        {/* Members list would go here */}
        <div className="text-themeTextGray text-sm">
          {/* Placeholder for members list */}
          <p className="text-xs italic">No members online</p>
        </div>
      </div>

      {/* Settings button at bottom */}
      <div className="mt-auto pt-5 border-t border-themeGray/20">
        <Button
          variant="ghost"
          className="flex gap-2 w-full justify-start hover:bg-themeGray items-center text-themeTextGray hover:text-themeTextWhite"
        >
          <Settings size={18} />
          Settings
        </Button>
      </div>
    </div>
  )
}

export default Sidebar
```

### Mobile Layout

```tsx
// app/layout.tsx
"use client"
import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Menu Toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-full bg-themeGray text-themeTextWhite"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 bg-black z-40 transition-transform transform",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {isMobileMenuOpen && <Sidebar mobile />}
      </div>
      
      {/* Main Content */}
      <main className="flex-1 md:ml-[300px] bg-black min-h-screen p-6">
        {children}
      </main>
    </div>
  )
}
```

## Styling Details

The sidebar uses these key styling elements:

### Color Scheme
- **Background**: `bg-black` (Pure black)
- **Interactive Elements**: `themeGray` (`#27272A`)
- **Border Color**: `border-themeGray/20` (Semi-transparent borders)

### Typography
- **Headings**: `text-themeTextWhite` (`#F7ECE9`), uppercase, tracking-wider
- **Regular Text**: `text-themeTextGray` (`#B4B0AE`)
- **Font Size**: Text-xs for headings, text-sm for content
- **Font Weight**: Normal for content, medium for headings

### Layout
- **Width**: 300px on desktop (`md:w-[300px]`)
- **Height**: Full screen height (`h-screen`)
- **Padding**: `sm:px-5 py-6` (More padding on larger screens)
- **Spacing**: `gap-y-10` between major sections, `gap-y-5` between subsections
- **Positioning**: Fixed positioning on desktop (`fixed md:flex`)

### Interactive Elements
- **Buttons**: Ghost variant with hover background change
- **Hover States**: `hover:bg-themeGray` for buttons, `hover:text-themeTextWhite` for text
- **Transitions**: `transition-colors` for smooth color changes
- **Cursor**: `cursor-pointer` for clickable elements

### Responsive Behavior
- **Mobile**: Full width, toggleable with menu button
- **Desktop**: Fixed width, always visible
- **Transition**: Smooth slide animation for mobile menu

## Customization Options

### Changing Colors

To customize the sidebar's color scheme, update your Tailwind config:

```ts
// tailwind.config.ts
colors: {
  // Custom theme colors
  themeBlack: "#your-black-color",
  themeGray: "#your-gray-color",
  themeTextGray: "#your-text-gray-color",
  themeTextWhite: "#your-text-white-color",
}
```

### Adding Sections

To add new sections to the sidebar:

```tsx
// Add this inside the Sidebar component
<div className="flex flex-col gap-y-5 mt-4">
  <div className="flex justify-between items-center">
    <p className="text-xs text-themeTextWhite font-medium tracking-wider">MY CUSTOM SECTION</p>
    <CustomIcon 
      size={16} 
      className="text-themeTextGray cursor-pointer hover:text-themeTextWhite transition-colors" 
    />
  </div>
  
  <div className="flex flex-col gap-y-1">
    {/* Your custom section items */}
  </div>
</div>
```

### Channel Items Customization

To customize the channel items, modify the `channels` array:

```tsx
const customChannels = [
  { 
    id: "general", 
    name: "General Discussion", 
    icon: <ChatBubble size={18} />, 
    href: "/channels/general" 
  },
  { 
    id: "announcements", 
    name: "Announcements", 
    icon: <Bell size={18} />, 
    href: "/channels/announcements" 
  },
  { 
    id: "resources", 
    name: "Resources", 
    icon: <FileText size={18} />, 
    href: "/channels/resources" 
  }
];

// Then pass to the Sidebar component
<Sidebar channels={customChannels} />
```

### Adding Authentication

Incorporate user authentication by adding a user section at the bottom:

```tsx
{/* User profile section */}
<div className="mt-auto pt-5 border-t border-themeGray/20">
  <div className="flex items-center gap-x-3 px-2 py-3">
    <div className="w-8 h-8 rounded-full bg-themeGray flex items-center justify-center">
      {user?.initials || 'U'}
    </div>
    <div>
      <p className="text-sm text-themeTextWhite">{user?.name || 'User'}</p>
      <p className="text-xs text-themeTextGray">{user?.email || ''}</p>
    </div>
    <Button variant="ghost" size="icon" className="ml-auto">
      <LogOut size={16} className="text-themeTextGray" />
    </Button>
  </div>
</div>
```

## Implementation Example

Here's a complete implementation example for a page using the sidebar:

```tsx
// app/page.tsx
"use client"
import Sidebar from "@/components/Sidebar"
import { Group, FileText, MessageSquare } from "lucide-react"

export default function HomePage() {
  // Custom channels for this specific page
  const channels = [
    { id: "general", name: "General Discussion", icon: <MessageSquare size={18} />, href: "/channels/general" },
    { id: "resources", name: "Resources", icon: <FileText size={18} />, href: "/channels/resources" },
    { id: "welcome", name: "Welcome", icon: <Group size={18} />, href: "/channels/welcome" }
  ];

  return (
    <div className="flex h-screen bg-black">
      {/* Pass custom props to the sidebar */}
      <Sidebar 
        groupName="My Project" 
        groupId="project-1"
        channels={channels}
      />
      
      <main className="flex-1 md:ml-[300px] p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-themeTextWhite text-2xl font-bold mb-4">Welcome to My Project</h1>
          
          <div className="bg-themeGray/20 rounded-xl p-6">
            <p className="text-themeTextGray mb-4">
              Select a channel from the sidebar to get started with your project.
            </p>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="bg-themeDarkGray p-4 rounded-lg">
                <h3 className="text-themeTextWhite font-medium mb-2">Getting Started</h3>
                <p className="text-themeTextGray text-sm">
                  Check out our resources to help you get started with the platform.
                </p>
              </div>
              
              <div className="bg-themeDarkGray p-4 rounded-lg">
                <h3 className="text-themeTextWhite font-medium mb-2">Recent Updates</h3>
                <p className="text-themeTextGray text-sm">
                  View the latest updates and announcements for your project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

This document covers all aspects of implementing the Grouple project sidebar in your application. By following these instructions, you'll be able to create a sleek, modern sidebar that works well for community and group-based applications. 