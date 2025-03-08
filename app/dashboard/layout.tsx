"use client";

import React from 'react'
import { ReactNode } from 'react';
import { Sidebar } from './_components/Sidebar';

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-white/80">
      <div className="fixed left-0 top-0 z-50">
        <Sidebar />
      </div>
      <div className="flex-1 ml-64">
        <div className=" pt-10">    
            {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
