"use client";

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

export function Sidebar() {
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
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <Home className="h-5 w-5" />
            Home
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <ImageIcon className="h-5 w-5" />
            Design Studio
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <ImageIcon className="h-5 w-5" />
            My Gallery
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <DollarSign className="h-5 w-5" />
            Pricing
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <BookOpen className="h-5 w-5" />
            Tutorials
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <Library className="h-5 w-5" />
            Surface Library
          </Button>
        </Link>
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <Library className="h-5 w-5" />
            Product Library
          </Button>
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-y-1 pb-4 px-2">
        <Link href="#">
          <Button
            variant="ghost"
            className="w-full justify-start gap-x-3 text-indigo-100 hover:bg-indigo-800 hover:text-white rounded-lg px-3 py-2"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </Link>
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
}
