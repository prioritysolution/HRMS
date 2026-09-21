import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "default" | "circular" | "rounded" | "text";
}

export function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "ui-skeleton",
        variant === "circular" && "rounded-full",
        variant === "rounded" && "rounded-xl",
        variant === "text" && "h-3.5 rounded",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
