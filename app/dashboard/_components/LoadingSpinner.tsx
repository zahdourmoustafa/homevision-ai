import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = "w-8 h-8",
  message = "Loading...",
}) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <Loader2 className={`animate-spin text-primary ${className}`} />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default LoadingSpinner;
