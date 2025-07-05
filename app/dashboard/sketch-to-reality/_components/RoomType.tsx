import React, { memo } from 'react'
import { roomTypes } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RoomTypeProps {
  selectedRoomType: (value: string) => void;
}

const RoomType = memo(({ selectedRoomType }: RoomTypeProps) => {
  return (
    <div className="space-y-2 px-8 py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Room Type</h2>
      <Select onValueChange={selectedRoomType}>
        <SelectTrigger className="font-bold focus:ring-2 focus:ring-blue-500 transition-shadow">
          <SelectValue placeholder="Select a room type" />
        </SelectTrigger>
        <SelectContent>
          {roomTypes.map((room) => (
            <SelectItem 
              key={room.value} 
              value={room.value}
              className="cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {room.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
});

RoomType.displayName = 'RoomType';

export default RoomType;
