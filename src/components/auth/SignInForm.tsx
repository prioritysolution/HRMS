"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, authService } from "@/lib/api";
import { DEFAULT_AUTH_REDIRECT, isAuthPublicPath } from "@/lib/auth/constants";
import {
  FieldErrors,
  SignInValues,
  validateSignIn,
  validateSignInField,
} from "@/lib/auth-validation";

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

  const [values, setValues] = useState<SignInValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<keyof SignInValues>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof SignInValues, boolean>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateSignIn(values);

    setErrors(nextErrors);
    setTouched({ userName: true, password: true });

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await authService.login({
        user_name: values.userName.trim(),
        password: values.password,
      });

      toast.success({
        title: "Logged in successfully",
        message: "Redirecting to your workspace...",
      });

      window.setTimeout(() => {
        window.location.assign(safeNextPath(readFromQuery()));
      }, 700);
    } catch (error) {
      toast.error({
        title: "Login failed",
        message:
          error instanceof ApiError
            ? error.message
            : "Unable to login. Please try again.",
      });

      setSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {/* =====================================================
          USERNAME
         ===================================================== */}

      <div className="login-field">
        <div className="login-input-wrap">
          <UserRound size={21} strokeWidth={2} aria-hidden="true" />

          <input
            id="authUserName"
            type="text"
            placeholder="User Name"
            aria-label="User Name"
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
            {errors.userName}
          </p>
        )}
      </div>

      {/* =====================================================
          PASSWORD
         ===================================================== */}

      <div className="login-field">
        <div className="login-input-wrap">
          <LockKeyhole size={21} strokeWidth={2} aria-hidden="true" />

          <input
            id="authVerifyPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            aria-label="Password"
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
            aria-label={showPassword ? "Hide password" : "Show password"}
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
            {errors.password}
          </p>
        )}
      </div>

      {/* =====================================================
          REMEMBER + FORGOT PASSWORD
         ===================================================== */}

      <div className="login-form-options">
        <label className="login-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />

          <span className="login-checkmark" aria-hidden="true" />

          <span>Remember me</span>
        </label>

        <Link href="/forgot-password" className="login-forgot-link">
          Forgot password?
        </Link>
      </div>

      {/* =====================================================
          LOGIN BUTTON
         ===================================================== */}

      <button type="submit" className="login-submit" disabled={submitting}>
        <LogIn size={22} strokeWidth={2.3} aria-hidden="true" />

        <span>{submitting ? "Logging in..." : "Login"}</span>
      </button>
    </form>
  );
}
