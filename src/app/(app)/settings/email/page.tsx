"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Send } from "lucide-react";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/i18n";
import { emailConfigService, toEmailConfigWritePayload } from "@/lib/api/services/email-config.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField } from "@/types/hrms";

const HOST_PATTERN =
  /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3}|localhost)$/;

function asWritePayload(values: Record<string, FormValue>) {
  return toEmailConfigWritePayload({
    host: String(values.host ?? "").trim(),
    port: String(values.port ?? "").trim(),
    username: String(values.username ?? "").trim(),
    password: String(values.password ?? ""),
    encryption: String(values.encryption ?? "").trim(),
    from_address: String(values.from_address ?? "").trim(),
    from_name: String(values.from_name ?? "").trim(),
  });
}

export default function EmailConfigPage() {
  const { t } = useI18n();
  const toast = useToast();

  const smtpFieldsTop: FormField[] = useMemo(
    () => [
      {
        label: t("settings.email.fields.mailer"),
        name: "mailer",
        type: "text",
        required: true,
        defaultValue: "SMTP",
        readOnly: true,
      },
      {
        label: t("settings.email.fields.host"),
        name: "host",
        type: "text",
        required: true,
        placeholder: "prioritysolutions.in",
        pattern: HOST_PATTERN,
        patternMessage: t("settings.email.placeholders.hostPattern"),
      },
      {
        label: t("settings.email.fields.port"),
        name: "port",
        type: "number",
        required: true,
        defaultValue: "587",
        min: 1,
        max: 65535,
        placeholder: "587",
      },
      {
        label: t("settings.email.fields.username"),
        name: "username",
        type: "email",
        required: true,
        placeholder: "otp@prioritysolutions.in",
      },
    ],
    [t],
  );

  const passwordField: FormField = useMemo(
    () => ({
      label: t("settings.email.fields.password"),
      name: "password",
      type: "password",
      required: true,
      minLength: 4,
      placeholder: t("settings.email.placeholders.password"),
    }),
    [t],
  );

  const smtpFieldsBottom: FormField[] = useMemo(
    () => [
      {
        label: t("settings.email.fields.encryption"),
        name: "encryption",
        type: "select",
        required: true,
        defaultValue: "tls",
        options: [
          { value: "tls", label: t("settings.email.encryption.tls") },
          { value: "ssl", label: t("settings.email.encryption.ssl") },
          { value: "none", label: t("settings.email.encryption.none") },
        ],
      },
      {
        label: t("settings.email.fields.from_address"),
        name: "from_address",
        type: "email",
        required: true,
        placeholder: "otp@prioritysolutions.in",
      },
      {
        label: t("settings.email.fields.from_name"),
        name: "from_name",
        type: "text",
        required: true,
        minLength: 2,
        maxLength: 100,
        placeholder: "PrioBank",
      },
    ],
    [t],
  );

  const smtpFields: FormField[] = useMemo(
    () => [...smtpFieldsTop, passwordField, ...smtpFieldsBottom],
    [smtpFieldsTop, passwordField, smtpFieldsBottom],
  );

  const testFields: FormField[] = useMemo(
    () => [
      {
        label: t("settings.email.fields.to_email"),
        name: "to_email",
        type: "email",
        required: true,
        placeholder: t("settings.email.placeholders.to_email"),
      },
      {
        label: t("settings.email.fields.subject"),
        name: "subject",
        type: "text",
        required: true,
        defaultValue: "PrioHRM SMTP configuration test",
        minLength: 3,
        maxLength: 150,
      },
      {
        label: t("settings.email.fields.message"),
        name: "message",
        type: "textarea",
        required: true,
        span: "full",
        defaultValue: "This is a test email from PrioHRM to confirm the SMTP configuration.",
        minLength: 5,
        maxLength: 2000,
      },
    ],
    [t],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Record<string, FormValue>>(() => buildInitialFormValues(smtpFields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testValues, setTestValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(testFields),
  );
  const [testErrors, setTestErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const result = await emailConfigService.get();
        if (cancelled) return;
        setValues(
          buildInitialFormValues(smtpFields, {
            id: "email-config",
            ...(result.data ?? {}),
            mailer: "SMTP",
            // Never seed masked API password into the input
            password: "",
          }),
        );
        setErrors({});
        // First-time empty config is normal — don't toast an error
        if (!result.ok && !result.empty) {
          toast.error({
            title: t("settings.common.loadFailed"),
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: "Unable to load settings",
          message: t("settings.email.loadError"),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleSmtpChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = smtpFields.find((item) => item.name === name);
    if (!field) return;
    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleTestChange = (name: string, value: FormValue) => {
    setTestValues((prev) => ({ ...prev, [name]: value }));
    const field = testFields.find((item) => item.name === name);
    if (!field) return;
    setTestErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(smtpFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error({
        title: t("settings.common.validationError"),
        message: t("settings.email.validationMessage"),
      });
      return;
    }

    setSaving(true);
    try {
      const result = await emailConfigService.update(asWritePayload(values));
      if (!result.ok) {
        toast.error({
          title: t("settings.common.saveFailed"),
          message: result.message,
        });
        return;
      }
      setValues((prev) => ({
        ...prev,
        ...buildInitialFormValues(smtpFields, {
          id: "email-config",
          ...(result.data ?? {}),
          mailer: "SMTP",
          // Keep typed password; never show API mask after save
          password: String(values.password ?? ""),
        }),
      }));
      toast.success({ title: t("settings.common.saved"), message: result.message });
    } catch {
      toast.error({
        title: t("settings.common.saveFailed"),
        message: t("settings.email.saveError"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const smtpErrors = validateFormFields(smtpFields, values);
    const nextTestErrors = validateFormFields(testFields, testValues);

    if (Object.keys(smtpErrors).length > 0) {
      setErrors(smtpErrors);
      toast.error({
        title: t("settings.common.validationError"),
        message: t("settings.email.validationMessage"),
      });
      return;
    }

    if (Object.keys(nextTestErrors).length > 0) {
      setTestErrors(nextTestErrors);
      toast.error({
        title: t("settings.common.validationError"),
        message: t("settings.email.validationMessage"),
      });
      return;
    }

    setTesting(true);
    try {
      const result = await emailConfigService.test({
        ...asWritePayload(values),
        to_email: String(testValues.to_email ?? "").trim(),
        subject: String(testValues.subject ?? "").trim(),
        message: String(testValues.message ?? "").trim(),
      });
      if (!result.ok) {
        toast.error({
          title: t("settings.email.testFailed"),
          message: result.message,
        });
        return;
      }
      toast.success({ title: t("settings.email.testSuccess"), message: result.message });
    } catch {
      toast.error({
        title: t("settings.email.testFailed"),
        message: t("settings.email.testError"),
      });
    } finally {
      setTesting(false);
    }
  };

  const passwordError = errors.password;

  return (
    <>
      <PageHeader
        title={t("settings.email.title")}
        section={t("settings.common.section")}
        hideTitle
      />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.email.title")} />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("settings.email.loading")}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title={t("settings.email.title")} />

              <form
                id="email-config-form"
                className="form-grid form-grid-2"
                onSubmit={(event) => void handleSave(event)}
                noValidate
              >
                <FormFieldsRenderer
                  fields={smtpFieldsTop}
                  values={values}
                  errors={errors}
                  onChange={handleSmtpChange}
                />

                <div className={cn("form-field", passwordError && "is-invalid")}>
                  <FormFieldLabel htmlFor="password" label={passwordField.label} required />
                  <div className="ess-password-input-wrap">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={typeof values.password === "string" ? values.password : ""}
                      placeholder={passwordField.placeholder}
                      autoComplete="new-password"
                      onChange={(event) => handleSmtpChange("password", event.target.value)}
                    />
                    <button
                      type="button"
                      className="ess-password-toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? t("settings.email.hidePassword") : t("settings.email.showPassword")}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordError ? (
                    <p className="form-field-error" role="alert">
                      {passwordError}
                    </p>
                  ) : null}
                </div>

                <FormFieldsRenderer
                  fields={smtpFieldsBottom}
                  values={values}
                  errors={errors}
                  onChange={handleSmtpChange}
                />

                <div className="form-span-full flex justify-end pt-2">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? t("settings.common.saving") : t("settings.common.saveConfiguration")}
                  </button>
                </div>
              </form>

              <div className="email-config-test-block">
                <TableSectionHeader title={t("settings.email.testTitle")} />

                <form
                  id="email-test-form"
                  className="form-grid form-grid-2"
                  onSubmit={(event) => void handleTest(event)}
                  noValidate
                >
                  <FormFieldsRenderer
                    fields={testFields}
                    values={testValues}
                    errors={testErrors}
                    onChange={handleTestChange}
                  />

                  <div className="form-span-full flex justify-end pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary inline-flex items-center gap-2"
                      disabled={testing}
                    >
                      <Send size={16} />
                      {testing ? t("settings.email.sending") : t("settings.email.testSend")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
