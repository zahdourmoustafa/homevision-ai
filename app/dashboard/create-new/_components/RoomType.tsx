import React from 'react'
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

interface RoomType {
  value: string;
  label: string;
  image: string;
}

function RoomType({ selectedRoomType }: RoomTypeProps) {
  return (
    <div className="space-y-2 px-8 py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Room Type</h2>
      <Select onValueChange={selectedRoomType}>
        <SelectTrigger className="font-bold">
          <SelectValue placeholder="Select a room type" />
        </SelectTrigger>
        <SelectContent>
          {roomTypes.map((room: RoomType) => (
            <SelectItem key={room.value} value={room.value}>
              {room.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default RoomType
