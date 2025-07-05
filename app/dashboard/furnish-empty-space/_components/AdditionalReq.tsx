import React from 'react'
import { Textarea } from '@/components/ui/textarea'

interface AdditionalReqProps {
  AdditionalReq: (value: string) => void;
}

function AdditionalReq({ AdditionalReq }: AdditionalReqProps) {
  return (
    <div className="space-y-2 px-8 py-4">
      <h2 className="text-xl font-semibold text-gray-900">Enter Additional Requirements (optional)</h2>
      <Textarea 
        placeholder="Enter any specific requirements or preferences (optional)" 
        className="resize-none"
        rows={3}
        onChange={(e) => AdditionalReq(e.target.value)}
      />
    </div>
  )
}

export default AdditionalReq
