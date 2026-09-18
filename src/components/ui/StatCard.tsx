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
import { useI18n, translateModuleStat } from "@/i18n";

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
  loading?: boolean;
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
  loading = false,
}: StatCardProps) {
  const { language } = useI18n();
  const Icon = icons[icon] ?? Users;
  const displayTitle = translateModuleStat(language, title, "title", title);
  const displayHint = translateModuleStat(language, title, "hint", hint);
  const displayDescription = translateModuleStat(language, title, "description", description);

  if (loading) {
    return (
      <div className="card stat-card h-full select-none" aria-busy="true">
        <div className="card-body flex flex-col justify-between h-full">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="ui-skeleton w-14 h-14 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 flex flex-col items-end">
              <div className="ui-skeleton h-7 w-20 rounded-lg" />
              <div className="ui-skeleton h-3 w-12 rounded" />
            </div>
          </div>
          <div className="mt-auto space-y-1.5 pt-2 border-t border-[var(--border)]">
            <div className="ui-skeleton h-4 w-28 rounded" />
            <div className="ui-skeleton h-3 w-36 rounded" />
          </div>
        </div>
      </div>
    );
  }

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
              {change ? (
                <span
                  className={cn(
                    "badge",
                    positive ? "bg-soft-success" : "bg-soft-danger",
                  )}
                >
                  {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {change}
                </span>
              ) : null}
              <small className="text-muted">{displayHint}</small>
            </div>
          </div>
        </div>
        <hr className="br-dashed" />
        <div>
          <h5 className="m-0 text-[1.05rem] font-semibold text-[var(--title)]">
            {displayTitle}
          </h5>
          <small className="text-muted">{displayDescription}</small>
        </div>
      </div>
    </div>
  );
}
