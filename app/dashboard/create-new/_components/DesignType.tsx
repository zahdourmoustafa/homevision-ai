import React, { useState } from 'react'
import Image from 'next/image'

interface DesignTypeProps {
  selectedDesign: (value: string) => void;
}

function DesignType({ selectedDesign }: DesignTypeProps) {
    const [selected, setSelected] = useState<string>('');
    
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
    ]

    const handleSelect = (designName: string) => {
        setSelected(designName);
        selectedDesign(designName);
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Design Style</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Designs.map((design) => (
                    <div 
                        key={design.name} 
                        onClick={() => handleSelect(design.name)}
                        className={`flex flex-col items-center p-2 border rounded-lg hover:bg-gray-50 space-y-1 cursor-pointer transition-all
                            ${selected === design.name ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                    >
                        <div className="relative w-full h-20">
                            <Image 
                                src={design.image} 
                                alt={design.name}
                                fill
                                className="object-cover rounded-lg" 
                            />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                            {design.name}
                        </span>
                    </div>
                ))} 
            </div>
        </div>
    )
}

export default DesignType
