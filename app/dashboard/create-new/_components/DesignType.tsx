import React, { useState, memo } from 'react'
import Image from 'next/image'

interface DesignTypeProps {
  selectedDesign: (designName: string) => void;
}

const DesignCard = memo(({ design, isSelected, onClick }: { 
  design: { name: string; image: string; }, 
  isSelected: boolean, 
  onClick: () => void 
}) => (
  <div
    onClick={onClick}
    className={`flex flex-col items-center p-2 border rounded-lg space-y-1 cursor-pointer transition-all duration-200
      ${isSelected ? 'border-blue-500 bg-blue-100 hover:bg-blue-200' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-100'}`}
  >
    <div className="relative w-full h-20">
      <Image
        src={design.image}
        alt={design.name}
        fill
        className="object-cover rounded-lg"
        sizes="(max-width: 768px) 33vw, 20vw"
        priority={true}
      />
    </div>
    <span className={`text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
      {design.name}
    </span>
  </div>
));

DesignCard.displayName = 'DesignCard';

const Designs = [
  {
    name: "Modern",
    image: "/modern.png"
  },
  {
    name: "Industrial",
    image: "/industrial.png"
  },
  {
    name: "Bohemian",
    image: "/bohemian.png"
  },
  {
    name: "Traditional",
    image: "/traditional.png"
  },
  {
    name: "Rustic",
    image: "/rustic.png"
  },
  {
    name: "Minimalist",
    image: "/minimalist.png"
  },
] as const;

function DesignType({ selectedDesign }: DesignTypeProps) {
  const [selected, setSelected] = useState('');

  const handleSelect = (designName: string) => {
    setSelected(designName);
    selectedDesign(designName);
  };

  return (
    <div className="space-y-2 px-8 py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Design Style</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Designs.map((design) => (
          <DesignCard
            key={design.name}
            design={design}
            isSelected={selected === design.name}
            onClick={() => handleSelect(design.name)}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(DesignType);
