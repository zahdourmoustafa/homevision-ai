import React from 'react'
import Image from 'next/image'
import {Button} from '@/components/ui/button'
import Link from 'next/link'

function EmptyState() {
  return (
    <div className='flex items-center justify-center mt-10 flex-col'>
      <Image src={'/room.png'} width={200} height={200} alt='room' className="opacity-80" />
      <h2 className='font-medium text-lg text-gray-600'>Create New AI Interior Design for your room</h2>
      <Link href='/dashboard/create-new'>
        <Button className="mt-5 bg-primary hover:bg-primary/90">Redesign Room</Button>
      </Link>
    </div>
  )
}

export default EmptyState
