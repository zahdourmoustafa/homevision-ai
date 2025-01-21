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
    <div className="space-y-2">
      <label 
        htmlFor="room-type" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        Room Type *
      </label>
      <Select onValueChange={(value) => selectedRoomType(value)}>
        <SelectTrigger 
          id="room-type" 
          className="w-full md:w-[280px] focus:ring-2 focus:ring-primary font-bold"
        >
          <SelectValue placeholder="Select a room type" />
        </SelectTrigger>
        <SelectContent className="font-medium">
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
