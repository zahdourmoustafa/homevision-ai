"use client"
import React, {useState} from 'react'
import { Button } from "@/components/ui/button"
import EmptyState from './EmptyState'
import Link from 'next/link'
function Listing() {

    const [userRoomList, setuserRoomList] = useState([]);
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='font-bold text-3xl'>Hello ,</h2>
        <Link href='/dashboard/create-new'>
        <Button> Redesign Room</Button>
        </Link>
      </div>

      {userRoomList?.length === 0 ? 
        <EmptyState />
      : (
        <div>{/* listing */}</div>
      )}
    </div>
  )
}

export default Listing
