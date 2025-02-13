"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface ToolCardProps {
  title: string;
  description: string;
  image: string;
  badge?: string;
  tokens?: string;
  className?: string;
  link: string;
}

export function ToolCard({ title, description, image, badge, tokens, className, link }: ToolCardProps) {
  return (
    <div className={cn("glass-card rounded-xl overflow-hidden hover-card p-4", className)}>
      <div className="relative h-48 mb-4">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {badge && (
          <Badge className="absolute top-3 right-3 bg-primary">
            {badge}
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center justify-between pt-2">
          <Link href={link}>
            <Button className="bg-primary hover:bg-primary/90">
              Launch Tool
            </Button>
          </Link>
          {tokens && (
            <span className="text-xs text-muted-foreground">
              {tokens}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolCard; 