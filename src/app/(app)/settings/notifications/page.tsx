"use client";

import { useEffect, useState } from "react";
import { Mail, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { notificationSettingsService } from "@/lib/api/services/notification-settings.service";
import type { FormValue } from "@/lib/form-validation";

const CHANNELS = [
  {
    name: "email_notification",
    label: "Email Notification",
    description: "Send alerts and updates by email.",
    icon: Mail,
  },
  {
    name: "inapp_notification",
    label: "In-app Notification",
    description: "Show alerts inside PrioHRM.",
    icon: Smartphone,
  },
] as const;

function toStatusValue(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

export default function NotificationSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>({
    email_notification: "1",
    inapp_notification: "1",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const result = await notificationSettingsService.get();
        if (cancelled) return;
        setValues({
          email_notification: String(result.data?.email_notification ?? 1),
          inapp_notification: String(result.data?.inapp_notification ?? 1),
        });
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
          message: "Failed to load notification settings. Please try again.",
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
      const result = await notificationSettingsService.update({
        email_notification: toStatusValue(values.email_notification),
        inapp_notification: toStatusValue(values.inapp_notification),
      });
      if (!result.ok) {
        toast.error({
          title: "Save failed",
          message: result.message,
        });
        return;
      }
      setValues({
        email_notification: String(result.data?.email_notification ?? values.email_notification),
        inapp_notification: String(result.data?.inapp_notification ?? values.inapp_notification),
      });
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save notification settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Notifications" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Notifications" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading notification settings…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Notifications" />

              <form id="notification-settings-form" onSubmit={(event) => void handleSave(event)}>
                <div className="notification-option-list">
                  {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <div key={channel.name} className="notification-option">
                        <div className="notification-option-main">
                          <div className="avatar avatar-soft-primary">
                            <Icon size={18} />
                          </div>
                          <div className="notification-option-copy">
                            <h6>{channel.label}</h6>
                            <p>{channel.description}</p>
                          </div>
                        </div>
                        <StatusToggle
                          name={channel.name}
                          value={String(values[channel.name] ?? "1")}
                          onChange={(nextValue) =>
                            setValues((prev) => ({ ...prev, [channel.name]: nextValue }))
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
