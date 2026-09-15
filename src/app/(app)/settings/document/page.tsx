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
import type { DocumentSettings } from "@/data/settings-mock";
import { documentSettingsService } from "@/lib/api/services/document-settings.service";
import type { FormValue } from "@/lib/form-validation";

const OPTIONS = [
  {
    name: "approval_required" as const,
    label: "Approval Required",
    description: "Require approval before a document can be finalized.",
    icon: CheckCircle2,
  },
  {
    name: "allow_edit_after_approval" as const,
    label: "Allow Edit After Approval",
    description: "Allow users to edit a document after it has been approved.",
    icon: FilePenLine,
  },
  {
    name: "allow_cancel_after_approval" as const,
    label: "Allow Cancel After Approval",
    description: "Allow users to cancel a document after it has been approved.",
    icon: Ban,
  },
  {
    name: "allow_reprint" as const,
    label: "Allow Reprint",
    description: "Allow reprinting of already printed documents.",
    icon: Printer,
  },
  {
    name: "show_duplicate_on_reprint" as const,
    label: 'Show "Duplicate" on Reprint',
    description: 'Mark reprinted documents with a "Duplicate" watermark or label.',
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
            title: "Unable to load settings",
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: "Unable to load settings",
          message: "Failed to load document settings. Please try again.",
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
      const result = await documentSettingsService.update({
        approval_required: toFlag(values.approval_required),
        allow_edit_after_approval: toFlag(values.allow_edit_after_approval),
        allow_cancel_after_approval: toFlag(values.allow_cancel_after_approval),
        allow_reprint: toFlag(values.allow_reprint),
        show_duplicate_on_reprint: toFlag(values.show_duplicate_on_reprint),
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
        message: "Failed to save document settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Document Settings" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Document Settings" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading document settings…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Document Settings" />

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
