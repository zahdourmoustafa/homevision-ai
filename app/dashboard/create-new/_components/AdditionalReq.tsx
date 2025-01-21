import React from 'react'
import {Textarea} from '@/components/ui/textarea'
 
function AdditionalReq({ AdditionalReq }: { AdditionalReq: (value: string) => void }) {
  return (
    <div className='mt-5'>
        <label className='text-gray-400'>Enter Additional Requirements (optional)</label>
        <Textarea className="mt-2" onChange={(e) => AdditionalReq(e.target.value)}/>
    </div>
  )
}

export default AdditionalReq
