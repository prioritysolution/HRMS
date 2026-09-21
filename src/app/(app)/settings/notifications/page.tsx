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
import { useI18n } from "@/i18n";

const CHANNELS = [
  {
    name: "inapp_notification" as const,
    icon: Smartphone,
  },
  {
    name: "email_notification" as const,
    icon: Mail,
  },
  {
    name: "sms_notification" as const,
    icon: MessageSquare,
  },
  {
    name: "push_notification" as const,
    icon: Bell,
  },
  {
    name: "whatsapp_notification" as const,
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
  const { t } = useI18n();
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
            title: t("settings.common.loadFailed"),
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: t("settings.common.loadFailed"),
          message: t("settings.notifications.loadError"),
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
      const result = await notificationSettingsService.update({
        in_app: toFlag(values.inapp_notification),
        email: toFlag(values.email_notification),
        sms: toFlag(values.sms_notification),
        push: toFlag(values.push_notification),
        whatsapp: toFlag(values.whatsapp_notification),
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
        message: t("settings.notifications.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("settings.notifications.title")}
        section={t("settings.common.section")}
        hideTitle
      />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.notifications.title")} />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("settings.notifications.loading")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.notifications.title")} />

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
                              {t(`settings.notifications.channels.${channel.name}.label`)}
                              {optional ? (
                                <span className="badge bg-soft-secondary text-secondary text-xs font-medium">
                                  {t("settings.common.optional")}
                                </span>
                              ) : null}
                            </h6>
                            <p>{t(`settings.notifications.channels.${channel.name}.description`)}</p>
                          </div>
                        </div>
                        <StatusToggle
                          name={channel.name}
                          value={String(values[channel.name] ?? "0")}
                          activeLabel={t("common.yes")}
                          inactiveLabel={t("common.no")}
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
