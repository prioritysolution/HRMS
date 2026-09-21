"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CalendarRange,
  CircleAlert,
  Layers,
  ShieldAlert,
  Split,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import type { LeaveSettingsRecord } from "@/lib/api/types";
import { leaveSettingsService } from "@/lib/api/services/leave-settings.service";
import type { FormValue } from "@/lib/form-validation";
import { useI18n } from "@/i18n";

const OPTIONS = [
  {
    name: "apply_future_leave" as const,
    icon: CalendarRange,
  },
  {
    name: "apply_previous_leave" as const,
    icon: CalendarClock,
  },
  {
    name: "half_day_allowed" as const,
    icon: Split,
  },
  {
    name: "apply_during_probation" as const,
    icon: ShieldAlert,
  },
  {
    name: "reason_mandatory" as const,
    icon: CircleAlert,
  },
  {
    name: "prevent_overlapping_leave" as const,
    icon: Layers,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toFormValues(data: LeaveSettingsRecord): Record<string, FormValue> {
  return {
    apply_future_leave: String(data.apply_future_leave ?? "0"),
    apply_previous_leave: String(data.apply_previous_leave ?? "0"),
    half_day_allowed: String(data.half_day_allowed ?? "0"),
    apply_during_probation: String(data.apply_during_probation ?? "0"),
    reason_mandatory: String(data.reason_mandatory ?? "0"),
    prevent_overlapping_leave: String(data.prevent_overlapping_leave ?? "0"),
  };
}

export default function LeaveSettingsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>({
    apply_future_leave: "1",
    apply_previous_leave: "1",
    half_day_allowed: "1",
    apply_during_probation: "1",
    reason_mandatory: "1",
    prevent_overlapping_leave: "1",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const result = await leaveSettingsService.get();
        if (cancelled) return;
        if (result.data) setValues(toFormValues(result.data));
        if (!result.ok) {
          toast.error({
            title: t("settings.common.loadFailed"),
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: t("settings.common.loadFailed"),
          message: t("settings.leave.loadError"),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [toast, t]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await leaveSettingsService.update({
        apply_future_leave: toFlag(values.apply_future_leave),
        apply_previous_leave: toFlag(values.apply_previous_leave),
        half_day_allowed: toFlag(values.half_day_allowed),
        apply_during_probation: toFlag(values.apply_during_probation),
        reason_mandatory: toFlag(values.reason_mandatory),
        prevent_overlapping_leave: toFlag(values.prevent_overlapping_leave),
      });
      if (!result.ok || !result.data) {
        toast.error({
          title: t("settings.common.saveFailed"),
          message: result.message,
        });
        return;
      }
      setValues(toFormValues(result.data));
      toast.success({ title: t("settings.common.saved"), message: result.message });
    } catch {
      toast.error({
        title: t("settings.common.saveFailed"),
        message: t("settings.leave.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("settings.leave.title")}
        section={t("settings.common.section")}
        hideTitle
      />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.leave.title")} />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("settings.leave.loading")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.leave.title")} />

              <form id="leave-settings-form" onSubmit={(event) => void handleSave(event)}>
                <div className="notification-option-list">
                  {OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div key={option.name} className="notification-option">
                        <div className="notification-option-main">
                          <div className="avatar avatar-soft-primary">
                            <Icon size={18} />
                          </div>
                          <div className="notification-option-copy">
                            <h6>{t(`settings.leave.options.${option.name}.label`)}</h6>
                            <p>{t(`settings.leave.options.${option.name}.description`)}</p>
                          </div>
                        </div>
                        <StatusToggle
                          name={option.name}
                          value={String(values[option.name] ?? "0")}
                          activeLabel={t("common.yes")}
                          inactiveLabel={t("common.no")}
                          onChange={(nextValue) =>
                            setValues((prev) => ({ ...prev, [option.name]: nextValue }))
                          }
                          disabled={saving}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? t("settings.common.saving") : t("settings.common.saveSettings")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
