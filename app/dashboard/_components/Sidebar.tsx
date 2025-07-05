"use client";

import React from "react";
import {
  Home,
  Image as ImageIcon,
  DollarSign,
  BookOpen,
  Library,
  Settings,
  LogOut,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Memoized navigation item component
const NavItem = React.memo(
  ({
    href,
    icon: Icon,
    children,
    ...props
  }: {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
    [key: string]: any;
  }) => (
    <Link href={href} prefetch={true}>
      <Button
        variant="ghost"
        className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
        {...props}
      >
        <Icon className="h-5 w-5" />
        {children}
      </Button>
    </Link>
  )
);

export const Sidebar = React.memo(() => {
  return (
    <div className="h-full flex flex-col gap-y-6 p-4 bg-blue-950 text-indigo-100 overflow-y-auto">
      <div className="flex items-center justify-center py-4">
        <span className="text-2xl font-bold text-white">InteriorAI</span>
      </div>

      <div className="flex flex-col items-center text-center gap-1 mb-4 px-2">
        <Button className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg py-2">
          <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro
        </Button>
      </div>

      <nav className="flex flex-col gap-y-1 flex-grow px-2">
        <NavItem href="/dashboard" icon={Home}>
          Home
        </NavItem>
        <NavItem href="/dashboard/create-new" icon={ImageIcon}>
          Design Studio
        </NavItem>
        <NavItem href="/dashboard/favorites" icon={ImageIcon}>
          My Gallery
        </NavItem>
        <NavItem href="#" icon={DollarSign}>
          Pricing
        </NavItem>
        <NavItem href="#" icon={BookOpen}>
          Tutorials
        </NavItem>
        <NavItem href="#" icon={Library}>
          Surface Library
        </NavItem>
        <NavItem href="#" icon={Library}>
          Product Library
        </NavItem>
      </nav>

      <div className="mt-auto flex flex-col gap-y-1 pb-4 px-2">
        <NavItem href="#" icon={Settings}>
          Settings
        </NavItem>
        <Button
          variant="ghost"
          className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";
