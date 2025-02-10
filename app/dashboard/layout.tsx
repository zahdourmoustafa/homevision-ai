import React from 'react'

import { ReactNode } from 'react';
import Header from './_components/Header';

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
        <Header/>
        <div className="px-3 md:px-10">    
            {children} </div>

    </div>
  )
}

export default DashboardLayout
