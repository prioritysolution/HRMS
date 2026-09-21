import type { AppLanguage, Dictionary, TranslationParams } from "@/i18n/types";
import { DEFAULT_LANGUAGE } from "@/i18n/config";

import enCommon from "@/i18n/locales/en/common.json";
import enTopbar from "@/i18n/locales/en/topbar.json";
import enProfile from "@/i18n/locales/en/profile.json";
import enAuth from "@/i18n/locales/en/auth.json";
import enEss from "@/i18n/locales/en/ess.json";
import enDashboard from "@/i18n/locales/en/dashboard.json";
import enHrms from "@/i18n/locales/en/hrms.json";
import enEmployees from "@/i18n/locales/en/employees.json";
import enLeave from "@/i18n/locales/en/leave.json";
import enAttendance from "@/i18n/locales/en/attendance.json";
import enReports from "@/i18n/locales/en/reports.json";
import enSettings from "@/i18n/locales/en/settings.json";
import enSecurity from "@/i18n/locales/en/security.json";
import enPayroll from "@/i18n/locales/en/payroll.json";
import bnCommon from "@/i18n/locales/bn/common.json";
import bnTopbar from "@/i18n/locales/bn/topbar.json";
import bnProfile from "@/i18n/locales/bn/profile.json";
import bnAuth from "@/i18n/locales/bn/auth.json";
import bnEss from "@/i18n/locales/bn/ess.json";
import bnDashboard from "@/i18n/locales/bn/dashboard.json";
import bnHrms from "@/i18n/locales/bn/hrms.json";
import bnEmployees from "@/i18n/locales/bn/employees.json";
import bnLeave from "@/i18n/locales/bn/leave.json";
import bnAttendance from "@/i18n/locales/bn/attendance.json";
import bnReports from "@/i18n/locales/bn/reports.json";
import bnSettings from "@/i18n/locales/bn/settings.json";
import bnSecurity from "@/i18n/locales/bn/security.json";
import bnPayroll from "@/i18n/locales/bn/payroll.json";
import hiCommon from "@/i18n/locales/hi/common.json";
import hiTopbar from "@/i18n/locales/hi/topbar.json";
import hiProfile from "@/i18n/locales/hi/profile.json";
import hiAuth from "@/i18n/locales/hi/auth.json";
import hiEss from "@/i18n/locales/hi/ess.json";
import hiDashboard from "@/i18n/locales/hi/dashboard.json";
import hiHrms from "@/i18n/locales/hi/hrms.json";
import hiEmployees from "@/i18n/locales/hi/employees.json";
import hiLeave from "@/i18n/locales/hi/leave.json";
import hiAttendance from "@/i18n/locales/hi/attendance.json";
import hiReports from "@/i18n/locales/hi/reports.json";
import hiSettings from "@/i18n/locales/hi/settings.json";
import hiSecurity from "@/i18n/locales/hi/security.json";
import hiPayroll from "@/i18n/locales/hi/payroll.json";
import orCommon from "@/i18n/locales/or/common.json";
import orTopbar from "@/i18n/locales/or/topbar.json";
import orProfile from "@/i18n/locales/or/profile.json";
import orAuth from "@/i18n/locales/or/auth.json";
import orEss from "@/i18n/locales/or/ess.json";
import orDashboard from "@/i18n/locales/or/dashboard.json";
import orHrms from "@/i18n/locales/or/hrms.json";
import orEmployees from "@/i18n/locales/or/employees.json";
import orLeave from "@/i18n/locales/or/leave.json";
import orAttendance from "@/i18n/locales/or/attendance.json";
import orReports from "@/i18n/locales/or/reports.json";
import orSettings from "@/i18n/locales/or/settings.json";
import orSecurity from "@/i18n/locales/or/security.json";
import orPayroll from "@/i18n/locales/or/payroll.json";

const dictionaries: Record<AppLanguage, Dictionary> = {
  en: {
    common: enCommon,
    topbar: enTopbar,
    profile: enProfile,
    auth: enAuth,
    ess: enEss,
    dashboard: enDashboard,
    hrms: enHrms,
    employees: enEmployees,
    leave: enLeave,
    attendance: enAttendance,
    reports: enReports,
    settings: enSettings,
    security: enSecurity,
    payroll: enPayroll,
  },
  bn: {
    common: bnCommon,
    topbar: bnTopbar,
    profile: bnProfile,
    auth: bnAuth,
    ess: bnEss,
    dashboard: bnDashboard,
    hrms: bnHrms,
    employees: bnEmployees,
    leave: bnLeave,
    attendance: bnAttendance,
    reports: bnReports,
    settings: bnSettings,
    security: bnSecurity,
    payroll: bnPayroll,
  },
  hi: {
    common: hiCommon,
    topbar: hiTopbar,
    profile: hiProfile,
    auth: hiAuth,
    ess: hiEss,
    dashboard: hiDashboard,
    hrms: hiHrms,
    employees: hiEmployees,
    leave: hiLeave,
    attendance: hiAttendance,
    reports: hiReports,
    settings: hiSettings,
    security: hiSecurity,
    payroll: hiPayroll,
  },
  or: {
    common: orCommon,
    topbar: orTopbar,
    profile: orProfile,
    auth: orAuth,
    ess: orEss,
    dashboard: orDashboard,
    hrms: orHrms,
    employees: orEmployees,
    leave: orLeave,
    attendance: orAttendance,
    reports: orReports,
    settings: orSettings,
    security: orSecurity,
    payroll: orPayroll,
  },
};

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}

export function getDictionary(language: AppLanguage): Dictionary {
  return dictionaries[language] ?? dictionaries[DEFAULT_LANGUAGE];
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: TranslationParams,
): string {
  const primary = readPath(getDictionary(language), key);
  const fallback =
    language === DEFAULT_LANGUAGE
      ? undefined
      : readPath(getDictionary(DEFAULT_LANGUAGE), key);

  const value =
    typeof primary === "string"
      ? primary
      : typeof fallback === "string"
        ? fallback
        : key;

  return interpolate(value, params);
}
