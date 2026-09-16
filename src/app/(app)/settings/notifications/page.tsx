"use client";

import { useEffect, useState } from "react";
import { Bell, Mail, MessageCircle, MessageSquare, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { notificationSettingsService } from "@/lib/api/services/notification-settings.service";
import type { NotificationSettingsRecord } from "@/lib/api/types";
import type { FormValue } from "@/lib/form-validation";

const CHANNELS = [
  {
    name: "inapp_notification" as const,
    label: "In-App",
    description: "Show alerts inside PrioHRM.",
    icon: Smartphone,
  },
  {
    name: "email_notification" as const,
    label: "Email",
    description: "Send alerts and updates by email.",
    icon: Mail,
  },
  {
    name: "sms_notification" as const,
    label: "SMS",
    description: "Send text message notifications to employees.",
    icon: MessageSquare,
  },
  {
    name: "push_notification" as const,
    label: "Push",
    description: "Send mobile push notifications.",
    icon: Bell,
  },
  {
    name: "whatsapp_notification" as const,
    label: "WhatsApp",
    description: "Send WhatsApp alerts when configured.",
    icon: MessageCircle,
    optional: true,
  },
] as const;

function toFlag(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

function toFormValues(data: NotificationSettingsRecord): Record<string, FormValue> {
  return {
    inapp_notification: String(data.in_app ?? data.inapp_notification ?? "0"),
    email_notification: String(data.email ?? data.email_notification ?? "0"),
    sms_notification: String(data.sms ?? data.sms_notification ?? "0"),
    push_notification: String(data.push ?? data.push_notification ?? "0"),
    whatsapp_notification: String(data.whatsapp ?? data.whatsapp_notification ?? "0"),
  };
}

export default function NotificationSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>({
    inapp_notification: "1",
    email_notification: "1",
    sms_notification: "1",
    push_notification: "1",
    whatsapp_notification: "0",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const result = await notificationSettingsService.get();
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
        in_app: toFlag(values.inapp_notification),
        email: toFlag(values.email_notification),
        sms: toFlag(values.sms_notification),
        push: toFlag(values.push_notification),
        whatsapp: toFlag(values.whatsapp_notification),
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
        message: "Failed to save notification settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Notification Settings" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Notification Settings" />
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
              <TableSectionHeader title="Notification Settings" />

              <form id="notification-settings-form" onSubmit={(event) => void handleSave(event)}>
                <div className="notification-option-list">
                  {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    const optional = "optional" in channel && channel.optional;
                    return (
                      <div key={channel.name} className="notification-option">
                        <div className="notification-option-main">
                          <div className="avatar avatar-soft-primary">
                            <Icon size={18} />
                          </div>
                          <div className="notification-option-copy">
                            <h6 className="inline-flex items-center gap-2">
                              {channel.label}
                              {optional ? (
                                <span className="badge bg-soft-secondary text-secondary text-xs font-medium">
                                  Optional
                                </span>
                              ) : null}
                            </h6>
                            <p>{channel.description}</p>
                          </div>
                        </div>
                        <StatusToggle
                          name={channel.name}
                          value={String(values[channel.name] ?? "0")}
                          activeLabel="Yes"
                          inactiveLabel="No"
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
