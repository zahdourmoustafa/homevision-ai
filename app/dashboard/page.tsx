"use client";

import React from "react";
import ToolCard from "./_components/ToolCard";
import { useUser } from "@clerk/nextjs";

const tools = [
  {
    title: "Redecorate/Renovate a Room",
    description:
      "Reimagine interiors with fresh color schemes, layouts, and styles powered by AI.",
    image: "/room-redecorate.png",
    badge: "Available",
    link: "/dashboard/create-new",
    tags: ["Interior Redesign", "AI Styles", "Room Makeover"],
  },

  {
    title: "Animate a photo",
    description: "Obtain a 5-second video from a photo",
    image: "/structure-master.png",
    badge: "Available",
    link: "/dashboard/furnish-space",
    tags: ["Photo Animation", "Short Video", "Motion Effect"],
  },

  {
    title: "Furnish an empty space",
    description:
      "To arrange a space according to a chosen theme modern, industrial, Scandinavian Preserves the architecture of the room floor, walls... intact.",
    image: "/structure-master.png",
    badge: "Available",
    link: "/dashboard/furnish-space",
    tags: ["Empty Room Design", "AI Furniture", "Style Themes"],
  },

  {
    title: "Sketch to Reality",
    description:
      "Transform your hand-drawn sketches or blueprints into photorealistic exterior designs.",
    image: "/sketch-exterior.png",
    badge: "Available",
    link: "/dashboard/sketch-create-new",
    tags: ["AI Rendering", "Exterior Design", "Blueprint Conversion"],
  },
  {
    title: "Interior Style Transfer",
    description:
      "Apply different interior design styles to your existing room photos instantly.",
    image: "/style-transfer.png",
    badge: "Available",
    link: "/dashboard/create-new",
    tags: ["Style Application", "Virtual Staging", "Decor Suggestions"],
  },
  {
    title: "Wall Colorizer",
    description:
      "Visualize new wall colors in your room with realistic AI-powered previews.",
    image: "/wall-color.png",
    badge: "Available",
    link: "/dashboard/create-new",
    tags: ["Color Change", "Paint Preview", "Room Visualization"],
  },
];

function Dashboard() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        {user && (
          <p className="text-muted-foreground mb-2">
            Welcome back,{" "}
            {user.primaryEmailAddress?.emailAddress || user.fullName || "User"}
          </p>
        )}
        <h1 className="text-4xl font-bold mb-2 text-purple-700">
          Transform Your Designs with AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Choose a feature below to start creating stunning architectural
          visualizations powered by artificial intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool, index) => (
          <ToolCard
            key={index}
            title={tool.title}
            description={tool.description}
            image={tool.image}
            badge={tool.badge}
            tags={tool.tags}
            className="hover:shadow-lg transition-shadow duration-200"
            link={tool.link}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
