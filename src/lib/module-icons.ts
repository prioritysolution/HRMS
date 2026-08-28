import {
  AlertCircle,
  Award,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  Clock,
  Clock3,
  FileCheck,
  FileText,
  GitBranch,
  Hammer,
  History,
  IndianRupee,
  Inbox,
  Layers,
  LayoutDashboard,
  LogIn,
  ShieldCheck,
  Tags,
  Timer,
  UserCircle,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

const MODULE_ICONS: Record<string, LucideIcon> = {
  organization: Building2,
  branches: GitBranch,
  departments: Layers,
  designations: Briefcase,
  grades: Award,
  "employee-categories": Tags,
  "employment-types": FileText,
  "job-types": Hammer,
  shifts: Clock,
  "salary-grades": IndianRupee,
  employees: Users,
  "employee-profile": UserCircle,
  onboarding: UserPlus,
  "service-history": History,
  "attendance-dashboard": LayoutDashboard,
  "daily-attendance": CalendarCheck,
  "attendance-register": ClipboardList,
  "check-in-out": LogIn,
  regularization: FileCheck,
  "missing-punch": AlertCircle,
  overtime: Timer,
  "attendance-shifts": Clock3,
  "attendance-rules": ShieldCheck,
  holidays: CalendarDays,
  "weekly-off": CalendarOff,
};

export function getModuleEmptyIcon(moduleId?: string): LucideIcon {
  if (moduleId && MODULE_ICONS[moduleId]) {
    return MODULE_ICONS[moduleId];
  }
  return Inbox;
}

export function getEmptyIconByTitle(title: string): LucideIcon {
  const normalized = title.toLowerCase();

  if (normalized.includes("leave")) return CalendarOff;
  if (normalized.includes("attendance")) return Clock3;
  if (normalized.includes("employee")) return Users;
  if (normalized.includes("department")) return Layers;
  if (normalized.includes("organization")) return Building2;
  if (normalized.includes("branch")) return GitBranch;
  if (normalized.includes("holiday")) return CalendarDays;

  return Inbox;
}
