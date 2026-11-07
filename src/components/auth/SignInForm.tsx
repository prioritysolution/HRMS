"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";

import { LoginLanguageSelect } from "@/components/auth/LoginLanguageSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, authService } from "@/lib/api";
import { DEFAULT_AUTH_REDIRECT, isAuthPublicPath } from "@/lib/auth/constants";
import {
  FieldErrors,
  SignInValues,
  validateSignIn,
  validateSignInField,
} from "@/lib/auth-validation";
import { useI18n } from "@/i18n";

const initialValues: SignInValues = {
  userName: "",
  password: "",
};

function safeNextPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (isAuthPublicPath(from)) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return from;
}

function readFromQuery(): string | null {
  if (typeof window === "undefined") return null;

  return new URLSearchParams(window.location.search).get("from");
}

export function SignInForm() {
  const toast = useToast();
  const { t } = useI18n();

  const [values, setValues] = useState<SignInValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<keyof SignInValues>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof SignInValues, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    userName: string;
    password: string;
    token: string;
    device: string;
  } | null>(null);

  const errorText = (code?: string) =>
    code ? t(`auth.errors.${code}`) : undefined;

  const setFieldValue = (field: keyof SignInValues, value: string) => {
    const nextValues = { ...values, [field]: value };

    setValues(nextValues);

    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateSignInField(field, nextValues),
      }));
    }
  };

  const handleBlur = (field: keyof SignInValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => ({
      ...prev,
      [field]: validateSignInField(field, values),
    }));
  };

  const signIn = async (userName: string, password: string, confirmationToken?: string) => {
    setSubmitting(true);
    try {
      await authService.login({
        user_name: userName,
        password,
        ...(confirmationToken ? { replace_existing_session: true, confirmation_token: confirmationToken } : {}),
      });
      setConfirmation(null);
      toast.success({ title: t("auth.loginSuccessTitle"), message: t("auth.loginSuccessMessage") });
      window.setTimeout(() => window.location.assign(safeNextPath(readFromQuery())), 700);
    } catch (error) {
      const envelope = error instanceof ApiError && error.status === 409 && error.data && typeof error.data === "object"
        ? error.data as { data?: { confirmation_required?: boolean; previous_device?: string; confirmation_token?: string } }
        : null;
      const next = envelope?.data;
      if (next?.confirmation_required && next.confirmation_token) {
        setConfirmation({ userName, password, token: next.confirmation_token, device: next.previous_device || "Unknown device" });
      } else {
        setConfirmation(null);
        toast.error({ title: t("auth.loginFailedTitle"), message: error instanceof ApiError ? error.message : t("auth.loginFailedMessage") });
      }
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateSignIn(values);

    setErrors(nextErrors);
    setTouched({ userName: true, password: true });

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await signIn(values.userName.trim(), values.password);
  };

  return (
    <>
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <LoginLanguageSelect />

      <div className="login-field">
        <div className="login-input-wrap">
          <UserRound size={21} strokeWidth={2} aria-hidden="true" />

          <input
            id="authUserName"
            type="text"
            placeholder={t("auth.userName")}
            aria-label={t("auth.userName")}
            name="userName"
            autoComplete="username"
            value={values.userName}
            onChange={(event) => setFieldValue("userName", event.target.value)}
            onBlur={() => handleBlur("userName")}
            aria-invalid={touched.userName && Boolean(errors.userName)}
            aria-describedby={
              touched.userName && errors.userName
                ? "authUserNameError"
                : undefined
            }
          />
        </div>

        {touched.userName && errors.userName && (
          <p id="authUserNameError" className="login-field-error">
            {errorText(errors.userName)}
          </p>
        )}
      </div>

      <div className="login-field">
        <div className="login-input-wrap">
          <LockKeyhole size={21} strokeWidth={2} aria-hidden="true" />

          <input
            id="authVerifyPassword"
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.password")}
            aria-label={t("auth.password")}
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => setFieldValue("password", event.target.value)}
            onBlur={() => handleBlur("password")}
            aria-invalid={touched.password && Boolean(errors.password)}
            aria-describedby={
              touched.password && errors.password
                ? "authPasswordError"
                : undefined
            }
          />

          <button
            type="button"
            className="login-eye-button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff size={20} strokeWidth={2} />
            ) : (
              <Eye size={20} strokeWidth={2} />
            )}
          </button>
        </div>

        {touched.password && errors.password && (
          <p id="authPasswordError" className="login-field-error">
            {errorText(errors.password)}
          </p>
        )}
      </div>

      <div className="login-form-options">
        <label className="login-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />

          <span className="login-checkmark" aria-hidden="true" />

          <span>{t("auth.rememberMe")}</span>
        </label>

        <Link href="/forgot-password" className="login-forgot-link">
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <button type="submit" className="login-submit" disabled={submitting}>
        <LogIn size={22} strokeWidth={2.3} aria-hidden="true" />

        <span>{submitting ? t("auth.loggingIn") : t("auth.login")}</span>
      </button>
    </form>
    <ConfirmDialog
      open={confirmation !== null}
      title="Another device is signed in"
      message={`Another device (${confirmation?.device ?? "Unknown device"}) is signed in. Sign it out and continue?`}
      confirmLabel="Sign out and continue"
      loading={submitting}
      onClose={() => setConfirmation(null)}
      onConfirm={() => confirmation ? signIn(confirmation.userName, confirmation.password, confirmation.token) : undefined}
    />
    </>
  );
}
