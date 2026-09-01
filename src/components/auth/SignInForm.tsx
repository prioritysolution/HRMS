"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthInput } from "@/components/auth/AuthInput";
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
  if (isAuthPublicPath(from)) return DEFAULT_AUTH_REDIRECT;
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
  const [touched, setTouched] = useState<Partial<Record<keyof SignInValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

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

    if (Object.keys(nextErrors).length > 0) return;

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
          error instanceof ApiError ? error.message : "Unable to login. Please try again.",
      });
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="authUserName"
        label="Username"
        type="text"
        icon="user"
        placeholder="Enter your username"
        name="userName"
        autoComplete="username"
        value={values.userName}
        onChange={(event) => setFieldValue("userName", event.target.value)}
        onBlur={() => handleBlur("userName")}
        error={touched.userName ? errors.userName : undefined}
      />

      <AuthInput
        id="authVerifyPassword"
        label="Password"
        type="password"
        icon="password"
        placeholder="Enter your password"
        name="password"
        autoComplete="current-password"
        helpText={undefined}
        value={values.password}
        onChange={(event) => setFieldValue("password", event.target.value)}
        onBlur={() => handleBlur("password")}
        error={touched.password ? errors.password : undefined}
        rightSlot={
          <Link href="/forgot-password" className="auth-link-inline hidden sm:inline">
            Forgot password?
          </Link>
        }
      />
      <Link href="/forgot-password" className="auth-link-inline mb-4 sm:hidden">
        Forgot password?
      </Link>

      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
