"use client";

import React from 'react'
import ToolCard from './_components/ToolCard'

const tools = [
  {
    title: "Interior",
    description: "Redesign places by taking a picture or uploading a reference photo for redesigned AI generations.",
    image: "/room.png",
    badge: "Popular",
    tokens: "1 token / generation",
    link: "/dashboard/create-new",
  },
  {
    title: "Sketch to Reality",
    description: "Transform your hand-drawn room sketches into photorealistic interior designs with AI.",
    image: "/sketch-room.png",
    badge: "New",
    tokens: "1 token / generation",
    link: "/dashboard/sketch-create-new",
  },
  {
    title: "Exterior",
    description: "Redesign places by taking a picture or uploading a reference photo for redesigned AI generations.",
    image: "/room.png",
    tokens: "1 token / generation",
    link: "/dashboard/create-new",
  },
]

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {tools.map((tool, index) => (
        <ToolCard
          key={index}
          title={tool.title}
          description={tool.description}
          image={tool.image}
          badge={tool.badge}
          tokens={tool.tokens}
          className="hover:shadow-lg transition-shadow duration-200"
          link={tool.link}
        />
      ))}
    </div>
  )
}

export default Dashboard


