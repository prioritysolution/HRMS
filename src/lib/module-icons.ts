import {
  AlertCircle,
  Award,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  ClipboardList,
  Clock,
  Clock3,
  Cog,
  FileCheck,
  FileText,
  GitBranch,
  Hammer,
  History,
  IndianRupee,
  Landmark,
  Monitor,
  Inbox,
  Package,
  Layers,
  LayoutDashboard,
  LogIn,
  Receipt,
  ShieldCheck,
  Tags,
  Timer,
  UserCircle,
  UserPlus,
  Users,
  Wallet,
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
  "asset-allocation": Package,
  assets: ClipboardList,
  devices: Monitor,
  "attendance-dashboard": LayoutDashboard,
  "daily-attendance": CalendarCheck,
  "monthly-attendance": CalendarRange,
  "attendance-processing": Cog,
  "attendance-calendar": CalendarDays,
  "attendance-sources": Monitor,
  "attendance-register": ClipboardList,
  "check-in-out": LogIn,
  regularization: FileCheck,
  "missing-punch": AlertCircle,
  overtime: Timer,
  "attendance-shifts": Clock3,
  "attendance-rules": ShieldCheck,
  "on-duty": Briefcase,
  holidays: CalendarDays,
  "weekly-off": CalendarOff,
  "leave-master": Tags,
  "leave-policy": ShieldCheck,
  "leave-allocation": ClipboardList,
  "leave-application": FileText,
  "leave-approval": FileCheck,
  "leave-calendar": CalendarDays,
  "leave-encashment": Wallet,
  "payroll-salary-components": Tags,
  "payroll-salary-structure": Layers,
  "payroll-salary-revision": History,
  "payroll-processing": Cog,
  "payroll-finalization": Landmark,
  "payroll-payslip-bank": Receipt,
  "ess-attendance": CalendarCheck,
  "ess-leave-apply": FileText,
  "ess-leave-balance": ClipboardList,
  "ess-payslips": Receipt,
  "ess-holidays": CalendarDays,
  "ess-tax": IndianRupee,
  "ess-assets": Package,
  "ess-performance": Award,
  "ess-reimbursement": Wallet,
  "ess-requests": FileCheck,
  "ess-service-history": History,
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
  if (normalized.includes("payroll") || normalized.includes("payslip") || normalized.includes("salary")) {
    return IndianRupee;
  }
  if (normalized.includes("attendance")) return Clock3;
  if (normalized.includes("employee")) return Users;
  if (normalized.includes("department")) return Layers;
  if (normalized.includes("organization")) return Building2;
  if (normalized.includes("branch")) return GitBranch;
  if (normalized.includes("holiday")) return CalendarDays;

  return Inbox;
}
