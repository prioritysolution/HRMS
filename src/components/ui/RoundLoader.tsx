"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type RoundLoaderProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function RoundLoader({
  size = 52,
  strokeWidth = 4,
  className,
}: RoundLoaderProps) {
  const gradientId = useId();
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.3;

  return (
    <div
      className={cn("round-loader", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        className="round-loader-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="#7b93ff" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          className="round-loader-track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className="round-loader-arc"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        />
      </svg>
    </div>
  );
}
