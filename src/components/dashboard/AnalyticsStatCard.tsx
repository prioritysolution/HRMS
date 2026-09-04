"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Smile,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DashboardTrend } from "@/lib/api/types";

const iconMap: LucideIcon[] = [Users, UserPlus, UserMinus, Smile, UserX, UserCheck];

const tones = {
  primary: "avatar-soft-primary",
  info: "avatar-soft-info",
  success: "avatar-soft-success",
  warning: "avatar-soft-warning",
  danger: "avatar-soft-danger",
  orange: "avatar-soft-orange",
} as const;

type Props = {
  title: string;
  value: string;
  change: string;
  hint: string;
  description: string;
  tone: keyof typeof tones;
  positive: boolean;
  trend?: DashboardTrend;
  iconIndex: number;
  href?: string;
};

export function AnalyticsStatCard({
  title,
  value,
  change,
  hint,
  description,
  tone,
  positive,
  trend = "flat",
  iconIndex,
  href,
}: Props) {
  const Icon = iconMap[iconIndex] ?? Users;
  const badgeTone =
    trend === "flat" ? "bg-soft-info" : positive ? "bg-soft-success" : "bg-soft-danger";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : ArrowRight;

  const content = (
    <div className="card h-full transition-shadow hover:shadow-md">
      <div className="card-body">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className={cn("avatar avatar-xxxl custom-avatar", tones[tone])}>
            <Icon size={32} strokeWidth={1.5} />
          </div>
          <div className="text-right">
            <h3 className="m-0 text-[1.65rem] font-extrabold text-[var(--title)]">{value}</h3>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className={cn("badge", badgeTone)}>
                <TrendIcon size={12} />
                {change}
              </span>
              <small className="text-muted">{hint}</small>
            </div>
          </div>
        </div>
        <hr className="br-dashed" />
        <div>
          <h5 className="m-0 text-[1.05rem] font-semibold text-[var(--title)]">{title}</h5>
          <small className="text-muted">{description}</small>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
