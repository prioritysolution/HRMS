"use client";

import { FormEvent, useState } from "react";
import { AuthInput } from "@/components/auth/AuthInput";
import { ApiError, authService } from "@/lib/api";
import {
  FieldErrors,
  SignUpValues,
  validateSignUp,
  validateSignUpField,
} from "@/lib/auth-validation";

const initialValues: SignUpValues = {
  userName: "",
  emailId: "",
  password: "",
  confirmPsw: "",
};

export function SignUpForm() {
  const [values, setValues] = useState<SignUpValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<keyof SignUpValues>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setFieldValue = <K extends keyof SignUpValues>(field: K, value: SignUpValues[K]) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateSignUpField(field, nextValues),
      }));
    }
    if (field === "password" && touched.confirmPsw) {
      setErrors((prev) => ({
        ...prev,
        confirmPsw: validateSignUpField("confirmPsw", nextValues),
      }));
    }
  };

  const handleBlur = (field: keyof SignUpValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateSignUpField(field, values),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSignUp(values);
    setErrors(nextErrors);
    setTouched({
      userName: true,
      emailId: true,
      password: true,
      confirmPsw: true,
    });

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await authService.register({
        name: values.userName.trim(),
        email: values.emailId.trim(),
        password: values.password,
      });
      window.location.assign("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Unable to create account. Please check your API connection.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="authUsername"
        label="Username"
        type="text"
        icon="user"
        placeholder="Enter Your Username"
        name="userName"
        autoComplete="name"
        value={values.userName}
        onChange={(event) => setFieldValue("userName", event.target.value)}
        onBlur={() => handleBlur("userName")}
        error={touched.userName ? errors.userName : undefined}
      />

      <AuthInput
        id="authEmail"
        label="Email ID"
        type="email"
        icon="email"
        placeholder="Enter Your Email ID"
        name="emailId"
        autoComplete="email"
        helpText={!errors.emailId ? "We'll never share your email with anyone else." : undefined}
        value={values.emailId}
        onChange={(event) => setFieldValue("emailId", event.target.value)}
        onBlur={() => handleBlur("emailId")}
        error={touched.emailId ? errors.emailId : undefined}
      />

      <AuthInput
        id="authPassword"
        label="Password"
        type="password"
        icon="password"
        placeholder="Create password"
        name="password"
        autoComplete="new-password"
        helpText={!errors.password ? "Must be at least 8 characters" : undefined}
        value={values.password}
        onChange={(event) => setFieldValue("password", event.target.value)}
        onBlur={() => handleBlur("password")}
        error={touched.password ? errors.password : undefined}
      />

      <AuthInput
        id="authConfirmPsw"
        label="Confirm Password"
        type="password"
        icon="password"
        placeholder="Re-enter password"
        name="confirmPsw"
        autoComplete="new-password"
        value={values.confirmPsw}
        onChange={(event) => setFieldValue("confirmPsw", event.target.value)}
        onBlur={() => handleBlur("confirmPsw")}
        error={touched.confirmPsw ? errors.confirmPsw : undefined}
      />

      {formError && (
        <p className="auth-error mb-3" role="alert">
          {formError}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
}
