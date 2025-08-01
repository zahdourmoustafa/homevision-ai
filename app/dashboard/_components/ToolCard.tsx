"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface ToolCardProps {
  title: string;
  description: string;
  image: string;
  badge?: string;
  tokens?: string;
  className?: string;
  link: string;
  tags?: string[];
}

export const ToolCard = React.memo(
  ({
    title,
    description,
    image,
    badge,
    tokens,
    className,
    link,
    tags,
  }: ToolCardProps) => {
    return (
      <div
        className={cn(
          "glass-card rounded-xl overflow-hidden hover-card p-4",
          className
        )}
      >
        <div className="relative h-48 mb-4">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
          />
          {badge && (
            <Badge
              className={cn(
                "absolute top-3 right-3",
                badge === "Available" ? "bg-green-500" : "bg-primary"
              )}
            >
              {badge}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
          <p className="text-sm text-gray-700">{description}</p>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs text-gray-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <Link href={link} prefetch={true}>
              <Button className="bg-primary hover:bg-primary/80">
                Launch Tool
              </Button>
            </Link>
            {tokens && (
              <span className="text-xs text-muted-foreground">{tokens}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ToolCard.displayName = "ToolCard";

export default ToolCard;
