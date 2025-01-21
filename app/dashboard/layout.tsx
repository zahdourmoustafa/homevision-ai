import React from 'react'

import { ReactNode } from 'react';
import Header from './_components/Header';

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div>
        <Header/>
        <div className='pt-20 px-10 md:px-10 lg:px-40 xl:px-60'>    
            {children} </div>

    </div>
  )
}

export default DashboardLayout
