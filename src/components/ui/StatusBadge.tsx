import { cn } from "@/lib/utils";

const map = {
  success: "bg-soft-success",
  danger: "bg-soft-danger",
  warning: "bg-soft-warning",
  primary: "bg-soft-primary",
  info: "bg-soft-info",
  orange: "bg-soft-orange",
} as const;

export function StatusBadge({
  label,
  tone = "primary",
}: {
  label: string;
  tone?: keyof typeof map;
}) {
  return <span className={cn("badge", map[tone])}>{label}</span>;
}

export function statusTone(status: string) {
  const value = status.toLowerCase();
  if (["active", "present", "approved", "qualified", "paid"].includes(value)) {
    return "success" as const;
  }
  if (["pending", "late", "negotiation", "new"].includes(value)) {
    return "warning" as const;
  }
  if (["inactive", "absent", "rejected", "overdue"].includes(value)) {
    return "danger" as const;
  }
  if (["on leave", "leave"].includes(value)) {
    return "info" as const;
  }
  return "primary" as const;
}
