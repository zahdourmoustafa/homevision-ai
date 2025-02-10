import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface RoomTypeProps {
  selectedRoomType: (value: string) => void;
}

function RoomType({ selectedRoomType }: RoomTypeProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">Room Type</label>
      <Select onValueChange={(value) => selectedRoomType(value)}>
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder="Select a room type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="living-room">Living Room</SelectItem>
          <SelectItem value="bedroom">Bedroom</SelectItem>
          <SelectItem value="kitchen">Kitchen</SelectItem>
          <SelectItem value="office">Office</SelectItem>
          <SelectItem value="bathroom">Bathroom</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default RoomType;
