"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Copy,
  FilePenLine,
  Printer,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import type { DocumentSettings } from "@/lib/api/services/document-settings.service";
import { documentSettingsService } from "@/lib/api/services/document-settings.service";
import type { FormValue } from "@/lib/form-validation";
import { useI18n } from "@/i18n";

const OPTIONS = [
  {
    name: "approval_required" as const,
    icon: CheckCircle2,
  },
  {
    name: "allow_edit_after_approval" as const,
    icon: FilePenLine,
  },
  {
    name: "allow_cancel_after_approval" as const,
    icon: Ban,
  },
  {
    name: "allow_reprint" as const,
    icon: Printer,
  },
  {
    name: "show_duplicate_on_reprint" as const,
    icon: Copy,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toFormValues(data: DocumentSettings): Record<string, FormValue> {
  return {
    approval_required: String(data.approval_required),
    allow_edit_after_approval: String(data.allow_edit_after_approval),
    allow_cancel_after_approval: String(data.allow_cancel_after_approval),
    allow_reprint: String(data.allow_reprint),
    show_duplicate_on_reprint: String(data.show_duplicate_on_reprint),
  };
}

export default function DocumentSettingsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>({
    approval_required: "1",
    allow_edit_after_approval: "0",
    allow_cancel_after_approval: "0",
    allow_reprint: "1",
    show_duplicate_on_reprint: "1",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const result = await documentSettingsService.get();
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
          message: t("settings.document.loadError"),
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
      const result = await documentSettingsService.update({
        approval_required: toFlag(values.approval_required),
        allow_edit_after_approval: toFlag(values.allow_edit_after_approval),
        allow_cancel_after_approval: toFlag(values.allow_cancel_after_approval),
        allow_reprint: toFlag(values.allow_reprint),
        show_duplicate_on_reprint: toFlag(values.show_duplicate_on_reprint),
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
        message: t("settings.document.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("settings.document.title")}
        section={t("settings.common.section")}
        hideTitle
      />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.document.title")} />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("settings.document.loading")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.document.title")} />

              <form id="document-settings-form" onSubmit={(event) => void handleSave(event)}>
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
                            <h6>{t(`settings.document.options.${option.name}.label`)}</h6>
                            <p>{t(`settings.document.options.${option.name}.description`)}</p>
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
