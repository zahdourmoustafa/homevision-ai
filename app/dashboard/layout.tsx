"use client";

import React from 'react'
import { ReactNode } from 'react';
import Header from './_components/Header';
import { Sidebar } from './_components/Sidebar';

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-white/80">
      <div className="fixed left-0 top-0 z-50">
        <Sidebar />
      </div>
      <div className="flex-1 ml-64">
        <div className="px-4 md:px-6 pt-16">    
            {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
