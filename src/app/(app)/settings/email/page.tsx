"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Send } from "lucide-react";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { emailConfigService, toEmailConfigWritePayload } from "@/lib/api/services/email-config.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField } from "@/types/hrms";

const HOST_PATTERN =
  /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3}|localhost)$/;

const smtpFieldsTop: FormField[] = [
  {
    label: "Mailer",
    name: "mailer",
    type: "text",
    required: true,
    defaultValue: "SMTP",
    readOnly: true,
  },
  {
    label: "Host",
    name: "host",
    type: "text",
    required: true,
    placeholder: "prioritysolutions.in",
    pattern: HOST_PATTERN,
    patternMessage: "Enter a valid host name (e.g. smtp.example.com).",
  },
  {
    label: "Port",
    name: "port",
    type: "number",
    required: true,
    defaultValue: "587",
    min: 1,
    max: 65535,
    placeholder: "587",
  },
  {
    label: "Username",
    name: "username",
    type: "email",
    required: true,
    placeholder: "otp@prioritysolutions.in",
  },
];

const passwordField: FormField = {
  label: "Password",
  name: "password",
  type: "password",
  required: true,
  minLength: 4,
  placeholder: "Enter SMTP password",
};

const smtpFieldsBottom: FormField[] = [
  {
    label: "Encryption",
    name: "encryption",
    type: "select",
    required: true,
    defaultValue: "tls",
    options: [
      { value: "tls", label: "TLS" },
      { value: "ssl", label: "SSL" },
      { value: "none", label: "None" },
    ],
  },
  {
    label: "From Address",
    name: "from_address",
    type: "email",
    required: true,
    placeholder: "otp@prioritysolutions.in",
  },
  {
    label: "From Name",
    name: "from_name",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 100,
    placeholder: "PrioBank",
  },
];

const smtpFields: FormField[] = [...smtpFieldsTop, passwordField, ...smtpFieldsBottom];

const testFields: FormField[] = [
  {
    label: "Recipient Email",
    name: "to_email",
    type: "email",
    required: true,
    placeholder: "Enter recipient email",
  },
  {
    label: "Subject",
    name: "subject",
    type: "text",
    required: true,
    defaultValue: "PrioHRM SMTP configuration test",
    minLength: 3,
    maxLength: 150,
  },
  {
    label: "Message",
    name: "message",
    type: "textarea",
    required: true,
    span: "full",
    defaultValue: "This is a test email from PrioHRM to confirm the SMTP configuration.",
    minLength: 5,
    maxLength: 2000,
  },
];

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
  const toast = useToast();
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
            title: "Unable to load settings",
            message: result.message,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error({
          title: "Unable to load settings",
          message: "Failed to load email configuration. Please try again.",
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
      toast.error({ title: "Validation error", message: "Please fill all mandatory SMTP fields." });
      return;
    }

    setSaving(true);
    try {
      const result = await emailConfigService.update(asWritePayload(values));
      if (!result.ok) {
        toast.error({
          title: "Save failed",
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
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save email configuration. Please try again.",
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
        title: "SMTP incomplete",
        message: "Complete and validate SMTP configuration before sending a test email.",
      });
      return;
    }

    if (Object.keys(nextTestErrors).length > 0) {
      setTestErrors(nextTestErrors);
      toast.error({ title: "Validation error", message: "Please fill all test email fields." });
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
          title: "Test failed",
          message: result.message,
        });
        return;
      }
      toast.success({ title: "Test email sent", message: result.message });
    } catch {
      toast.error({
        title: "Test failed",
        message: "Failed to send test email. Please try again.",
      });
    } finally {
      setTesting(false);
    }
  };

  const passwordError = errors.password;

  return (
    <>
      <PageHeader title="Email Configuration" section="Settings" hideTitle />
      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Email Configuration" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading email configuration…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Email Configuration" />

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
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                    {saving ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </form>

              <div className="email-config-test-block">
                <TableSectionHeader title="Test Email" />

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
                      {testing ? "Sending..." : "Send Test Email"}
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
