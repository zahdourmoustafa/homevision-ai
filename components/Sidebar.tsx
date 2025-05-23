"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Group, Plus } from "lucide-react";
import Link from "next/link";

// A simplified version of the sidebar component
const Sidebar = ({ mobile = false }) => {
  return (
    <div
      className={cn(
        "h-screen flex-col gap-y-10 sm:px-5",
        !mobile ? "hidden bg-black md:w-[300px] fixed md:flex" : "w-full flex"
      )}
    >
      {/* Dropdown/Group selector */}
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
          {/* Channel items */}
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
  );
};

export default Sidebar;
