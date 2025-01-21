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
        <div className="space-y-3">
            <label className="text-gray-700 font-medium">Select Interior Design Type *</label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Designs.map((design) => (
                    <div 
                        key={design.name} 
                        onClick={() => handleSelect(design.name)}
                        className={`flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 space-y-3 cursor-pointer transition-all
                            ${selected === design.name ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                    >
                        <div className="relative w-full h-32">
                            <Image 
                                src={design.image} 
                                alt={design.name}
                                fill
                                className="object-cover rounded-lg" 
                            />
                        </div>
                        <span className="text-gray-700 font-semibold">
                            {design.name}
                        </span>
                    </div>
                ))} 
            </div>
        </div>
    )
}

export default DesignType
