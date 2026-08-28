"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthInput } from "@/components/auth/AuthInput";
import { ApiError, authService } from "@/lib/api";
import { DEFAULT_AUTH_REDIRECT, isAuthPublicPath } from "@/lib/auth/constants";
import { LOCAL_DEMO_ACCOUNT } from "@/lib/auth/local-auth";
import {
  FieldErrors,
  SignInValues,
  validateSignIn,
  validateSignInField,
} from "@/lib/auth-validation";

const initialValues: SignInValues = {
  emailId: "",
  password: "",
};

function safeNextPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }
  if (isAuthPublicPath(from)) return DEFAULT_AUTH_REDIRECT;
  return from;
}

function SignInFormFields() {
  const searchParams = useSearchParams();
  const [values, setValues] = useState<SignInValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<keyof SignInValues>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignInValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const fillDemoAccount = () => {
    setValues({
      emailId: LOCAL_DEMO_ACCOUNT.email,
      password: LOCAL_DEMO_ACCOUNT.password,
    });
    setErrors({});
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);
    setTouched({ emailId: true, password: true });

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await authService.login({
        email: values.emailId.trim(),
        password: values.password,
      });
      window.location.assign(safeNextPath(searchParams.get("from")));
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-demo-hint">
        <p>
          <strong>Static login</strong> — no backend API required for now.
        </p>
        <p>
          Email: <code>{LOCAL_DEMO_ACCOUNT.email}</code>
        </p>
        <p>
          Password: <code>{LOCAL_DEMO_ACCOUNT.password}</code>
        </p>
        <button type="button" className="auth-demo-fill" onClick={fillDemoAccount}>
          Fill demo login
        </button>
      </div>

      <AuthInput
        id="authVerifyEmail"
        label="Email ID"
        type="email"
        icon="email"
        placeholder="Enter Your Email ID"
        name="emailId"
        autoComplete="email"
        value={values.emailId}
        onChange={(event) => setFieldValue("emailId", event.target.value)}
        onBlur={() => handleBlur("emailId")}
        error={touched.emailId ? errors.emailId : undefined}
      />

      <AuthInput
        id="authVerifyPassword"
        label="Password"
        type="password"
        icon="password"
        placeholder="Enter your password"
        name="password"
        autoComplete="current-password"
        helpText={!errors.password ? "Must be at least 8 characters" : undefined}
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

      {formError && (
        <p className="auth-error mb-3" role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}

export function SignInForm() {
  return (
    <Suspense>
      <SignInFormFields />
    </Suspense>
  );
}
