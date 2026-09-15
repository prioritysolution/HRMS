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
import type { LeaveSettings } from "@/data/settings-mock";
import { leaveSettingsService } from "@/lib/api/services/leave-settings.service";
import type { FormValue } from "@/lib/form-validation";

const OPTIONS = [
  {
    name: "apply_for_future_leave" as const,
    label: "Apply for Future Leave",
    description: "Allow employees to apply leave for future dates.",
    icon: CalendarRange,
  },
  {
    name: "apply_for_previous_date_leave" as const,
    label: "Apply for Previous-date Leave",
    description: "Allow employees to apply leave for past dates.",
    icon: CalendarClock,
  },
  {
    name: "half_day_leave_allowed" as const,
    label: "Half-day Leave Allowed",
    description: "Allow employees to apply half-day leave.",
    icon: Split,
  },
  {
    name: "apply_during_probation" as const,
    label: "Apply During Probation",
    description: "Allow leave applications while an employee is on probation.",
    icon: ShieldAlert,
  },
  {
    name: "reason_mandatory" as const,
    label: "Reason Mandatory",
    description: "Require a reason when submitting a leave application.",
    icon: CircleAlert,
  },
  {
    name: "prevent_overlapping_leave" as const,
    label: "Prevent Overlapping Leave",
    description: "Block leave applications that overlap with existing leave.",
    icon: Layers,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toFormValues(data: LeaveSettings): Record<string, FormValue> {
  return {
    apply_for_future_leave: String(data.apply_for_future_leave),
    apply_for_previous_date_leave: String(data.apply_for_previous_date_leave),
    half_day_leave_allowed: String(data.half_day_leave_allowed),
    apply_during_probation: String(data.apply_during_probation),
    reason_mandatory: String(data.reason_mandatory),
    prevent_overlapping_leave: String(data.prevent_overlapping_leave),
  };
}

export default function LeaveSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>({
    apply_for_future_leave: "1",
    apply_for_previous_date_leave: "1",
    half_day_leave_allowed: "1",
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
            title: "Unable to load settings",
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: "Unable to load settings",
          message: "Failed to load leave settings. Please try again.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await leaveSettingsService.update({
        apply_for_future_leave: toFlag(values.apply_for_future_leave),
        apply_for_previous_date_leave: toFlag(values.apply_for_previous_date_leave),
        half_day_leave_allowed: toFlag(values.half_day_leave_allowed),
        apply_during_probation: toFlag(values.apply_during_probation),
        reason_mandatory: toFlag(values.reason_mandatory),
        prevent_overlapping_leave: toFlag(values.prevent_overlapping_leave),
      });
      if (!result.ok || !result.data) {
        toast.error({
          title: "Save failed",
          message: result.message,
        });
        return;
      }
      setValues(toFormValues(result.data));
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save leave settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Leave Settings" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Leave Settings" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading leave settings…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Leave Settings" />

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
                            <h6>{option.label}</h6>
                            <p>{option.description}</p>
                          </div>
                        </div>
                        <StatusToggle
                          name={option.name}
                          value={String(values[option.name] ?? "0")}
                          activeLabel="Yes"
                          inactiveLabel="No"
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
                    {saving ? "Saving..." : "Save Settings"}
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
