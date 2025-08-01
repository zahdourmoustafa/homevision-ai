"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ReactNode } from "react";
import { Sidebar } from "./_components/Sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Memoize the sidebar to prevent unnecessary re-renders
const MemoizedSidebar = React.memo(Sidebar);

function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const sidebarClasses = useMemo(
    () =>
      cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      ),
    [isSidebarOpen]
  );

  const mainClasses = useMemo(
    () =>
      cn(
        "flex-1 transition-all duration-300 ease-in-out bg-white",
        isSidebarOpen ? "ml-64" : "ml-0"
      ),
    [isSidebarOpen]
  );

  return (
    <div className="flex bg-background min-h-screen">
      <div className={sidebarClasses}>
        <MemoizedSidebar />
      </div>

      <div className={mainClasses}>
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <div>{/* Placeholder for other header items */}</div>
        </header>

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

export default React.memo(DashboardLayout);
