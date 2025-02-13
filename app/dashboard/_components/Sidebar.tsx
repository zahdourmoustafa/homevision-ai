"use client";

import { Home, Layout, Box, Settings, Star, Code, UserCog, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";

const menuItems = [
  { icon: Home, label: "Dashboard", active: true, href: "/dashboard" },
  { icon: Star, label: "Favorites", href: "/dashboard/favorites" },
];

export function Sidebar() {
  const { openUserProfile, signOut } = useClerk();
  
  return (
    <div className="w-64 h-screen bg-white p-4 fixed left-0 top-0 border-r border-gray-100 z-40">
      <div className="flex items-center gap-2 mb-8">
      <div className="flex gap-2 items-center">
        <Image src={"/logo.svg"} width={40} height={40} alt="logo" />
        <h2 className="font-bold text-lg text-gray-900">AI Roomify</h2>
      </div>
      </div>
      
      <div className="flex flex-col h-[calc(100%-6rem)] justify-between">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                item.active
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <button
            onClick={() => openUserProfile()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:bg-gray-50"
          >
            <UserCog className="w-5 h-5" />
            <span>Manage Account</span>
          </button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}