"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Clock3,
  TrendingDown,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  users: Users,
  userPlus: UserPlus,
  trendingDown: TrendingDown,
  briefcase: Briefcase,
  clock: Clock3,
  calendar: CalendarDays,
};

const tones = {
  primary: "avatar-soft-primary",
  info: "avatar-soft-info",
  success: "avatar-soft-success",
  warning: "avatar-soft-warning",
  danger: "avatar-soft-danger",
  orange: "avatar-soft-orange",
} as const;

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  hint: string;
  description: string;
  tone: keyof typeof tones;
  icon: keyof typeof icons;
  positive?: boolean;
};

export function StatCard({
  title,
  value,
  change,
  hint,
  description,
  tone,
  icon,
  positive = true,
}: StatCardProps) {
  const Icon = icons[icon] ?? Users;
  return (
    <div className="card stat-card h-full">
      <div className="card-body">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className={cn("avatar avatar-xxl", tones[tone])}>
            <Icon size={28} strokeWidth={1.75} />
          </div>
          <div className="text-right">
            <h3 className="m-0 text-[1.65rem] font-extrabold text-[var(--title)]">
              {value}
            </h3>
            <div className="mt-1 flex items-center justify-end gap-1">
              <span
                className={cn(
                  "badge",
                  positive ? "bg-soft-success" : "bg-soft-danger",
                )}
              >
                {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {change}
              </span>
              <small className="text-muted">{hint}</small>
            </div>
          </div>
        </div>
        <hr className="br-dashed" />
        <div>
          <h5 className="m-0 text-[1.05rem] font-semibold text-[var(--title)]">
            {title}
          </h5>
          <small className="text-muted">{description}</small>
        </div>
      </div>
    </div>
  );
}
